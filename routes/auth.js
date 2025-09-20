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

// GET profile form
router.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.render('auth/profile', { title: 'Profile', error: 'Unauthorized', success: null, user: null });
  }
  const user = await User.findById(req.session.userId).select('-password');
  res.render('auth/profile', { title: 'Profile', error: null, success: 'Profile loaded', user });
});

/**
 * --- API ROUTES WITH SWAGGER ---
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       302:
 *         description: Redirect to login on success
 *       400:
 *         description: Registration failed
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.redirect('/auth/login?success=User registered successfully');
  } catch (error) {
    res.render('auth/register', { 
      title: 'Register', 
      success: null, 
      error: 'User registration failed: ' + error.message 
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       302:
 *         description: Redirect to profile on success
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.render('auth/login', { title: 'Login', error: 'Invalid username or password', success: null });
    }

    req.session.userId = user._id;
    res.cookie('sid', req.sessionID, { httpOnly: true, maxAge: 1000 * 60 * 60 });
    res.redirect('/auth/profile');
  } catch (error) {
    res.render('auth/login', { title: 'Login', error: 'Login failed', success: null });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to login after logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.render('auth/profile', { title: 'Profile', error: 'Logout failed', success: null, user: null });
    res.clearCookie('sid');
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

module.exports = router;
