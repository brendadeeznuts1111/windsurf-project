# Bun SQLite Guide

> Built-in SQLite database with Bun's native API for fast, file-based data storage

Bun includes built-in SQLite support through the `bun:sqlite` module, providing fast, file-based database operations without external dependencies.

## Basic Setup

### Importing SQLite

```typescript
import { Database } from "bun:sqlite";
```

### Creating a Database

```typescript
// Create/open a database file
const db = new Database("app.db");

// Create an in-memory database
const memoryDb = new Database(":memory:");

// Open with specific options
const db = new Database("app.db", {
  // Database options would go here
});
```

## Schema Operations

### Creating Tables

```typescript
// Basic table creation
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Table with constraints
db.exec(`
  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK(length(title) > 0),
    content TEXT,
    author_id INTEGER,
    published BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Create indexes for performance
db.exec(`
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_posts_author ON posts(author_id);
  CREATE INDEX idx_posts_created ON posts(created_at DESC);
`);
```

### Altering Tables

```typescript
// Add a column
db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);

// Rename a column
db.exec(`ALTER TABLE users RENAME COLUMN name TO full_name;`);

// Create a new table with data migration
db.transaction(() => {
  db.exec(`
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      age INTEGER,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate data
  db.exec(`
    INSERT INTO users_new (id, full_name, email, age, created_at)
    SELECT id, name, email, age, created_at FROM users;
  `);

  // Replace old table
  db.exec(`DROP TABLE users;`);
  db.exec(`ALTER TABLE users_new RENAME TO users;`);
})();
```

## Data Operations

### Prepared Statements

```typescript
// Insert data
const insertUser = db.prepare(`
  INSERT INTO users (name, email, age)
  VALUES (?, ?, ?)
`);

// Execute with parameters
const result = insertUser.run("John Doe", "john@example.com", 30);
console.log("Inserted user with ID:", result.lastInsertRowid);

// Batch inserts
const users = [
  ["Jane Smith", "jane@example.com", 25],
  ["Bob Johnson", "bob@example.com", 35],
  ["Alice Brown", "alice@example.com", 28],
];

for (const [name, email, age] of users) {
  insertUser.run(name, email, age);
}
```

### Querying Data

```typescript
// Select all users
const selectAll = db.prepare("SELECT * FROM users");
const allUsers = selectAll.all();
console.log(allUsers);

// Select with parameters
const selectById = db.prepare("SELECT * FROM users WHERE id = ?");
const user = selectById.get(1);
console.log(user);

// Select multiple rows with limit
const selectRecent = db.prepare(`
  SELECT * FROM users
  ORDER BY created_at DESC
  LIMIT ?
`);
const recentUsers = selectRecent.all(10);

// Complex queries with joins
const selectPostsWithAuthors = db.prepare(`
  SELECT
    p.id, p.title, p.content, p.created_at,
    u.name as author_name, u.email as author_email
  FROM posts p
  JOIN users u ON p.author_id = u.id
  WHERE p.published = ?
  ORDER BY p.created_at DESC
`);
const posts = selectPostsWithAuthors.all(true);
```

### Updating and Deleting

```typescript
// Update data
const updateUser = db.prepare(`
  UPDATE users
  SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);
updateUser.run("John Smith", "johnsmith@example.com", 31, 1);

// Delete data
const deleteUser = db.prepare("DELETE FROM users WHERE id = ?");
deleteUser.run(1);

// Delete with conditions
const deleteOldPosts = db.prepare(`
  DELETE FROM posts
  WHERE created_at < datetime('now', '-30 days')
`);
const deletedCount = deleteOldPosts.run().changes;
console.log(`Deleted ${deletedCount} old posts`);
```

## Transactions

### Basic Transactions

```typescript
// Manual transaction
db.exec("BEGIN TRANSACTION");

try {
  // Multiple operations
  db.prepare("INSERT INTO users (name, email) VALUES (?, ?)").run("User 1", "user1@example.com");
  db.prepare("INSERT INTO users (name, email) VALUES (?, ?)").run("User 2", "user2@example.com");

  db.exec("COMMIT");
  console.log("Transaction committed");
} catch (error) {
  db.exec("ROLLBACK");
  console.error("Transaction rolled back:", error);
}
```

### Transaction Helper

```typescript
// Using the transaction method
const result = db.transaction(() => {
  const insertUser = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
  const insertPost = db.prepare("INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)");

  // Insert user
  const userResult = insertUser.run("Author Name", "author@example.com");
  const userId = userResult.lastInsertRowid;

  // Insert post for that user
  insertPost.run("My First Post", "This is the content", userId);

  return { userId, postCount: 1 };
});

console.log("Transaction result:", result);
```

### Nested Transactions (Savepoints)

```typescript
db.transaction(() => {
  // Outer transaction
  db.prepare("INSERT INTO users (name) VALUES (?)").run("Outer User");

  db.transaction(() => {
    // Inner transaction (savepoint)
    db.prepare("INSERT INTO users (name) VALUES (?)").run("Inner User");

    // This will rollback only the inner transaction
    throw new Error("Inner transaction failed");
  });

  // This will still be inserted
  db.prepare("INSERT INTO users (name) VALUES (?)").run("After Inner");
});
```

## Advanced Features

### Custom Functions

```typescript
// Register a custom SQL function
db.function("custom_upper", (str: string) => str.toUpperCase());

// Use the custom function
const result = db.prepare("SELECT custom_upper(name) as upper_name FROM users").all();
console.log(result); // [{ upper_name: "JOHN DOE" }]
```

### Custom Aggregates

```typescript
// Register a custom aggregate function
db.aggregate("custom_sum", {
  start: 0,
  step: (accumulator: number, value: number) => accumulator + value,
  finalize: (accumulator: number) => accumulator,
});

// Use the custom aggregate
const result = db.prepare(`
  SELECT custom_sum(age) as total_age
  FROM users
`).get();
console.log(result); // { total_age: 120 }
```

### Virtual Tables

```typescript
// FTS5 full-text search
db.exec(`
  CREATE VIRTUAL TABLE posts_fts USING fts5(
    title, content,
    content=posts,
    content_rowid=id
  );
`);

// Populate the FTS table
db.exec(`
  INSERT INTO posts_fts(rowid, title, content)
  SELECT id, title, content FROM posts;
`);

// Search
const searchPosts = db.prepare(`
  SELECT p.*, highlight(posts_fts, 0, '<mark>', '</mark>') as highlighted_title
  FROM posts_fts
  JOIN posts p ON posts_fts.rowid = p.id
  WHERE posts_fts MATCH ?
`);
const results = searchPosts.all("javascript OR typescript");
```

## Performance Optimization

### Prepared Statements

```typescript
// Reuse prepared statements for better performance
const insertUser = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
const selectUser = db.prepare("SELECT * FROM users WHERE id = ?");

// These are much faster when reused
for (let i = 0; i < 1000; i++) {
  insertUser.run(`User ${i}`, `user${i}@example.com`);
  const user = selectUser.get(i + 1);
}
```

### Indexes

```typescript
// Create indexes for frequently queried columns
db.exec(`
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
  CREATE INDEX idx_posts_published_created ON posts(published, created_at DESC);
`);

// Composite indexes for multiple columns
db.exec(`
  CREATE INDEX idx_users_name_email ON users(name, email);
`);
```

### Connection Pooling

```typescript
// For high-concurrency applications, consider connection pooling
class DatabasePool {
  private databases: Database[] = [];
  private available: Database[] = [];

  constructor(size: number, filename: string) {
    for (let i = 0; i < size; i++) {
      const db = new Database(filename);
      this.databases.push(db);
      this.available.push(db);
    }
  }

  getConnection(): Database {
    if (this.available.length === 0) {
      throw new Error("No available database connections");
    }
    return this.available.pop()!;
  }

  releaseConnection(db: Database): void {
    this.available.push(db);
  }
}
```

## Migration System

### Simple Migration Runner

```typescript
class Migrator {
  constructor(private db: Database) {}

  async runMigrations(migrations: string[]) {
    // Create migrations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const migration of migrations) {
      const exists = this.db.prepare("SELECT 1 FROM migrations WHERE name = ?").get(migration);

      if (!exists) {
        console.log(`Running migration: ${migration}`);

        // Run migration in transaction
        this.db.transaction(() => {
          // Execute migration SQL here
          // this.db.exec(migrationSQL);

          // Record migration
          this.db.prepare("INSERT INTO migrations (name) VALUES (?)").run(migration);
        })();

        console.log(`Migration completed: ${migration}`);
      }
    }
  }
}

// Usage
const migrations = [
  "001_create_users_table.sql",
  "002_create_posts_table.sql",
  "003_add_indexes.sql",
];

const migrator = new Migrator(db);
await migrator.runMigrations(migrations);
```

## Error Handling

### SQLite Error Types

```typescript
try {
  db.exec("INVALID SQL");
} catch (error) {
  if (error.code === "SQLITE_CONSTRAINT") {
    console.error("Constraint violation");
  } else if (error.code === "SQLITE_BUSY") {
    console.error("Database is busy");
  } else {
    console.error("Database error:", error.message);
  }
}
```

### Connection Error Handling

```typescript
function withDatabase<T>(filename: string, operation: (db: Database) => T): T {
  const db = new Database(filename);

  try {
    return operation(db);
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  } finally {
    db.close();
  }
}

// Usage
const result = withDatabase("app.db", (db) => {
  return db.prepare("SELECT COUNT(*) as count FROM users").get();
});
```

## Best Practices

### Database Design

1. **Use appropriate data types**: INTEGER for IDs, TEXT for strings, REAL for decimals
2. **Normalize your schema**: Avoid data duplication
3. **Use foreign keys**: Maintain referential integrity
4. **Index strategically**: Index columns used in WHERE clauses and JOINs

### Performance

1. **Use prepared statements**: Avoid SQL injection and improve performance
2. **Batch operations**: Use transactions for multiple related operations
3. **Close connections**: Always close database connections when done
4. **Use indexes wisely**: Too many indexes can slow down writes

### Security

1. **Use prepared statements**: Prevent SQL injection attacks
2. **Validate input**: Sanitize data before inserting
3. **Limit permissions**: Use read-only connections where possible
4. **Backup regularly**: SQLite files can be easily backed up

### Maintenance

1. **VACUUM regularly**: Reclaim space from deleted rows
2. **ANALYZE tables**: Update query planner statistics
3. **Monitor performance**: Use EXPLAIN QUERY PLAN for slow queries
4. **Version control**: Keep schema changes in version control

This guide covers Bun's powerful SQLite integration. For more advanced database patterns and ORMs, see the related guides.