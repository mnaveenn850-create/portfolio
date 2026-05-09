const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const PASSWORD = 'admin123'; // 🔒 CHANGE YOUR PASSWORD HERE
const DATA_FILE = path.join(__dirname, 'data.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const VISITORS_FILE = path.join(__dirname, 'visitors.json');

// EMPTY default — no pre-filled data
const emptyData = {
  name: '', title: '', bio: '', email: '', phone: '', location: '', photo: '',
  socials: { github: '', linkedin: '', twitter: '', instagram: '', youtube: '', dribbble: '' },
  skills: [], experience: [], education: [], certificates: [], projects: []
};

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(emptyData, null, 2));
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]');
if (!fs.existsSync(VISITORS_FILE)) fs.writeFileSync(VISITORS_FILE, '{"count":0}');

function getData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return emptyData; } }
function getMessages() { try { return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')); } catch (e) { return []; } }
function getVisitors() { try { return JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf8')); } catch (e) { return { count: 0 }; } }

app.post('/api/login', (req, res) => {
  if (req.body.password === PASSWORD) res.json({ success: true });
  else res.status(401).json({ success: false, message: 'Incorrect password' });
});

app.get('/api/data', (req, res) => {
  const v = getVisitors(); v.count++; fs.writeFileSync(VISITORS_FILE, JSON.stringify(v, null, 2));
  res.json(getData());
});

app.post('/api/save', (req, res) => {
  if (req.body.password !== PASSWORD) return res.status(403).json({ success: false, message: 'Unauthorized' });
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(req.body.data, null, 2)); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, message: 'Error saving' }); }
});

app.get('/api/visitors', (req, res) => res.json(getVisitors()));

app.post('/api/contact', (req, res) => {
  const msg = req.body;
  if (!msg.name || !msg.email || !msg.message) return res.status(400).json({ success: false, message: 'Missing fields' });
  try {
    const messages = getMessages(); messages.push(msg);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    console.log(`📩 New message from ${msg.name} (${msg.email}): ${msg.subject || 'No subject'}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: 'Error' }); }
});

app.post('/api/messages', (req, res) => {
  if (req.body.password !== PASSWORD) return res.status(403).json({ success: false, message: 'Unauthorized' });
  res.json(getMessages());
});

app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}\n🔒 Password: "${PASSWORD}"`));