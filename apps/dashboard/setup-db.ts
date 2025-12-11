#!/usr/bin/env bun

/**
 * Database Setup Script for Bun SQL Demo
 * Initializes SQLite database with sample data for the SQL demo
 */

const SQL = (globalThis as any).SQL || (globalThis as any).Bun?.SQL;

if (!SQL) {
  console.error('❌ Bun SQL API not available. Make sure you are running with Bun.');
  process.exit(1);
}

async function setupDatabase() {
  console.log('🚀 Setting up Bun SQL Demo Database...');

  try {
    // Use SQLite in-memory database for demo
    const sql = new SQL(':memory:');
    console.log('📊 Connected to SQLite in-memory database');

    // Create tables
    console.log('📝 Creating tables...');

    await sql.unsafe(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    console.log('✅ Tables created successfully');

    // Insert sample data
    console.log('📥 Inserting sample data...');

    await sql.unsafe(`
      INSERT INTO users (name, email) VALUES
        ('Alice Johnson', 'alice@example.com'),
        ('Bob Smith', 'bob@example.com'),
        ('Charlie Brown', 'charlie@example.com'),
        ('Diana Prince', 'diana@example.com'),
        ('Eve Wilson', 'eve@example.com');
    `);

    await sql.unsafe(`
      INSERT INTO products (name, price, category) VALUES
        ('Laptop', 1299.99, 'Electronics'),
        ('Book', 19.99, 'Education'),
        ('Coffee Mug', 12.99, 'Kitchen'),
        ('Headphones', 89.99, 'Electronics'),
        ('Notebook', 5.99, 'Office'),
        ('Water Bottle', 24.99, 'Sports'),
        ('Desk Lamp', 45.99, 'Office'),
        ('Mouse Pad', 9.99, 'Electronics');
    `);

    await sql.unsafe(`
      INSERT INTO orders (user_id, product_id, quantity, total, status) VALUES
        (1, 1, 1, 1299.99, 'completed'),
        (2, 2, 2, 39.98, 'completed'),
        (3, 3, 1, 12.99, 'pending'),
        (1, 4, 1, 89.99, 'shipped'),
        (4, 5, 3, 17.97, 'completed');
    `);

    console.log('✅ Sample data inserted successfully');

    // Test queries
    console.log('🧪 Testing queries...');

    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const productCount = await sql`SELECT COUNT(*) as count FROM products`;
    const orderCount = await sql`SELECT COUNT(*) as count FROM orders`;

    console.log(`📊 Database contains:`);
    console.log(`   - ${userCount[0].count} users`);
    console.log(`   - ${productCount[0].count} products`);
    console.log(`   - ${orderCount[0].count} orders`);

    // Test JOIN query
    const orderDetails = await sql`
      SELECT
        o.id as order_id,
        u.name as customer_name,
        p.name as product_name,
        o.quantity,
        o.total,
        o.status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 3
    `;

    console.log('📋 Recent orders:');
    orderDetails.forEach((order: any) => {
      console.log(`   Order #${order.order_id}: ${order.customer_name} ordered ${order.product_name} (${order.status})`);
    });

    console.log('🎉 Database setup completed successfully!');
    console.log('💡 Run the dashboard with: bun run dev');
    console.log('🔍 Navigate to "Bun SQL API" tab to explore the database');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Environment variable configuration examples
console.log('🔧 Database Configuration Examples:');
console.log('  SQLite: DATABASE_URL=":memory:"');
console.log('  SQLite: DATABASE_URL="file://./demo.db"');
console.log('  PostgreSQL: DATABASE_URL="postgres://user:pass@localhost:5432/demo"');
console.log('  MySQL: DATABASE_URL="mysql://user:pass@localhost:3306/demo"');
console.log('');

setupDatabase();