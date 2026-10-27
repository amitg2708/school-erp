const { getDb } = require('./schema');
const bcrypt = require('bcryptjs');

function seedSuperAdmin() {
  const db = getDb();
  console.log('👑 Seeding Super Admin and Multi-Class Admin structure...');

  // 1. Ensure school_admins table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS school_admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      campus_name TEXT DEFAULT 'Main Campus',
      managed_classes TEXT DEFAULT 'Classes 1 to 12',
      branch_code TEXT DEFAULT 'ADM-001',
      designation TEXT DEFAULT 'School Principal & Director',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 2. Ensure superadmin role exists
  db.prepare(`INSERT OR IGNORE INTO roles (name, description) VALUES ('superadmin', 'Platform Super Administrator')`).run();

  // 3. Ensure any existing superadmin or admin has a record in school_admins
  const adminUsers = db.prepare(`
    SELECT u.id, u.username, r.name as role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE r.name IN ('admin', 'superadmin')
  `).all();

  for (const adm of adminUsers) {
    const existing = db.prepare("SELECT id FROM school_admins WHERE user_id = ?").get(adm.id);
    if (!existing) {
      db.prepare(`
        INSERT INTO school_admins (user_id, campus_name, managed_classes, branch_code, designation, notes)
        VALUES (?, 'Main Institutional Campus', 'Classes 1 to 12', 'DIR-001', 'Institutional Administrator', 'Primary administration directorate.')
      `).run(adm.id);
    }
  }

  console.log('✅ Super Admin and Institutional Admin structure verified.');
}

module.exports = { seedSuperAdmin };

if (require.main === module) {
  seedSuperAdmin();
}
