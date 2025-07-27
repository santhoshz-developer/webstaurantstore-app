const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/database');

// Authenticate JWT token (required)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database
    const user = await queryOne(
      'SELECT * FROM users WHERE id = ? AND is_verified = true',
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await queryOne(
        'SELECT * FROM users WHERE id = ? AND is_verified = true',
        [decoded.userId]
      );
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
    
  } catch (error) {
    // Silently continue without user if token is invalid
    next();
  }
};

// Check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Check if user belongs to specific shop
const requireShopAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Super admins have access to all shops
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    const shopId = req.params.shopId || req.body.shop_id || req.query.shop_id;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID required'
      });
    }
    
    if (req.user.shop_id !== parseInt(shopId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this shop'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Shop access middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireShopAccess
};