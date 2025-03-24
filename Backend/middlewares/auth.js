const jwt = require('jsonwebtoken');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Please log in.'
      });
    }

    // 2) Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // No need to manually check expiration - jwt.verify already does this
      // and throws an error if token is expired
      
      // 3) Attach user to request
      req.user = { id: decoded.id };
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      // Provide specific messages for different JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'fail',
          message: 'Your session has expired. Please log in again.'
        });
      }
      
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid authentication token. Please log in again.'
      });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Authentication error occurred'
    });
  }
};