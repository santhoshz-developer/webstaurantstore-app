const redis = require('redis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
};

// Create Redis client
const client = redis.createClient(redisConfig);

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

client.on('ready', () => {
  console.log('✅ Redis ready to receive commands');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await client.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
  }
};

// Cache helper functions
const cache = {
  // Set cache with optional expiration (in seconds)
  set: async (key, value, expiration = 3600) => {
    try {
      const serializedValue = JSON.stringify(value);
      if (expiration) {
        await client.setEx(key, expiration, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  // Get cache
  get: async (key) => {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Delete cache
  del: async (key) => {
    try {
      return await client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  // Delete multiple keys
  delPattern: async (pattern) => {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        return await client.del(keys);
      }
      return 0;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      return await client.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  // Set expiration for existing key
  expire: async (key, seconds) => {
    try {
      return await client.expire(key, seconds);
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }
};

module.exports = {
  client,
  connectRedis,
  cache
};