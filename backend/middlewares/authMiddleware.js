/**
 * Authentication Middleware
 * Handles JWT validation for protected routes
 */

const jwt = require('jsonwebtoken');

class AuthMiddleware {
  /**
   * Validate JWT token from request headers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  validateJwt(req, res, next) {
    try {
      // For testing purposes only - skip auth in development
      // In production, this would properly validate the JWT
      if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
        req.userId = 'test-user-id';
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          data: null,
          error: 'Unauthorized - No token provided'
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify token using the JWT_SECRET from environment variables
      // In a real implementation, this would validate against Supabase JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
      
      // Add user ID to request for use in controllers
      req.userId = decoded.sub || decoded.user_id;
      
      next();
    } catch (error) {
      console.error('JWT validation error:', error);
      return res.status(401).json({
        data: null,
        error: 'Unauthorized - Invalid token'
      });
    }
  }
}

module.exports = new AuthMiddleware();
