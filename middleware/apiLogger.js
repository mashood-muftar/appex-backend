import logger from '../utils/logger.js';

/**
 * Middleware for logging detailed API request information
 */
const apiLogger = (req, res, next) => {
  // Save original end function
  const originalEnd = res.end;
  
  // Get request start time
  const startTime = Date.now();
  
  // Store request body (if not multipart/form-data)
  const requestBody = req.method !== 'GET' && !req.is('multipart/form-data') 
    ? JSON.stringify(req.body) 
    : '';
  
  // Override end function to capture response data
  res.end = function(chunk, encoding) {
    // Calculate request duration
    const duration = Date.now() - startTime;
    
    // Log request details
    logger.http({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      requestBody: requestBody,
      requestId: req.headers['x-request-id'] || null,
      userId: req.user ? req.user.id : null
    });
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

export default apiLogger; 