const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const sharp = require('sharp');
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

  // Migration: add theme_id column (safe to run on existing DB)
  db.run(`ALTER TABLE stores ADD COLUMN theme_id INTEGER DEFAULT 0`, (err) => {
    // Error expected if column already exists — ignore
  });

  // Migration: add hours_json column
  db.run(`ALTER TABLE stores ADD COLUMN hours_json TEXT DEFAULT NULL`, (err) => {
    // Error expected if column already exists — ignore
  });

  // Migration: add extras_json column
  db.run(`ALTER TABLE products ADD COLUMN extras_json TEXT DEFAULT NULL`, (err) => {
    // Error expected if column already exists — ignore
  });

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

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

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

// Auth middleware for dashboard routes
function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    if (req.method === 'GET') {
      return res.redirect('/login');
    }
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// Auth pages — serve HTML directly (no session required)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Dashboard protected routes
app.get('/dashboard', ensureAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// GET /api/dashboard/products — list products for authenticated user's store
app.get('/api/dashboard/products', ensureAuth, (req, res) => {
  db.all(
    `SELECT p.*, c.name as category_name FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.store_id = (SELECT id FROM stores WHERE user_id = ?)
     ORDER BY p.id DESC`,
    [req.session.userId],
    (err, products) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      const parsed = products.map(p => ({
        ...p,
        variants: p.variants_json ? JSON.parse(p.variants_json) : [],
        extras: p.extras_json ? JSON.parse(p.extras_json) : []
      }));
      return res.json({ success: true, data: parsed });
    }
  );
});

// POST /api/dashboard/products — create product under user's store
app.post('/api/dashboard/products', ensureAuth, (req, res) => {
  const { category_id, name, description, image_url, price, original_price, has_discount, variants_json, extras_json } = req.body;

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ success: false, error: 'Name and price are required' });
  }

  db.run(
    `INSERT INTO products (store_id, category_id, name, description, image_url, price, original_price, has_discount, variants_json, extras_json)
     VALUES ((SELECT id FROM stores WHERE user_id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.session.userId, category_id || null, name, description || '', image_url || '', price, original_price || null, has_discount ? 1 : 0, variants_json || null, extras_json || null],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      // Fetch the created product to return full data
      db.get(
        `SELECT p.*, c.name as category_name FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [this.lastID],
        (err, product) => {
          if (err) {
            return res.status(500).json({ success: false, error: err.message });
          }
          const parsed = {
            ...product,
            variants: product.variants_json ? JSON.parse(product.variants_json) : [],
            extras: product.extras_json ? JSON.parse(product.extras_json) : []
          };
          return res.status(201).json({ success: true, data: parsed });
        }
      );
    }
  );
});

// PUT /api/dashboard/products/:id — update with ownership check
app.put('/api/dashboard/products/:id', ensureAuth, (req, res) => {
  const { id } = req.params;
  const { category_id, name, description, image_url, price, original_price, has_discount, variants_json, extras_json } = req.body;

  db.run(
    `UPDATE products SET
      category_id = ?,
      name = ?,
      description = ?,
      image_url = ?,
      price = ?,
      original_price = ?,
      has_discount = ?,
      variants_json = ?,
      extras_json = ?
     WHERE id = ? AND store_id = (SELECT id FROM stores WHERE user_id = ?)`,
    [category_id || null, name, description || '', image_url || '', price, original_price || null, has_discount ? 1 : 0, variants_json || null, extras_json || null, id, req.session.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (this.changes === 0) {
        return res.status(403).json({ success: false, error: 'Not found or not authorized' });
      }

      // Fetch the updated product
      db.get(
        `SELECT p.*, c.name as category_name FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [id],
        (err, product) => {
          if (err) {
            return res.status(500).json({ success: false, error: err.message });
          }
          const parsed = {
            ...product,
            variants: product.variants_json ? JSON.parse(product.variants_json) : [],
            extras: product.extras_json ? JSON.parse(product.extras_json) : []
          };
          return res.json({ success: true, data: parsed });
        }
      );
    }
  );
});

// DELETE /api/dashboard/products/:id — delete with ownership check
app.delete('/api/dashboard/products/:id', ensureAuth, (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM products WHERE id = ? AND store_id = (SELECT id FROM stores WHERE user_id = ?)`,
    [id, req.session.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (this.changes === 0) {
        return res.status(403).json({ success: false, error: 'Not found or not authorized' });
      }
      return res.json({ success: true, message: 'Product deleted' });
    }
  );
});

// POST /api/dashboard/upload — upload image file, process with Sharp, return URL
app.post('/api/dashboard/upload', ensureAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, error: 'File too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ success: false, error: err.message });
      }
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    try {
      const filename = `${Date.now()}-${crypto.randomUUID()}.webp`;
      const outputPath = path.join(__dirname, 'public', 'uploads', filename);

      await sharp(req.file.buffer)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(outputPath);

      return res.json({ success: true, url: `/uploads/${filename}` });
    } catch (sharpErr) {
      return res.status(500).json({ success: false, error: 'Error processing image' });
    }
  });
});

// GET /api/dashboard/store — return authenticated user's store data
app.get('/api/dashboard/store', ensureAuth, (req, res) => {
  db.get(
    'SELECT * FROM stores WHERE user_id = ?',
    [req.session.userId],
    (err, store) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!store) {
        return res.status(404).json({ success: false, error: 'Store not found' });
      }
      return res.json({ success: true, data: store });
    }
  );
});

// PUT /api/dashboard/store — update store settings
app.put('/api/dashboard/store', ensureAuth, (req, res) => {
  const { name, slug, address, whatsapp_number, instagram_url, delivery_fee, logo_url, cover_url, theme_id, hours_json } = req.body;

  // If slug is being changed, check uniqueness first
  if (slug) {
    db.get(
      'SELECT id FROM stores WHERE slug = ? AND user_id != ?',
      [slug, req.session.userId],
      (err, existing) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        if (existing) {
          return res.status(409).json({ success: false, error: 'Slug already taken' });
        }
        proceedWithUpdate();
      }
    );
  } else {
    proceedWithUpdate();
  }

  function proceedWithUpdate() {
    db.run(
      `UPDATE stores SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        address = COALESCE(?, address),
        whatsapp_number = COALESCE(?, whatsapp_number),
        instagram_url = COALESCE(?, instagram_url),
        delivery_fee = COALESCE(?, delivery_fee),
        logo_url = COALESCE(?, logo_url),
        cover_url = COALESCE(?, cover_url),
        theme_id = COALESCE(?, theme_id),
        hours_json = COALESCE(?, hours_json)
       WHERE user_id = ?`,
      [name, slug, address, whatsapp_number, instagram_url, delivery_fee, logo_url, cover_url, theme_id, hours_json, req.session.userId],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed: stores.slug')) {
            return res.status(409).json({ success: false, error: 'Slug already taken' });
          }
          return res.status(500).json({ success: false, error: err.message });
        }

        // Fetch the updated store
        db.get(
          'SELECT * FROM stores WHERE user_id = ?',
          [req.session.userId],
          (err, store) => {
            if (err) {
              return res.status(500).json({ success: false, error: err.message });
            }
            // Update session data with new values
            if (store.slug) req.session.storeSlug = store.slug;
            if (store.name) req.session.storeName = store.name;
            return res.json({ success: true, data: store });
          }
        );
      }
    );
  }
});

// GET /api/dashboard/categories — list categories for authenticated user's store
app.get('/api/dashboard/categories', ensureAuth, (req, res) => {
  db.all(
    'SELECT * FROM categories WHERE store_id = (SELECT id FROM stores WHERE user_id = ?) ORDER BY order_index ASC',
    [req.session.userId],
    (err, categories) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      return res.json({ success: true, data: categories });
    }
  );
});

// POST /api/dashboard/categories — create category
app.post('/api/dashboard/categories', ensureAuth, (req, res) => {
  const { name, order_index } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });

  db.run(
    `INSERT INTO categories (store_id, name, order_index) VALUES ((SELECT id FROM stores WHERE user_id = ?), ?, ?)`,
    [req.session.userId, name, order_index || 0],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      db.get('SELECT * FROM categories WHERE id = ?', [this.lastID], (err, cat) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        return res.status(201).json({ success: true, data: cat });
      });
    }
  );
});

// PUT /api/dashboard/categories/:id — update category
app.put('/api/dashboard/categories/:id', ensureAuth, (req, res) => {
  const { name, order_index } = req.body;

  db.run(
    `UPDATE categories SET name = COALESCE(?, name), order_index = COALESCE(?, order_index)
     WHERE id = ? AND store_id = (SELECT id FROM stores WHERE user_id = ?)`,
    [name, order_index, req.params.id, req.session.userId],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (this.changes === 0) return res.status(403).json({ success: false, error: 'Not found or not authorized' });
      db.get('SELECT * FROM categories WHERE id = ?', [req.params.id], (err, cat) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        return res.json({ success: true, data: cat });
      });
    }
  );
});

// DELETE /api/dashboard/categories/:id — delete category
app.delete('/api/dashboard/categories/:id', ensureAuth, (req, res) => {
  db.run(
    `DELETE FROM categories WHERE id = ? AND store_id = (SELECT id FROM stores WHERE user_id = ?)`,
    [req.params.id, req.session.userId],
    function (err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (this.changes === 0) return res.status(403).json({ success: false, error: 'Not found or not authorized' });
      return res.json({ success: true, message: 'Category deleted' });
    }
  );
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

            // Parse variants_json and extras_json for each product
            const parsedProducts = products.map(p => ({
              ...p,
              variants: p.variants_json ? JSON.parse(p.variants_json) : [],
              extras: p.extras_json ? JSON.parse(p.extras_json) : []
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
