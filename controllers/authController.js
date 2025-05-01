const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Token generator
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Create or Login
exports.createorlogin = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    // Check if user exists
    let user = await User.findOne({ where: { userId } });

    if (!user) {
      // If user not found, create new user
      user = await User.create({ userId });
    }

    // Generate token
    const token = generateToken(user.userId);

    res.status(200).json({ 
      message: 'Login successful', 
      token 
    });
    
  } catch (error) {
    console.error('Error during create or login:', error);
    res.status(500).json({ message: 'Error during create or login', error });
  }
};
