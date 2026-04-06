const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization header',
        message: 'Please login again'
      })
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'Please login again'
      })
    }

    const token = authHeader.split(' ')[1]

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Please login again'
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Session expired. Please login again'
      })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please login again'
      })
    }
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Please login again'
    })
  }
}

module.exports = authMiddleware
