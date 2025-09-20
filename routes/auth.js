const express = require('express');
const User = require('../models/User');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: "user1"
 *         password:
 *           type: string
 *           example: "123456"
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * --- FORM VIEWS ---
 */

// GET register form
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Register', error: null, success: null });
});

// GET login form
router.get('/login', (req, res) => {
  res.render('auth/login', { 
    title: 'Login', 
    error: null, 
    success: req.query.success || null 
  });
});

/**
 * --- API ROUTES ---
 */

// POST register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();

    // Redirect sang login với thông báo thành công qua query string
    res.redirect('/auth/login?success=User registered successfully');
  } catch (error) {
    // Hiển thị lỗi trên form register
    res.render('auth/register', { 
      title: 'Register', 
      success: null, 
      error: 'User registration failed: ' + error.message 
    });
  }
});

// POST login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.render('auth/login', { title: 'Login', error: 'Invalid username or password', success: null });
    }

    // Lưu session và set cookie
    req.session.userId = user._id;
    res.cookie('sid', req.sessionID, { httpOnly: true, maxAge: 1000 * 60 * 60 });

    // Redirect sang profile
    res.redirect('/auth/profile');
  } catch (error) {
    res.render('auth/login', { title: 'Login', error: 'Login failed', success: null });
  }
});

// POST logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.render('auth/profile', { title: 'Profile', error: 'Logout failed', success: null, user: null });

    // Xóa cookie
    res.clearCookie('sid');
    res.clearCookie('connect.sid');

    // Redirect về trang login sau khi logout
    res.redirect('/auth/login');
  });
});

// GET profile (protected route)
router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.render('auth/profile', { title: 'Profile', error: 'Unauthorized', success: null, user: null });
  }

  const user = await User.findById(req.session.userId).select('-password');
  res.render('auth/profile', { title: 'Profile', error: null, success: 'Profile loaded', user });
});

module.exports = router;
