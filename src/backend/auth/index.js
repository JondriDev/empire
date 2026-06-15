/**
 * Empire Authentication
 * 
 * PIN-based login for single local user.
 * Issues JWT tokens for API access.
 * Uses Node.js crypto for PIN hashing (scrypt).
 */

import crypto from 'crypto';

const JWT_SECRET = process.env.EMPIRE_JWT_SECRET || 'empire-local-dev-secret-change-in-prod';
const TOKEN_EXPIRY = '7d'; // Long expiry for local-only use

/**
 * Hash a PIN with scrypt + random salt
 */
export function hashPin(pin, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(pin, salt, 64);
  return { hash: key.toString('hex'), salt };
}

/**
 * Verify a PIN against stored hash
 */
export function verifyPin(pin, storedHash, salt) {
  const { hash } = hashPin(pin, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

/**
 * Simple JWT implementation (no dependency on jsonwebtoken)
 * For local-only use — not production-grade but sufficient for single-user desktop app
 */
export function signJwt(payload, secret = JWT_SECRET) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const base64url = (str) => Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 7 * 24 * 60 * 60 // 7 days
  };
  
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(tokenPayload));
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyJwt(token, secret = JWT_SECRET) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    if (signatureB64 !== expectedSig) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // Decode payload
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString()
    );
    
    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Express middleware: require valid JWT on protected routes
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  const result = verifyJwt(token);
  
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }
  
  req.user = result.payload;
  next();
}

/**
 * Optional auth middleware — sets req.user if token present, but doesn't block
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = verifyJwt(token);
    if (result.valid) {
      req.user = result.payload;
    }
  }
  
  next();
}

export { JWT_SECRET };
