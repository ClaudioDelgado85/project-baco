const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Initialization
const dbPath = path.join(__dirname, 'saas.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      tier TEXT DEFAULT 'standard',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Database tables initialized.');
});

// Configure session middleware
const sessionStore = new SQLiteStore({
  db: 'saas.db',
  dir: __dirname,
  table: 'sessions'
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'project-baco-super-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: false // Set to true in production with HTTPS
  }
}));

// API Routes

// Signup
app.post(['/api/auth/signup', '/api/auth/register'], async (req, res) => {
  const { email, password, slug, name } = req.body;

  if (!email || !password || !slug) {
    return res.status(400).json({ success: false, error: 'Email, password, and slug are required' });
  }

  const storeName = name || slug;

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(
        'INSERT INTO users (email, password_hash, tier) VALUES (?, ?, ?)',
        [email, passwordHash, 'standard'],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            if (err.message.includes('UNIQUE constraint failed: users.email')) {
              return res.status(400).json({ success: false, error: 'Email is already registered' });
            }
            return res.status(400).json({ success: false, error: err.message });
          }

          const userId = this.lastID;

          db.run(
            'INSERT INTO stores (user_id, slug, name) VALUES (?, ?, ?)',
            [userId, slug, storeName],
            function (err) {
              if (err) {
                db.run('ROLLBACK');
                if (err.message.includes('UNIQUE constraint failed: stores.slug')) {
                  return res.status(400).json({ success: false, error: 'Store slug is already taken' });
                }
                return res.status(400).json({ success: false, error: err.message });
              }

              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  return res.status(500).json({ success: false, error: commitErr.message });
                }

                // Set session data
                req.session.userId = userId;
                req.session.userEmail = email;
                req.session.storeSlug = slug;
                req.session.storeName = storeName;

                return res.status(201).json({
                  success: true,
                  user: { id: userId, email, tier: 'standard' },
                  store: { id: this.lastID, slug, name: storeName }
                });
              });
            }
          );
        }
      );
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  db.get(
    `SELECT u.id, u.email, u.password_hash, u.tier, s.id as store_id, s.slug, s.name as store_name 
     FROM users u 
     LEFT JOIN stores s ON u.id = s.user_id 
     WHERE u.email = ?`,
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      try {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
          return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // Set session data
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.storeSlug = user.slug;
        req.session.storeName = user.store_name;

        return res.json({
          success: true,
          user: { id: user.id, email: user.email, tier: user.tier },
          store: { id: user.store_id, slug: user.slug, name: user.store_name }
        });
      } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
    }
  );
});

// Get current user / session
app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  db.get(
    `SELECT u.id, u.email, u.tier, s.id as store_id, s.slug, s.name as store_name 
     FROM users u 
     LEFT JOIN stores s ON u.id = s.user_id 
     WHERE u.id = ?`,
    [req.session.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      return res.json({
        success: true,
        user: { id: user.id, email: user.email, tier: user.tier },
        store: { id: user.store_id, slug: user.slug, name: user.store_name }
      });
    }
  );
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Private dashboard summary route
app.get('/api/dashboard/summary', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  return res.json({
    success: true,
    message: 'Welcome to dashboard summary',
    data: {
      orders: 0,
      revenue: 0
    }
  });
});

// Static files middleware - configured to point strictly to /public folder
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to return 404 for unhandled requests (which will include saas.db, server.js etc.)
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // For testing
