const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      message: 'Protected route accessed successfully',
      user: {
        email: req.user.email,
        isVerified: req.user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;