const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const db      = require('./db');

const app = express();

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer – disk storage, max 10 MB
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  },
});

// ── Routes ──────────────────────────────────────────────────

// GET /api/reports?sort=newest|upvotes
app.get('/api/reports', (req, res) => {
  const { sort = 'newest' } = req.query;
  const orderBy = sort === 'upvotes' ? 'upvotes DESC, created_at DESC' : 'created_at DESC';
  const reports = db.prepare(`SELECT * FROM reports ORDER BY ${orderBy}`).all();
  res.json(reports);
});

// POST /api/reports  (multipart/form-data)
app.post('/api/reports', upload.single('photo'), (req, res) => {
  try {
    const { category, description, lat, lng } = req.body;

    if (!category || !lat || !lng) {
      return res.status(400).json({ error: 'category, lat and lng are required' });
    }

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO reports (category, description, lat, lng, photo)
      VALUES (?, ?, ?, ?, ?)
    `).run([category, description || null, parseFloat(lat), parseFloat(lng), photo]);

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get([lastInsertRowid]);
    res.status(201).json(report);
  } catch (err) {
    console.error('POST /api/reports error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/:id/upvote
app.post('/api/reports/:id/upvote', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('UPDATE reports SET upvotes = upvotes + 1 WHERE id = ?').run([id]);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json(db.prepare('SELECT * FROM reports WHERE id = ?').get([id]));
});

// PATCH /api/reports/:id/status
app.patch('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['submitted', 'in_review', 'resolved'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const info = db.prepare('UPDATE reports SET status = ? WHERE id = ?').run([status, id]);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json(db.prepare('SELECT * FROM reports WHERE id = ?').get([id]));
});

// DELETE /api/reports/:id  (admin use)
app.delete('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const report = db.prepare('SELECT photo FROM reports WHERE id = ?').get([id]);
  if (!report) return res.status(404).json({ error: 'Not found' });

  if (report.photo) {
    const filePath = path.join(__dirname, report.photo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM reports WHERE id = ?').run([id]);
  res.json({ ok: true });
});

// Serve built client in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅  Пријави Битола server running → http://localhost:${PORT}`);
});
