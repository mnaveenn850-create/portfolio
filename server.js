const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer'); // NEW: Import Nodemailer

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const PASSWORD = 'admin123'; 
const DATA_FILE = path.join(__dirname, 'data.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const VISITORS_FILE = path.join(__dirname, 'visitors.json');

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

// NEW: Setup Nodemailer Transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'mnaveenn850@gmail.com', // Your Gmail address
    pass: process.env.EMAIL_PASS // Your App Password (will be set on Render)
  }
});

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

// UPDATED: Contact route now sends an email!
app.post('/api/contact', (req, res) => {
  const msg = req.body;
  if (!msg.name || !msg.email || !msg.message) return res.status(400).json({ success: false, message: 'Missing fields' });
  
  try {
    // 1. Save to local file (backup)
    const messages = getMessages(); messages.push(msg);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    
    // 2. Send Email
    const mailOptions = {
      from: `"${msg.name}" <${msg.email}>`, // Sender name and email
      to: 'mnaveenn850@gmail.com',           // YOUR email receiving the message
      subject: `Portfolio Message: ${msg.subject || 'No Subject'}`,
      text: `Name: ${msg.name}\nEmail: ${msg.email}\n\n${msg.message}`,
      html: `<p><strong>Name:</strong> ${msg.name}</p>
             <p><strong>Email:</strong> ${msg.email}</p>
             <p><strong>Message:</strong></p>
             <p>${msg.message}</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Email error:', error);
      } else {
        console.log(`📩 Email sent from ${msg.name} (${msg.email})`);
      }
    });

    res.json({ success: true });
  } catch (e) { 
    res.status(500).json({ success: false, message: 'Error' }); 
  }
});

app.post('/api/messages', (req, res) => {
  if (req.body.password !== PASSWORD) return res.status(403).json({ success: false, message: 'Unauthorized' });
  res.json(getMessages());
});

app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}\n🔒 Password: "${PASSWORD}"`));