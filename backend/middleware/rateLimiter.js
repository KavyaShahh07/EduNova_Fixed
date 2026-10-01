const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * General API rate limiter (prevents scraping and DDoS)
 * Allows 1000 requests per 15 mins in development, 200 in production
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Strict authentication rate limiter
 * Allows 100 attempts per 15 mins in development, 20 in production
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 20 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * AI Endpoints Rate Limiter
 * Protects backend LLM tokens and external APIs against abuse and cost spikes
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 300 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI request limit reached. Please wait a moment before sending more queries.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * File Upload Rate Limiter
 * Protects server against storage flooding and memory exhaustion attacks
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many file upload requests. Please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Strict PIN verification rate limiter (Student Link Code ED-XXXXXX brute force defense)
 * Max 5 attempts per 15 minutes in production (25 in dev)
 */
const pinVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 25 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many student linking verification attempts. Please try again after 15 minutes.',
    code: 'PIN_VERIFICATION_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Strict 2FA TOTP and Recovery Code rate limiter
 * Allows max 5 attempts per 10 minutes in production (50 in dev) to stop 6-digit brute force
 */
const twoFactorLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 50 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many 2FA verification attempts. Please wait 10 minutes before retrying.',
    code: '2FA_RATE_LIMIT_EXCEEDED',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  aiLimiter,
  uploadLimiter,
  pinVerificationLimiter,
  twoFactorLimiter,
};


