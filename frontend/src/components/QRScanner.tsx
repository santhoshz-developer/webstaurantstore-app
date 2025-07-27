import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerConfig, Html5QrcodeResult } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  QrCode,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useShopStore } from '@/store/shopStore';
import { shopApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface QRScannerProps {
  onSuccess: (shopData: any) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onSuccess,
  onError,
  onClose
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentShop } = useShopStore();

  const scannerConfig: Html5QrcodeScannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0,
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
    defaultZoomValueIfSupported: 2,
  };

  // Process QR code data
  const processQRCode = async (qrData: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await shopApi.scanQR(qrData);
      
      if (response.success && response.data) {
        setCurrentShop(response.data.shop);
        onSuccess(response.data);
        toast.success(`Welcome to ${response.data.shop.name}!`);
      } else {
        throw new Error(response.message || 'Shop not found');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process QR code';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle successful QR scan
  const handleScanSuccess = (decodedText: string, decodedResult: Html5QrcodeResult) => {
    stopScanner();
    processQRCode(decodedText);
  };

  // Handle scan error
  const handleScanError = (error: string) => {
    // Only log errors that aren't "No QR code found"
    if (!error.includes('No QR code found')) {
      console.warn('QR scan error:', error);
    }
  };

  // Start camera scanner
  const startScanner = () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        scannerConfig,
        false
      );
    }

    scannerRef.current.render(handleScanSuccess, handleScanError);
    setIsScanning(true);
    setScannerReady(true);
  };

  // Stop scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        scannerRef.current = null;
      }).catch(console.error);
    }
    setIsScanning(false);
    setScannerReady(false);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Use html5-qrcode to scan the uploaded image
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader-file');
      
      const qrCodeMessage = await html5QrCode.scanFile(file, true);
      await processQRCode(qrCodeMessage);
      
    } catch (err: any) {
      const errorMessage = 'Could not read QR code from image. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Switch scan mode
  const switchMode = (mode: 'camera' | 'upload') => {
    if (mode === scanMode) return;
    
    stopScanner();
    setScanMode(mode);
    setError(null);
    
    if (mode === 'camera') {
      setTimeout(startScanner, 100);
    }
  };

  // Initialize camera scanner on mount
  useEffect(() => {
    if (scanMode === 'camera') {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <QrCode className="w-6 h-6" />
              <h2 className="text-xl font-bold">Scan QR Code</h2>
            </div>
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          {/* Mode Switcher */}
          <div className="flex mt-4 bg-white bg-opacity-20 rounded-lg p-1">
            <button
              onClick={() => switchMode('camera')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all ${
                scanMode === 'camera'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">Camera</span>
            </button>
            <button
              onClick={() => switchMode('upload')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all ${
                scanMode === 'upload'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Upload</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center space-x-3"
              >
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-700 font-medium">Processing QR code...</span>
              </motion.div>
            )}

            {scanMode === 'camera' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div
                  id="qr-reader"
                  className="w-full bg-gray-100 rounded-lg overflow-hidden"
                  style={{ minHeight: '300px' }}
                />
                
                {!scannerReady && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Initializing camera...</span>
                  </div>
                )}
              </motion.div>
            )}

            {scanMode === 'upload' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Click to upload QR code image</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Supports JPG, PNG, GIF formats
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Hidden element for file scanning */}
                <div id="qr-reader-file" className="hidden" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Position the QR code within the scanning area</li>
              <li>• Ensure good lighting for better detection</li>
              <li>• Hold your device steady while scanning</li>
              <li>• Use upload option if camera scan doesn't work</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QRScanner;