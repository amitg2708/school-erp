require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./db/schema');
const { seedSuperAdmin } = require('./db/seedSuperAdmin');
const { initPostgres } = require('./db/postgres');

// Initialize database
async function startDatabase() {
  if (process.env.DATABASE_URL) {
    console.log('🐘 PostgreSQL configured via DATABASE_URL');
    try {
      await initPostgres();
    } catch (err) {
      console.error('Failed to initialize PostgreSQL:', err);
      process.exit(1);
    }
  } else {
    try {
      initializeDatabase();
      seedSuperAdmin();
    } catch (err) {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    }
  }
}

const app = express();

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in cloud reverse-proxy setups
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (non-production or debug)
if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/students', require('./routes/students'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/academic', require('./routes/academic'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/leaves', require('./routes/leaves'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'School ERP Platform API',
    database: process.env.DATABASE_URL ? 'postgresql' : 'sqlite',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Production: Serve React Client Build
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  await startDatabase();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 School ERP Enterprise API Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database:    ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (Local)'}`);
    console.log(`📡 Health:      http://localhost:${PORT}/api/health\n`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap();
