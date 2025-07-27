import React, { Suspense, lazy, useMemo } from 'react';
import { useShopStore } from '@/store/shopStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy load all possible modules
const SupermarketModules = {
  InventoryModule: lazy(() => import('./supermarket/InventoryModule')),
  CategoriesModule: lazy(() => import('./supermarket/CategoriesModule')),
  ProductsModule: lazy(() => import('./supermarket/ProductsModule')),
  OrdersModule: lazy(() => import('./supermarket/OrdersModule')),
  CustomersModule: lazy(() => import('./shared/CustomersModule')),
  AnalyticsModule: lazy(() => import('./shared/AnalyticsModule'))
};

const SaloonModules = {
  ServicesModule: lazy(() => import('./saloon/ServicesModule')),
  BookingsModule: lazy(() => import('./saloon/BookingsModule')),
  StaffModule: lazy(() => import('./saloon/StaffModule')),
  CustomersModule: lazy(() => import('./shared/CustomersModule')),
  AnalyticsModule: lazy(() => import('./shared/AnalyticsModule'))
};

const TeaStallModules = {
  ProductsModule: lazy(() => import('./tea_stall/ProductsModule')),
  QuickOrdersModule: lazy(() => import('./tea_stall/QuickOrdersModule')),
  QuickOrderModule: lazy(() => import('./tea_stall/QuickOrderModule')),
  AnalyticsModule: lazy(() => import('./shared/AnalyticsModule'))
};

const HotelModules = {
  RoomsModule: lazy(() => import('./hotel/RoomsModule')),
  HotelBookingsModule: lazy(() => import('./hotel/HotelBookingsModule')),
  GuestsModule: lazy(() => import('./hotel/GuestsModule')),
  HotelServicesModule: lazy(() => import('./hotel/HotelServicesModule')),
  AnalyticsModule: lazy(() => import('./shared/AnalyticsModule'))
};

const MedicalModules = {
  MedicalServicesModule: lazy(() => import('./medical/MedicalServicesModule')),
  AppointmentsModule: lazy(() => import('./medical/AppointmentsModule')),
  PatientsModule: lazy(() => import('./medical/PatientsModule')),
  MedicalStaffModule: lazy(() => import('./medical/MedicalStaffModule')),
  AnalyticsModule: lazy(() => import('./shared/AnalyticsModule'))
};

// Default fallback module
const DefaultModule = lazy(() => import('./shared/DefaultModule'));

interface ModuleRendererProps {
  moduleName: string;
  moduleConfig?: any;
  className?: string;
}

// Loading skeleton component
const ModuleLoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

// Error fallback component
const ModuleErrorFallback: React.FC<{ moduleName: string; onRetry: () => void }> = ({ 
  moduleName, 
  onRetry 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-8 text-center"
  >
    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Failed to load {moduleName}
    </h3>
    <p className="text-gray-600 mb-4">
      There was an error loading this module. Please try again.
    </p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Retry
    </button>
  </motion.div>
);

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({
  moduleName,
  moduleConfig,
  className = ''
}) => {
  const { currentShop, isModuleEnabled } = useShopStore();
  const [retryKey, setRetryKey] = React.useState(0);

  // Get the appropriate module based on shop type
  const ModuleComponent = useMemo(() => {
    if (!currentShop) return null;

    const moduleMap = {
      supermarket: SupermarketModules,
      saloon: SaloonModules,
      tea_stall: TeaStallModules,
      hotel: HotelModules,
      medical: MedicalModules
    };

    const shopTypeModules = moduleMap[currentShop.shop_type_name as keyof typeof moduleMap];
    if (!shopTypeModules) return DefaultModule;

    const Component = shopTypeModules[moduleName as keyof typeof shopTypeModules];
    return Component || DefaultModule;
  }, [currentShop?.shop_type_name, moduleName, retryKey]);

  // Check if module is enabled for this shop
  if (!currentShop) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No shop selected</p>
      </div>
    );
  }

  if (!isModuleEnabled(moduleName)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center"
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Module Not Available
          </h3>
          <p className="text-yellow-700">
            The {moduleName} module is not enabled for this shop type or has been disabled.
          </p>
        </div>
      </motion.div>
    );
  }

  if (!ModuleComponent) {
    return (
      <ModuleErrorFallback
        moduleName={moduleName}
        onRetry={() => setRetryKey(prev => prev + 1)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
      key={retryKey}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading {moduleName}...</span>
          </div>
        }
      >
        <ErrorBoundary
          fallback={
            <ModuleErrorFallback
              moduleName={moduleName}
              onRetry={() => setRetryKey(prev => prev + 1)}
            />
          }
        >
          <ModuleComponent 
            shopId={currentShop.id}
            shopType={currentShop.shop_type_name}
            config={moduleConfig}
            theme={currentShop.configuration.ui_theme}
          />
        </ErrorBoundary>
      </Suspense>
    </motion.div>
  );
};

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Module error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Hook for dynamically loading modules
export const useModuleLoader = () => {
  const { currentShop, shopModules } = useShopStore();

  const loadModule = React.useCallback(async (moduleName: string) => {
    if (!currentShop) return null;

    try {
      // Find module configuration
      const moduleConfig = shopModules.find(m => m.name === moduleName);
      
      if (!moduleConfig?.is_enabled) {
        throw new Error(`Module ${moduleName} is not enabled`);
      }

      return {
        component: moduleName,
        config: moduleConfig.configuration,
        ui_config: moduleConfig.ui_config
      };
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
      return null;
    }
  }, [currentShop, shopModules]);

  const getAvailableModules = React.useCallback(() => {
    if (!currentShop) return [];

    return shopModules
      .filter(module => module.is_enabled)
      .map(module => ({
        name: module.name,
        displayName: module.name.replace(/([A-Z])/g, ' $1').trim(),
        route: module.ui_config.route,
        component: module.ui_config.component
      }));
  }, [currentShop, shopModules]);

  return {
    loadModule,
    getAvailableModules,
    currentShopType: currentShop?.shop_type_name
  };
};

export default ModuleRenderer;