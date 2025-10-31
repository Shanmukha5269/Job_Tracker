const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/register-employer', authController.registerEmployer);
router.post('/login', authController.login);

module.exports = router;
