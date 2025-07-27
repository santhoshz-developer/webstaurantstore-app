const { query, queryOne } = require('../config/database');
const { cache } = require('../config/redis');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class Shop {
  constructor(data) {
    Object.assign(this, data);
  }

  // Get shop by QR code
  static async findByQRCode(qrCode) {
    const cacheKey = `shop:qr:${qrCode}`;
    let shop = await cache.get(cacheKey);
    
    if (!shop) {
      const sql = `
        SELECT s.*, st.name as shop_type_name, st.display_name as shop_type_display_name,
               st.default_config, s.module_config, s.theme_config
        FROM shops s
        JOIN shop_types st ON s.shop_type_id = st.id
        WHERE s.qr_code = ? AND s.status = 'active'
      `;
      shop = await queryOne(sql, [qrCode]);
      
      if (shop) {
        // Cache for 1 hour
        await cache.set(cacheKey, shop, 3600);
      }
    }
    
    return shop ? new Shop(shop) : null;
  }

  // Get shop by ID
  static async findById(id) {
    const cacheKey = `shop:id:${id}`;
    let shop = await cache.get(cacheKey);
    
    if (!shop) {
      const sql = `
        SELECT s.*, st.name as shop_type_name, st.display_name as shop_type_display_name,
               st.default_config, s.module_config, s.theme_config
        FROM shops s
        JOIN shop_types st ON s.shop_type_id = st.id
        WHERE s.id = ? AND s.status = 'active'
      `;
      shop = await queryOne(sql, [id]);
      
      if (shop) {
        await cache.set(cacheKey, shop, 3600);
      }
    }
    
    return shop ? new Shop(shop) : null;
  }

  // Get shop by slug
  static async findBySlug(slug) {
    const cacheKey = `shop:slug:${slug}`;
    let shop = await cache.get(cacheKey);
    
    if (!shop) {
      const sql = `
        SELECT s.*, st.name as shop_type_name, st.display_name as shop_type_display_name,
               st.default_config, s.module_config, s.theme_config
        FROM shops s
        JOIN shop_types st ON s.shop_type_id = st.id
        WHERE s.slug = ? AND s.status = 'active'
      `;
      shop = await queryOne(sql, [slug]);
      
      if (shop) {
        await cache.set(cacheKey, shop, 3600);
      }
    }
    
    return shop ? new Shop(shop) : null;
  }

  // Create new shop
  static async create(shopData) {
    const qrCode = uuidv4();
    const slug = shopData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    const sql = `
      INSERT INTO shops (name, slug, shop_type_id, qr_code, owner_name, email, phone, 
                        address, logo_url, theme_config, module_config, business_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      shopData.name,
      slug,
      shopData.shop_type_id,
      qrCode,
      shopData.owner_name,
      shopData.email,
      shopData.phone,
      shopData.address,
      shopData.logo_url,
      JSON.stringify(shopData.theme_config || {}),
      JSON.stringify(shopData.module_config || {}),
      JSON.stringify(shopData.business_hours || {})
    ];
    
    const result = await query(sql, params);
    return this.findById(result.insertId);
  }

  // Get shop configuration (merged default + custom)
  getConfiguration() {
    const defaultConfig = this.default_config ? JSON.parse(this.default_config) : {};
    const moduleConfig = this.module_config ? JSON.parse(this.module_config) : {};
    const themeConfig = this.theme_config ? JSON.parse(this.theme_config) : {};
    
    return {
      modules: [...(defaultConfig.modules || []), ...(moduleConfig.enabled_modules || [])],
      features: [...(defaultConfig.features || []), ...(moduleConfig.enabled_features || [])],
      ui_theme: themeConfig.ui_theme || defaultConfig.ui_theme || 'default',
      colors: themeConfig.colors || defaultConfig.colors || {},
      disabled_modules: moduleConfig.disabled_modules || [],
      disabled_features: moduleConfig.disabled_features || []
    };
  }

  // Check if module is enabled
  isModuleEnabled(moduleName) {
    const config = this.getConfiguration();
    return config.modules.includes(moduleName) && !config.disabled_modules.includes(moduleName);
  }

  // Check if feature is enabled
  isFeatureEnabled(featureName) {
    const config = this.getConfiguration();
    return config.features.includes(featureName) && !config.disabled_features.includes(featureName);
  }

  // Generate QR Code image
  async generateQRCodeImage() {
    const qrData = {
      type: 'shop',
      qr_code: this.qr_code,
      shop_id: this.id,
      shop_name: this.name
    };
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw error;
    }
  }

  // Get shop modules with their status
  async getModules() {
    const sql = `
      SELECT module_name, is_enabled, configuration
      FROM shop_modules
      WHERE shop_id = ?
      ORDER BY module_name
    `;
    return await query(sql, [this.id]);
  }

  // Update module status
  async updateModule(moduleName, isEnabled, configuration = null) {
    const sql = `
      INSERT INTO shop_modules (shop_id, module_name, is_enabled, configuration)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      is_enabled = VALUES(is_enabled),
      configuration = VALUES(configuration),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    await query(sql, [this.id, moduleName, isEnabled, JSON.stringify(configuration)]);
    
    // Clear cache
    await cache.delPattern(`shop:*`);
    await cache.delPattern(`modules:${this.id}:*`);
  }

  // Get shop analytics data
  async getAnalytics(startDate, endDate) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        event_type,
        COUNT(*) as count
      FROM analytics_events
      WHERE shop_id = ? AND created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at), event_type
      ORDER BY date DESC, event_type
    `;
    
    return await query(sql, [this.id, startDate, endDate]);
  }

  // Get recent orders
  async getRecentOrders(limit = 10) {
    const sql = `
      SELECT o.*, c.first_name, c.last_name, c.email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.shop_id = ?
      ORDER BY o.created_at DESC
      LIMIT ?
    `;
    
    return await query(sql, [this.id, limit]);
  }

  // Update shop settings
  async updateSettings(settings) {
    const sql = `
      UPDATE shops 
      SET name = ?, email = ?, phone = ?, address = ?, 
          theme_config = ?, module_config = ?, business_hours = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [
      settings.name || this.name,
      settings.email || this.email,
      settings.phone || this.phone,
      settings.address || this.address,
      JSON.stringify(settings.theme_config || this.theme_config),
      JSON.stringify(settings.module_config || this.module_config),
      JSON.stringify(settings.business_hours || this.business_hours),
      this.id
    ];
    
    await query(sql, params);
    
    // Clear cache
    await cache.delPattern(`shop:*`);
  }

  // Get business hours for a specific day
  getBusinessHours(dayOfWeek) {
    const businessHours = this.business_hours ? JSON.parse(this.business_hours) : {};
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dayOfWeek];
    
    return businessHours[dayName] || { open: '09:00', close: '21:00', closed: false };
  }

  // Check if shop is currently open
  isOpen() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().substr(0, 5); // HH:MM format
    
    const hours = this.getBusinessHours(dayOfWeek);
    
    if (hours.closed) return false;
    
    return currentTime >= hours.open && currentTime <= hours.close;
  }

  // Convert to JSON (for API responses)
  toJSON() {
    const { default_config, ...shopData } = this;
    return {
      ...shopData,
      configuration: this.getConfiguration(),
      is_open: this.isOpen(),
      business_hours: this.business_hours ? JSON.parse(this.business_hours) : {},
      theme_config: this.theme_config ? JSON.parse(this.theme_config) : {},
      module_config: this.module_config ? JSON.parse(this.module_config) : {}
    };
  }
}

module.exports = Shop;