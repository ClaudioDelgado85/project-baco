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
      address TEXT DEFAULT '',
      whatsapp_number TEXT DEFAULT '',
      instagram_url TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      cover_url TEXT DEFAULT '',
      delivery_fee INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      price INTEGER NOT NULL DEFAULT 0,
      original_price INTEGER DEFAULT NULL,
      has_discount INTEGER DEFAULT 0,
      variants_json TEXT DEFAULT NULL,
      is_disabled INTEGER DEFAULT 0,
      FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // Seed data for demo store 'mi-tienda' (only if it doesn't exist)
  db.run(`INSERT OR IGNORE INTO users (id, email, password_hash, tier) VALUES (999, 'demo@mi-tienda.com', '$2a$10$demohashdemohashdemohashdemohashdemohashdemohashdemo', 'standard')`);

  db.run(`INSERT OR IGNORE INTO stores (id, user_id, slug, name, address, whatsapp_number, instagram_url, delivery_fee)
    VALUES (999, 999, 'mi-tienda', 'Mi Tienda Demo', 'Av. Corrientes 1234, CABA', '5491124091027', 'https://instagram.com/yamenu.online', 500)`);

  db.run(`INSERT OR IGNORE INTO categories (id, store_id, name, order_index) VALUES (1, 999, 'Burgers', 0)`);
  db.run(`INSERT OR IGNORE INTO categories (id, store_id, name, order_index) VALUES (2, 999, 'Bebidas', 1)`);

  db.run(`INSERT OR IGNORE INTO products (id, store_id, category_id, name, description, image_url, price, original_price, has_discount, variants_json, is_disabled)
    VALUES (1, 999, 1, 'Cheeseburger', 'Medallón blend premium 120g x2, cheddar milkaut x6 & salsa secret y pan de papa',
      'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fd416b7eb-a8ef-4101-bb92-8af3888c7dbc_500x500?alt=media',
      1600, 2000, 1, '[{"name":"Simple","price":1600},{"name":"Doble","price":1900}]', 0)`);

  db.run(`INSERT OR IGNORE INTO products (id, store_id, category_id, name, description, image_url, price, original_price, has_discount, variants_json, is_disabled)
    VALUES (2, 999, 1, 'American Burger', 'Medallón blend premium 120g x2, cheddar milkaut x4, lechuga, tomate & Utah Fry Sauce',
      'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Fa23b0b08-c559-4e2a-92f1-0b8af3c2014d_500x500?alt=media',
      1600, NULL, 0, '[{"name":"Simple","price":1600},{"name":"Doble","price":1900}]', 0)`);

  db.run(`INSERT OR IGNORE INTO products (id, store_id, category_id, name, description, image_url, price, original_price, has_discount, variants_json, is_disabled)
    VALUES (3, 999, 2, 'Coca 1.5L', '',
      'https://firebasestorage.googleapis.com/v0/b/dondepido-befab.appspot.com/o/ZDChn584ZuhyipCDFBF5%2Fproducts%2Ffa781025-492d-465d-bfc2-332c9b40a32d_500x500?alt=media',
      450, NULL, 0, NULL, 0)`);

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

// Public store page route — must be BEFORE static middleware
app.get('/s/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Public store API — returns store data, categories, and products
app.get('/api/public/store/:slug', (req, res) => {
  const { slug } = req.params;

  db.get('SELECT * FROM stores WHERE slug = ?', [slug], (err, store) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    db.all(
      'SELECT * FROM categories WHERE store_id = ? ORDER BY order_index ASC',
      [store.id],
      (err, categories) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.all(
          'SELECT * FROM products WHERE store_id = ? AND is_disabled = 0',
          [store.id],
          (err, products) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Parse variants_json for each product
            const parsedProducts = products.map(p => ({
              ...p,
              variants: p.variants_json ? JSON.parse(p.variants_json) : []
            }));

            return res.json({ store, categories, products: parsedProducts });
          }
        );
      }
    );
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
