// Lightweight static server with compression and cache headers
// Serves public/dist with strong caching for hashed assets and shorter for HTML
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distDir = path.resolve(__dirname, '../public/dist');
const port = process.env.UI_PORT || 5174;

app.use(compression());

// Trust proxy when behind reverse proxies (for accurate rate limiting IPs)
app.set('trust proxy', true);

// Security headers (conservative CSP disabled to avoid breaking SPA dev)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Basic rate limiting to mitigate abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.UI_RATE_LIMIT_MAX || 600), // requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Set cache headers
app.use((req, res, next) => {
  if (/\.(?:js|css|svg|png|jpg|jpeg|gif|webp|woff2?)$/.test(req.url)) {
    // hashed assets get long cache
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (/\.(?:json|txt|xml|ico)$/.test(req.url)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  } else {
    // HTML
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});

app.use(
  express.static(distDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.br')) {res.setHeader('Content-Encoding', 'br');}
      if (filePath.endsWith('.gz')) {res.setHeader('Content-Encoding', 'gzip');}
    },
  }),
);

// SPA fallback (Express 5: avoid '*' which breaks path-to-regexp)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Static UI server listening on http://localhost:${port}`);
  console.log(`Serving ${distDir}`);
});
