require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Compression voor grote payloads (cohorten ~400KB)
app.use(compression());

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
    },
  },
}));

// CORS: same-origin in productie, open in development
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
}));

// Rate limiting op API routes
const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// API routes
app.use('/api', require('./routes/aggregaties'));
app.use('/api', require('./routes/verloop'));
app.use('/api', require('./routes/signalering'));
app.use('/api', require('./routes/model'));
app.use('/api', require('./routes/teams'));

// Health check (Railway)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Static frontend uit public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback: serve monitor als index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'verenigingsmonitor.html'));
});

app.listen(PORT, () => {
  console.log(`Oranje Wit API draait op poort ${PORT}`);
});
