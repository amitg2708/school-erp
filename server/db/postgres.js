const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool = null;

function getPostgresPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    const config = connectionString
      ? { connectionString }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432'),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'school_erp',
        };

    // SSL for remote providers (Render, Railway, Supabase, Neon, RDS, Heroku)
    if (process.env.NODE_ENV === 'production' || (connectionString && connectionString.includes('sslmode=require'))) {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err);
    });
  }

  return pool;
}

/**
 * Execute schema.sql against PostgreSQL database and apply initial clean seeds
 */
async function initPostgres() {
  const p = getPostgresPool();
  console.log('🐘 Initializing PostgreSQL database...');

  // 1. Read and run DDL schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await seedCleanProductionData(client);
    await client.query('COMMIT');
    console.log('✅ PostgreSQL database schema & clean seeds initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to initialize PostgreSQL database:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Seeds purely institutional structural data without any demo dummy students, dummy teachers, or mock records
 */
async function seedCleanProductionData(client) {
  console.log('🌱 Seeding structural base data (zero demo data)...');

  // 1. Roles
  const roles = [
    ['superadmin', 'Platform Super Administrator'],
    ['admin', 'School Administrator / Principal'],
    ['teacher', 'Teaching Faculty'],
    ['student', 'Enrolled Student'],
    ['parent', 'Parent / Legal Guardian'],
    ['accountant', 'Fee Bursar & Accountant'],
    ['staff', 'Non-Teaching Support Staff']
  ];
  for (const [name, desc] of roles) {
    await client.query(
      `INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      [name, desc]
    );
  }

  // 2. Current Academic Year
  await client.query(`
    INSERT INTO academic_years (name, start_date, end_date, is_current, is_active)
    VALUES ('2025-2026', '2025-04-01', '2026-03-31', 1, 1)
    ON CONFLICT (name) DO NOTHING
  `);

  // 3. Classes 1 to 12
  for (let i = 1; i <= 12; i++) {
    await client.query(
      `INSERT INTO classes (name, numeric_value) VALUES ($1, $2) ON CONFLICT (numeric_value) DO NOTHING`,
      [`Class ${i}`, i]
    );
  }

  // 4. Sections A, B, C for each class
  const classRows = (await client.query('SELECT id FROM classes ORDER BY numeric_value')).rows;
  for (const cls of classRows) {
    for (const sec of ['A', 'B', 'C']) {
      await client.query(
        `INSERT INTO sections (class_id, name, max_strength) VALUES ($1, $2, 40) ON CONFLICT (class_id, name) DO NOTHING`,
        [cls.id, sec]
      );
    }
  }

  // 5. Academic Subjects
  const subjects = [
    ['English', 'ENG'],
    ['Mathematics', 'MATH'],
    ['Science', 'SCI'],
    ['Social Science', 'SST'],
    ['Hindi', 'HIN'],
    ['Computer Science', 'CS'],
    ['Physics', 'PHY'],
    ['Chemistry', 'CHEM'],
    ['Biology', 'BIO'],
    ['History', 'HIST'],
    ['Geography', 'GEO'],
    ['Civics', 'CIV'],
    ['Economics', 'ECO'],
    ['Accountancy', 'ACC'],
    ['Business Studies', 'BS'],
    ['Physical Education', 'PE'],
    ['Art', 'ART'],
    ['Music', 'MUS']
  ];
  for (const [name, code] of subjects) {
    await client.query(
      `INSERT INTO subjects (name, code) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
      [name, code]
    );
  }

  // 6. Departments
  const depts = [
    'Science', 'Mathematics', 'English', 'Social Studies',
    'Computer Science', 'Physical Education', 'Arts',
    'Administration', 'Accounts', 'Library'
  ];
  for (const dept of depts) {
    await client.query(
      `INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [dept]
    );
  }

  // 7. Fee Categories
  const feeCats = [
    'Tuition Fee', 'Admission Fee', 'Examination Fee', 'Transport Fee',
    'Activity Fee', 'Library Fee', 'Sports Fee', 'Lab Fee', 'Other Fee'
  ];
  for (const cat of feeCats) {
    await client.query(
      `INSERT INTO fee_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [cat]
    );
  }

  // 8. Exam Types
  const examTypes = ['Unit Test', 'Periodic Test', 'Midterm Examination', 'Final Examination', 'Practical Examination'];
  for (const et of examTypes) {
    await client.query(
      `INSERT INTO examination_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [et]
    );
  }

  // 9. Grading Rules
  const grades = [
    ['A+', 90, 100, 'Outstanding'],
    ['A', 80, 89.99, 'Excellent'],
    ['B+', 70, 79.99, 'Very Good'],
    ['B', 60, 69.99, 'Good'],
    ['C', 50, 59.99, 'Average'],
    ['D', 33, 49.99, 'Below Average'],
    ['F', 0, 32.99, 'Fail']
  ];
  for (const [grade, min, max, desc] of grades) {
    const existing = await client.query('SELECT id FROM grading_rules WHERE grade = $1', [grade]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO grading_rules (grade, min_percentage, max_percentage, description) VALUES ($1, $2, $3, $4)`,
        [grade, min, max, desc]
      );
    }
  }

  // 10. Leave Types
  const leaveTypes = [
    ['Casual Leave', 12],
    ['Medical Leave', 15],
    ['Earned Leave', 30],
    ['Maternity Leave', 90],
    ['Study Leave', 30]
  ];
  for (const [name, days] of leaveTypes) {
    await client.query(
      `INSERT INTO leave_types (name, max_days) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      [name, days]
    );
  }

  // 11. Initial Production Super Administrator (Configurable via ENV)
  const superAdminRole = (await client.query("SELECT id FROM roles WHERE name = 'superadmin'")).rows[0];
  const adminUsername = process.env.ADMIN_USERNAME || 'superadmin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Secure2026';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@institutional-erp.com';

  const existingAdmin = (await client.query("SELECT id FROM users WHERE username = $1", [adminUsername])).rows[0];
  if (!existingAdmin && superAdminRole) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    const adminRes = await client.query(
      `INSERT INTO users (username, email, phone, password_hash, role_id, first_name, last_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1) RETURNING id`,
      [adminUsername, adminEmail, '9800000000', passwordHash, superAdminRole.id, 'System', 'Director']
    );

    await client.query(
      `INSERT INTO school_admins (user_id, campus_name, managed_classes, branch_code, designation, notes)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO NOTHING`,
      [
        adminRes.rows[0].id,
        'Main Institutional Campus',
        'Classes 1 to 12',
        'DIR-001',
        'Director of Institutional Governance',
        'Root deployment administrator account.'
      ]
    );

    console.log(`\n======================================================`);
    console.log(`🔐 Clean Production Super Administrator Created:`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  Please change this password after initial deployment login!`);
    console.log(`======================================================\n`);
  }
}

module.exports = {
  getPostgresPool,
  initPostgres,
  seedCleanProductionData
};
