// backend/routes/users.js
import express from "express";
import pool from "../db.js";
const router = express.Router();

// Middleware to verify JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET;
    const user = jwt.default.verify(token, secret);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

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

// === GET USER PROFILE ===
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, phone, account_type, country, currency, balance, roi, deposits, active_trades, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    // Add computed fields
    user.is_banned = user.status === 'banned';
    user.is_frozen = user.status === 'frozen';
    
    // Remove sensitive data
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === UPDATE USER PROFILE ===
router.put('/profile', authenticateToken, async (req, res) => {
  const { fullName, phone, accountType, country, currency } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           account_type = COALESCE($3, account_type),
           country = COALESCE($4, country),
           currency = COALESCE($5, currency)
       WHERE id = $6
       RETURNING id, username, email, full_name, phone, account_type, country, currency`,
      [fullName, phone, accountType, country, currency, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === GET ALL USERS (Admin only) ===
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, full_name, email, balance FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// === GET SINGLE USER ===
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, username, email, full_name, phone, account_type, country, currency, balance, roi, deposits, active_trades, status, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    user.is_banned = user.status === 'banned';
    user.is_frozen = user.status === 'frozen';
    delete user.password;
    
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;