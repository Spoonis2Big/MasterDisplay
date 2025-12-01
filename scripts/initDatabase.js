const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/showroom.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create vignettes table
  db.run(`
    CREATE TABLE IF NOT EXISTS vignettes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      theme TEXT,
      date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Create products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      manufacturer TEXT,
      model_number TEXT,
      sku TEXT,
      price DECIMAL(10, 2),
      dimensions TEXT,
      material TEXT,
      color TEXT,
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Create vignette_products junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS vignette_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vignette_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      position INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (vignette_id) REFERENCES vignettes(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(vignette_id, product_id)
    )
  `);

  // Create images table
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      vignette_id INTEGER,
      image_path TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      caption TEXT,
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (vignette_id) REFERENCES vignettes(id) ON DELETE CASCADE
    )
  `);

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'admin',
      date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Create indexes for better performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_vignettes_active ON vignettes(is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_vignette_products ON vignette_products(vignette_id, product_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

  console.log('✅ Database tables created successfully!');

  // Insert sample data
  db.run(`
    INSERT INTO vignettes (name, description, location, theme)
    VALUES
      ('Modern Living', 'Contemporary living room setup with clean lines', 'Section A1', 'Modern'),
      ('Cozy Family Room', 'Warm and inviting family space', 'Section B2', 'Traditional')
  `, function(err) {
    if (err) {
      console.log('Sample data already exists or error:', err.message);
    } else {
      console.log('✅ Sample vignettes added!');
    }
  });

  db.run(`
    INSERT INTO products (name, category, description, manufacturer, price, color)
    VALUES
      ('Cloud Comfort Sofa', 'Sofa', 'Luxurious 3-seater sofa with deep cushions', 'ComfortCo', 1299.99, 'Charcoal Gray'),
      ('Elegance Armchair', 'Chair', 'Mid-century modern armchair with wooden legs', 'DesignPlus', 449.99, 'Navy Blue'),
      ('Geometric Area Rug', 'Rug', 'Hand-tufted wool rug with modern pattern', 'RugMasters', 599.99, 'Multi-color'),
      ('Glass-Top Coffee Table', 'Coffee Table', 'Tempered glass with chrome base', 'ModernHome', 329.99, 'Clear/Chrome'),
      ('Amber Table Lamp', 'Lamp', 'Ceramic base with fabric shade', 'LightUp', 89.99, 'Amber/White')
  `, function(err) {
    if (err) {
      console.log('Sample products already exist or error:', err.message);
    } else {
      console.log('✅ Sample products added!');

      // Link products to first vignette
      db.run(`
        INSERT INTO vignette_products (vignette_id, product_id, position)
        VALUES (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5)
      `);
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('✅ Database initialization complete!');
  }
});
