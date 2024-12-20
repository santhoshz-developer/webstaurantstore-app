const AWS = require("aws-sdk");

/**
 * Initialize AWS SDK with default configurations
 */
const configureAWS = () => {
  AWS.config.update({
    region: process.env.AWS_ACCESS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY, // Use environment variable
    secretAccessKey: process.env.AWS_SECRETACCESS_KEY, 
  });

  return AWS; // Return configured AWS SDK
};

module.exports = configureAWS;
