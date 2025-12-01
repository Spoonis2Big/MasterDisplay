const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Database connection
const dbPath = path.join(__dirname, 'database/showroom.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ============================================
// VIGNETTE ROUTES
// ============================================

// Get all vignettes
app.get('/api/vignettes', (req, res) => {
  const query = `
    SELECT v.*,
           COUNT(DISTINCT vp.product_id) as product_count,
           COUNT(DISTINCT i.id) as image_count
    FROM vignettes v
    LEFT JOIN vignette_products vp ON v.id = vp.vignette_id
    LEFT JOIN images i ON v.id = i.vignette_id
    WHERE v.is_active = 1
    GROUP BY v.id
    ORDER BY v.date_created DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ vignettes: rows });
  });
});

// Get single vignette with all details
app.get('/api/vignettes/:id', (req, res) => {
  const vignetteId = req.params.id;

  const vignetteQuery = `SELECT * FROM vignettes WHERE id = ? AND is_active = 1`;

  db.get(vignetteQuery, [vignetteId], (err, vignette) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!vignette) {
      res.status(404).json({ error: 'Vignette not found' });
      return;
    }

    // Get products in this vignette
    const productsQuery = `
      SELECT p.*, vp.position, vp.notes
      FROM products p
      JOIN vignette_products vp ON p.id = vp.product_id
      WHERE vp.vignette_id = ? AND p.is_active = 1
      ORDER BY vp.position
    `;

    db.all(productsQuery, [vignetteId], (err, products) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Get images for this vignette
      const imagesQuery = `SELECT * FROM images WHERE vignette_id = ? ORDER BY is_primary DESC`;

      db.all(imagesQuery, [vignetteId], (err, images) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({
          vignette: vignette,
          products: products,
          images: images
        });
      });
    });
  });
});

// Create new vignette
app.post('/api/vignettes', (req, res) => {
  const { name, description, location, theme } = req.body;

  const query = `
    INSERT INTO vignettes (name, description, location, theme)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [name, description, location, theme], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Vignette created successfully' });
  });
});

// Update vignette
app.put('/api/vignettes/:id', (req, res) => {
  const { name, description, location, theme } = req.body;
  const vignetteId = req.params.id;

  const query = `
    UPDATE vignettes
    SET name = ?, description = ?, location = ?, theme = ?, date_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [name, description, location, theme, vignetteId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Vignette updated successfully', changes: this.changes });
  });
});

// Delete vignette (soft delete)
app.delete('/api/vignettes/:id', (req, res) => {
  const vignetteId = req.params.id;

  const query = `UPDATE vignettes SET is_active = 0 WHERE id = ?`;

  db.run(query, [vignetteId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Vignette deleted successfully', changes: this.changes });
  });
});

// ============================================
// PRODUCT ROUTES
// ============================================

// Get all products
app.get('/api/products', (req, res) => {
  const category = req.query.category;
  let query = `SELECT * FROM products WHERE is_active = 1`;
  let params = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` ORDER BY name`;

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ products: rows });
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  const query = `SELECT * FROM products WHERE id = ? AND is_active = 1`;

  db.get(query, [productId], (err, product) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Get images for this product
    const imagesQuery = `SELECT * FROM images WHERE product_id = ? ORDER BY is_primary DESC`;

    db.all(imagesQuery, [productId], (err, images) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        product: product,
        images: images
      });
    });
  });
});

// Create new product
app.post('/api/products', (req, res) => {
  const { name, category, description, manufacturer, model_number, sku, price, dimensions, material, color } = req.body;

  const query = `
    INSERT INTO products (name, category, description, manufacturer, model_number, sku, price, dimensions, material, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [name, category, description, manufacturer, model_number, sku, price, dimensions, material, color], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Product created successfully' });
  });
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const { name, category, description, manufacturer, model_number, sku, price, dimensions, material, color } = req.body;
  const productId = req.params.id;

  const query = `
    UPDATE products
    SET name = ?, category = ?, description = ?, manufacturer = ?, model_number = ?,
        sku = ?, price = ?, dimensions = ?, material = ?, color = ?, date_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [name, category, description, manufacturer, model_number, sku, price, dimensions, material, color, productId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Product updated successfully', changes: this.changes });
  });
});

// Delete product (soft delete)
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  const query = `UPDATE products SET is_active = 0 WHERE id = ?`;

  db.run(query, [productId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Product deleted successfully', changes: this.changes });
  });
});

// Get product categories
app.get('/api/categories', (req, res) => {
  const query = `SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category`;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const categories = rows.map(row => row.category);
    res.json({ categories: categories });
  });
});

// ============================================
// VIGNETTE-PRODUCT ASSOCIATION ROUTES
// ============================================

// Add product to vignette
app.post('/api/vignettes/:vignetteId/products/:productId', (req, res) => {
  const { vignetteId, productId } = req.params;
  const { position, notes } = req.body;

  const query = `
    INSERT INTO vignette_products (vignette_id, product_id, position, notes)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [vignetteId, productId, position || 0, notes], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Product added to vignette successfully' });
  });
});

// Remove product from vignette
app.delete('/api/vignettes/:vignetteId/products/:productId', (req, res) => {
  const { vignetteId, productId } = req.params;

  const query = `DELETE FROM vignette_products WHERE vignette_id = ? AND product_id = ?`;

  db.run(query, [vignetteId, productId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Product removed from vignette successfully', changes: this.changes });
  });
});

// ============================================
// IMAGE ROUTES
// ============================================

// Upload image
app.post('/api/images/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { product_id, vignette_id, is_primary, caption } = req.body;
  const imagePath = '/uploads/' + req.file.filename;

  const query = `
    INSERT INTO images (product_id, vignette_id, image_path, is_primary, caption)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [product_id || null, vignette_id || null, imagePath, is_primary || 0, caption || null], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      message: 'Image uploaded successfully',
      image_path: imagePath
    });
  });
});

// Delete image
app.delete('/api/images/:id', (req, res) => {
  const imageId = req.params.id;

  // First get the image path to delete the file
  db.get(`SELECT image_path FROM images WHERE id = ?`, [imageId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (row) {
      const filePath = path.join(__dirname, row.image_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const query = `DELETE FROM images WHERE id = ?`;

    db.run(query, [imageId], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Image deleted successfully', changes: this.changes });
    });
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Master Display server running on http://localhost:${PORT}`);
  console.log(`📊 Admin interface: http://localhost:${PORT}/admin.html`);
  console.log(`🖥️  Master Display: http://localhost:${PORT}/display.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('\n✅ Database connection closed');
    process.exit(0);
  });
});
