// INTENTIONALLY INSECURE - For DevSecOps testing only
// This file demonstrates common web vulnerabilities for security scanning
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// VULNERABILITY 1: Command Injection
// No input sanitization - attacker can inject shell commands
router.post('/ping', (req, res) => {
  const { host } = req.body;
  // INSECURE: Direct command execution with user input
  exec(`ping -c 1 ${host}`, (error, stdout, stderr) => {
    res.json({ output: stdout, error: stderr });
  });
});

// VULNERABILITY 2: Path Traversal
// Allows reading files outside the intended directory
router.get('/file', (req, res) => {
  const { filename } = req.query;
  // INSECURE: No path sanitization
  const filePath = '/var/app/uploads/' + filename;
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'File not found' });
    res.send(data);
  });
});

// VULNERABILITY 3: SQL Injection
// User input directly interpolated into SQL query
router.get('/user', (req, res) => {
  const { id } = req.query;
  // INSECURE: String interpolation in SQL
  const query = `SELECT * FROM users WHERE id = ${id}`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// VULNERABILITY 4: Insecure Deserialization
router.post('/deserialize', (req, res) => {
  const { data } = req.body;
  // INSECURE: eval on user-supplied data
  try {
    const result = eval('(' + data + ')');
    res.json({ result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// VULNERABILITY 5: Sensitive Data Exposure
router.get('/config', (req, res) => {
  // INSECURE: Exposing internal config
  res.json({
    dbUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    awsKey: process.env.AWS_ACCESS_KEY_ID,
    nodeEnv: process.env.NODE_ENV,
    version: process.version,
    platform: process.platform,
  });
});

// VULNERABILITY 6: SSRF (Server-Side Request Forgery)
const axios = require('axios');
router.get('/fetch', async (req, res) => {
  const { url } = req.query;
  // INSECURE: No URL validation - allows internal network access
  try {
    const response = await axios.get(url);
    res.json({ data: response.data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
