const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const token = req.header('Authorization');
    console.log('Verifying token:', token);

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Access denied - No token provided' });
    }

    const verified = jwt.verify(token, 'your_jwt_secret');
    console.log('Token verified:', verified);
    
    req.user = verified;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken; 