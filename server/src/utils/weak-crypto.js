// INTENTIONALLY INSECURE - For DevSecOps testing only
// Demonstrates weak cryptographic practices
const crypto = require('crypto');

// VULNERABILITY: MD5 hashing (cryptographically broken)
function hashPasswordMD5(password) {
  // INSECURE: MD5 is broken and should never be used for passwords
  return crypto.createHash('md5').update(password).digest('hex');
}

// VULNERABILITY: SHA1 hashing (weak for security)
function hashPasswordSHA1(password) {
  // INSECURE: SHA1 is deprecated for security use
  return crypto.createHash('sha1').update(password).digest('hex');
}

// VULNERABILITY: Weak AES-128-ECB encryption
function encryptDataWeak(data, key) {
  // INSECURE: ECB mode is deterministic and leaks patterns
  const cipher = crypto.createCipheriv('aes-128-ecb', key.substring(0, 16), '');
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// VULNERABILITY: Hardcoded encryption key
const HARDCODED_KEY = 'hardcoded-key-123'; // INSECURE: Never hardcode keys
function encryptWithHardcodedKey(data) {
  return encryptDataWeak(data, HARDCODED_KEY);
}

// VULNERABILITY: Weak random number generation
function generateWeakToken() {
  // INSECURE: Math.random() is not cryptographically secure
  return Math.random().toString(36).substring(2);
}

// VULNERABILITY: Predictable session IDs
function generateSessionId(userId) {
  // INSECURE: Predictable based on timestamp and userId
  return `session_${userId}_${Date.now()}`;
}

module.exports = {
  hashPasswordMD5,
  hashPasswordSHA1,
  encryptDataWeak,
  encryptWithHardcodedKey,
  generateWeakToken,
  generateSessionId,
};
