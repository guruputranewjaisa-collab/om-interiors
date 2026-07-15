require('dotenv').config();
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Database ----------
const db = new Database(path.join(__dirname, 'data.sqlite'));
db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    project_type TEXT,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'new'
  )
`);

// ---------- Email (optional — only sends if SMTP env vars are set) ----------
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function notifyByEmail(inquiry) {
  if (!transporter) return; // email not configured — silently skip
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL || process.env.SMTP_USER,
      subject: `New inquiry from ${inquiry.name} — Om Interiors`,
      text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nProject type: ${inquiry.project_type}\n\nMessage:\n${inquiry.message}`
    });
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }
}

// ---------- Middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Public API ----------

// Submit a new inquiry
app.post('/api/contact', async (req, res) => {
  const { name, email, project_type, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please provide a valid email address.' });
  }

  const stmt = db.prepare(
    'INSERT INTO inquiries (name, email, project_type, message) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(name.trim(), email.trim(), project_type || 'Not specified', message.trim());

  const inquiry = { id: info.lastInsertRowid, name, email, project_type, message };
  notifyByEmail(inquiry); // fire and forget — doesn't block the response

  res.json({ ok: true, id: info.lastInsertRowid });
});

// ---------- Admin API (password protected) ----------
const adminAuth = basicAuth({
  users: { [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'changeme123' },
  challenge: true,
  realm: 'Om Interiors Admin'
});

app.get('/api/inquiries', adminAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  res.json({ ok: true, inquiries: rows });
});

app.patch('/api/inquiries/:id', adminAuth, (req, res) => {
  const { status } = req.body || {};
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status.' });
  }
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/inquiries/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Protect the admin page itself
app.get('/admin.html', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Om Interiors server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
  if (!transporter) {
    console.log('Note: email notifications are OFF — set SMTP_* variables in .env to enable them.');
  }
});
