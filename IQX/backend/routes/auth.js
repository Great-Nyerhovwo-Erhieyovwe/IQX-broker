import express from 'express';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const router = express.Router();

// === CHECK USERNAME AVAILABILITY ===
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || username.length < 4) {
      return res.status(400).json({ 
        message: 'Username must be at least 4 characters' 
      });
    }

    // Check if username exists in database
    const result = await pool.query(
      'SELECT id FROM users WHERE username = $1 LIMIT 1',
      [username]
    );

    const exists = result.rows.length > 0;
    res.json({ exists });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ 
      message: 'Server error during username check',
      exists: false // Default to not existing in case of error
    });
  }
});

// === REGISTER ROUTE ===
router.post('/register', async (req, res) => {
  const { fullName, username, email, phone, password, accountType, country, currency } = req.body;

  if (!fullName || !username || !email || !password)
    return res.status(400).json({ message: 'Missing required fields.' });

  try {
    // Check if email or username exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (emailCheck.rows.length > 0) return res.status(409).json({ message: 'Email already in use.' });

    const usernameCheck = await pool.query('SELECT id FROM users WHERE username=$1', [username]);
    if (usernameCheck.rows.length > 0) return res.status(409).json({ message: 'Username already taken.' });

    // Insert user (storing plain text password)
    const result = await pool.query(
      `INSERT INTO users 
       (full_name, username, email, phone, password, account_type, country, currency, balance, roi, deposits, active_trades, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,0,0,0,'active',NOW())
       RETURNING id, username`,
      [fullName, username, email, phone, password, accountType, country, currency]
    );

    const newUser = result.rows[0];
    res.status(201).json({ message: 'User registered successfully', id: newUser.id, username: newUser.username });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// === LOGIN ROUTE ===
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'User not found.' });
    if (user.password !== password) return res.status(401).json({ message: 'Invalid password.' });
    if (user.status === 'banned') return res.status(403).json({ message: 'Account banned.' });
    if (user.status === 'frozen') return res.status(403).json({ message: 'Account frozen.' });

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ message: 'Login successful', token, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// === LOGOUT ROUTE ===
router.post('/logout', (req, res) => {
  // Client-side token removal is sufficient for logout
  // No server-side session management needed since using JWT
  res.json({ message: 'Logged out successfully' });
});

export default router;