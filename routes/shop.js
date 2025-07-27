const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const { cache } = require('../config/redis');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// QR Code scanning endpoint - Core functionality for detecting shop
router.post('/scan-qr', optionalAuth, async (req, res) => {
  try {
    const { qr_code, qr_data } = req.body;
    
    let shopQRCode = qr_code;
    
    // If QR data is provided (scanned QR code content), parse it
    if (qr_data) {
      try {
        const qrContent = JSON.parse(qr_data);
        if (qrContent.type === 'shop' && qrContent.qr_code) {
          shopQRCode = qrContent.qr_code;
        }
      } catch (error) {
        // If not JSON, treat as direct QR code
        shopQRCode = qr_data;
      }
    }
    
    if (!shopQRCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required'
      });
    }
    
    // Find shop by QR code
    const shop = await Shop.findByQRCode(shopQRCode);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found or inactive'
      });
    }
    
    // Track analytics event
    if (req.user) {
      // Log analytics for authenticated users
      // Implementation would go here
    }
    
    // Return shop data with configuration
    res.json({
      success: true,
      data: {
        shop: shop.toJSON(),
        redirect_url: `/shop/${shop.slug}`,
        modules: shop.getConfiguration().modules,
        features: shop.getConfiguration().features,
        ui_theme: shop.getConfiguration().ui_theme
      }
    });
    
  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get shop by slug (public endpoint)
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const shop = await Shop.findBySlug(slug);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    // Get shop configuration and enabled modules
    const configuration = shop.getConfiguration();
    
    // Track page view
    if (req.user) {
      // Log analytics
    }
    
    res.json({
      success: true,
      data: {
        shop: shop.toJSON(),
        configuration,
        modules: await shop.getModules(),
        is_open: shop.isOpen()
      }
    });
    
  } catch (error) {
    console.error('Shop fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get shop configuration (for dynamic module loading)
router.get('/:slug/config', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const shop = await Shop.findBySlug(slug);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    const configuration = shop.getConfiguration();
    
    res.json({
      success: true,
      data: {
        shop_id: shop.id,
        shop_type: shop.shop_type_name,
        modules: configuration.modules,
        features: configuration.features,
        ui_theme: configuration.ui_theme,
        colors: configuration.colors,
        business_hours: shop.business_hours ? JSON.parse(shop.business_hours) : {},
        is_open: shop.isOpen()
      }
    });
    
  } catch (error) {
    console.error('Shop config fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get shop modules with their UI components (for dynamic loading)
router.get('/:slug/modules', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const shop = await Shop.findBySlug(slug);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    const modules = await shop.getModules();
    const enabledModules = modules.filter(m => m.is_enabled);
    
    // Define module configurations based on shop type
    const moduleConfigs = {
      supermarket: {
        inventory: { component: 'InventoryModule', route: '/inventory' },
        categories: { component: 'CategoriesModule', route: '/categories' },
        products: { component: 'ProductsModule', route: '/products' },
        orders: { component: 'OrdersModule', route: '/orders' },
        customers: { component: 'CustomersModule', route: '/customers' },
        analytics: { component: 'AnalyticsModule', route: '/analytics' }
      },
      saloon: {
        services: { component: 'ServicesModule', route: '/services' },
        bookings: { component: 'BookingsModule', route: '/bookings' },
        staff: { component: 'StaffModule', route: '/staff' },
        customers: { component: 'CustomersModule', route: '/customers' },
        analytics: { component: 'AnalyticsModule', route: '/analytics' }
      },
      tea_stall: {
        products: { component: 'ProductsModule', route: '/products' },
        orders: { component: 'QuickOrdersModule', route: '/orders' },
        quick_order: { component: 'QuickOrderModule', route: '/quick-order' },
        analytics: { component: 'AnalyticsModule', route: '/analytics' }
      },
      hotel: {
        rooms: { component: 'RoomsModule', route: '/rooms' },
        bookings: { component: 'HotelBookingsModule', route: '/bookings' },
        guests: { component: 'GuestsModule', route: '/guests' },
        services: { component: 'HotelServicesModule', route: '/services' },
        analytics: { component: 'AnalyticsModule', route: '/analytics' }
      },
      medical: {
        services: { component: 'MedicalServicesModule', route: '/services' },
        appointments: { component: 'AppointmentsModule', route: '/appointments' },
        patients: { component: 'PatientsModule', route: '/patients' },
        staff: { component: 'MedicalStaffModule', route: '/staff' },
        analytics: { component: 'AnalyticsModule', route: '/analytics' }
      }
    };
    
    const shopTypeConfigs = moduleConfigs[shop.shop_type_name] || {};
    
    const moduleData = enabledModules.map(module => ({
      name: module.module_name,
      is_enabled: module.is_enabled,
      configuration: module.configuration ? JSON.parse(module.configuration) : {},
      ui_config: shopTypeConfigs[module.module_name] || {
        component: 'DefaultModule',
        route: `/${module.module_name}`
      }
    }));
    
    res.json({
      success: true,
      data: {
        shop_type: shop.shop_type_name,
        modules: moduleData
      }
    });
    
  } catch (error) {
    console.error('Shop modules fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate QR code for shop
router.get('/:slug/qr-code', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const shop = await Shop.findBySlug(slug);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    // Check if user has permission to access this shop
    if (req.user.role !== 'super_admin' && req.user.shop_id !== shop.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const qrCodeDataURL = await shop.generateQRCodeImage();
    
    res.json({
      success: true,
      data: {
        qr_code: shop.qr_code,
        qr_image: qrCodeDataURL,
        scan_url: `${process.env.FRONTEND_URL}/scan?qr=${shop.qr_code}`
      }
    });
    
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update shop settings (admin only)
router.put('/:slug/settings', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const shop = await Shop.findBySlug(slug);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.shop_id !== shop.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await shop.updateSettings(req.body);
    
    res.json({
      success: true,
      message: 'Shop settings updated successfully'
    });
    
  } catch (error) {
    console.error('Shop settings update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enable/disable shop module
router.put('/:slug/modules/:moduleName', authenticateToken, async (req, res) => {
  try {
    const { slug, moduleName } = req.params;
    const { is_enabled, configuration } = req.body;
    
    const shop = await Shop.findBySlug(slug);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.shop_id !== shop.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await shop.updateModule(moduleName, is_enabled, configuration);
    
    res.json({
      success: true,
      message: `Module ${moduleName} updated successfully`
    });
    
  } catch (error) {
    console.error('Module update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get shop analytics
router.get('/:slug/analytics', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const { start_date, end_date } = req.query;
    
    const shop = await Shop.findBySlug(slug);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.shop_id !== shop.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const analyticsData = await shop.getAnalytics(start_date, end_date);
    const recentOrders = await shop.getRecentOrders();
    
    res.json({
      success: true,
      data: {
        analytics: analyticsData,
        recent_orders: recentOrders
      }
    });
    
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;