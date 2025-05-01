const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// and login routes
router.post('/login', authController.createorlogin);

module.exports = router;
