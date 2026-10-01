const prisma = require('../config/db');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const googleAuthService = require('./googleAuthService');
const emailService = require('./emailService');
const totp = require('../utils/totp');
const { dispatchSecurityAlert } = require('./webhookService');

// ── Argon2 config ────────────────────────────────────────────────────────────
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,  // 64 MB
  timeCost: 3,
  parallelism: 1,
};

// ── Token helpers ────────────────────────────────────────────────────────────

const generateToken = (userId, role, tokenVersion = 0) => {
  return jwt.sign({
    id: userId,
    role,
    tokenVersion,
    jti: crypto.randomBytes(16).toString('hex'),
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (userId, tokenVersion = 0) => {
  return jwt.sign({
    id: userId,
    tokenVersion,
    jti: crypto.randomBytes(16).toString('hex'),
  }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Keyed HMAC-SHA256 hash for 6-digit OTP codes.
 * Binds the code to the user email and server secret to prevent rainbow table attacks.
 */
const hashOtp = (code, email) => {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET || 'edunova_secure_otp_pepper_2026';
  return crypto.createHmac('sha256', secret).update(`${email.trim().toLowerCase()}:${code}`).digest('hex');
};

/**
 * Constant-time hash comparison to prevent timing side-channel attacks
 */
const compareHashSafe = (storedHex, candidateHex) => {
  if (!storedHex || !candidateHex) return false;
  try {
    const a = Buffer.from(storedHex, 'hex');
    const b = Buffer.from(candidateHex, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
};

/**
 * Build a safe user response (strip passwordHash and 2FA secrets)
 */
const safeUserResponse = (user) => {
  const { passwordHash, otpCode, parentLinkCode, twoFactorSecret, twoFactorRecoveryCodes, ...safeUser } = user;
  return safeUser;
};

/**
 * Build full auth response with tokens
 */
const authResponse = (user) => {
  const token = generateToken(user.id, user.role, user.tokenVersion);
  const refreshToken = generateRefreshToken(user.id, user.tokenVersion);
  return {
    user: safeUserResponse(user),
    token,
    refreshToken,
  };
};

// ════════════════════════════════════════════════════════════════════════════
// 1. EMAIL / PASSWORD REGISTRATION
// ════════════════════════════════════════════════════════════════════════════

const register = async ({ name, email, phone, password, role, learnerType, studentUsername }) => {
  const normalizedEmail = email ? email.trim().toLowerCase() : null;

  // Uniqueness checks
  if (normalizedEmail) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw { status: 400, message: 'User already exists with this email' };
  }
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) throw { status: 400, message: 'User already exists with this phone' };
  }

  // Hash password with Argon2id
  const passwordHash = password
    ? await argon2.hash(password, ARGON2_OPTIONS)
    : null;

  // Security: Public registration must never grant ADMIN role
  const allowedRegistrationRoles = ['STUDENT', 'INSTRUCTOR', 'PARENT'];
  const safeRole = (role && allowedRegistrationRoles.includes(role)) ? role : 'STUDENT';

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      phone,
      passwordHash,
      role: safeRole,
      learnerType: learnerType || 'SCHOOL',
      studentUsername,
      isEmailVerified: false,
      // Auto-create learner profile for students
      ...((!role || role === 'STUDENT') && {
        learnerProfile: {
          create: {
            board: null,
            degree: null,
            goals: [],
            weakTopics: [],
            xp: 0,
            level: 1,
            streakDays: 0,
          },
        },
      }),
    },
    include: { learnerProfile: true },
  });

  // Automatically dispatch real SMTP verification email on signup if email provided
  if (normalizedEmail) {
    try {
      const code = crypto.randomInt(100000, 1000000).toString();
      const codeHash = hashOtp(code, normalizedEmail);
      const lookupKey = `verify:${normalizedEmail}`;

      await prisma.passwordResetCode.updateMany({
        where: { email: lookupKey, consumed: false },
        data: { consumed: true },
      });

      await prisma.passwordResetCode.create({
        data: {
          email: lookupKey,
          codeHash,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
        },
      });

      await emailService.sendEmailVerificationOtp(normalizedEmail, code);
    } catch (err) {
      console.warn('[Registration Email Dispatch Notice]', err.message);
    }
  }

  return authResponse(user);
};

// ════════════════════════════════════════════════════════════════════════════
// 2. EMAIL / PASSWORD LOGIN & ATTEMPT AUDITING
// ════════════════════════════════════════════════════════════════════════════

const recordLoginAttempt = async ({ userId = null, identifier, ipAddress, userAgent, status, failureReason = null }) => {
  try {
    await prisma.loginAttempt.create({
      data: {
        userId,
        identifier: identifier || 'unknown',
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.substring(0, 500) : null,
        status,
        failureReason,
      },
    });
  } catch (err) {
    console.error('[LoginAttempt Logging Failed]', err.message);
  }
};

const recordUserSessionLog = async ({ userId, authType, ipAddress, userAgent }) => {
  try {
    await prisma.userSessionLog.create({
      data: {
        userId,
        authType: authType || 'EMAIL_PASSWORD',
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.substring(0, 500) : null,
      },
    });
  } catch (err) {
    console.error('[UserSessionLog Logging Failed]', err.message);
  }
};

const login = async ({ email, phone, studentUsername, password, ip, userAgent }) => {
  const identifier = email || phone || studentUsername || 'unknown';
  let user;

  if (email) {
    user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { learnerProfile: true },
    });
  } else if (phone) {
    user = await prisma.user.findUnique({
      where: { phone: phone.trim() },
      include: { learnerProfile: true },
    });
  } else if (studentUsername) {
    user = await prisma.user.findFirst({
      where: { studentUsername: studentUsername.trim(), role: 'PARENT' },
      include: { learnerProfile: true },
    });
  }

  // 1. User not found
  if (!user) {
    await recordLoginAttempt({
      identifier,
      ipAddress: ip,
      userAgent,
      status: 'FAILED',
      failureReason: 'USER_NOT_FOUND',
    });
    throw { status: 401, message: 'Invalid credentials' };
  }

  // 2. Check if account is suspended or banned
  if (user.status && user.status !== 'ACTIVE') {
    const reason = user.status === 'BANNED' ? 'ACCOUNT_BANNED' : 'ACCOUNT_SUSPENDED';
    await recordLoginAttempt({
      userId: user.id,
      identifier,
      ipAddress: ip,
      userAgent,
      status: 'BLOCKED',
      failureReason: reason,
    });
    throw {
      status: 403,
      message: `Your account is ${user.status.toLowerCase()}. Access denied. Please contact an administrator.`,
    };
  }

  // 3. Check if account is temporarily locked due to repeated failed attempts
  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
    const remainingMins = Math.max(1, Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000));
    await recordLoginAttempt({
      userId: user.id,
      identifier,
      ipAddress: ip,
      userAgent,
      status: 'BLOCKED',
      failureReason: 'ACCOUNT_LOCKED',
    });
    throw {
      status: 423,
      message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMins} minute(s) or contact an administrator.`,
    };
  }

  // 4. Check if password login is supported
  if (!user.passwordHash) {
    await recordLoginAttempt({
      userId: user.id,
      identifier,
      ipAddress: ip,
      userAgent,
      status: 'FAILED',
      failureReason: 'NO_PASSWORD_SET',
    });
    throw { status: 401, message: 'This account does not have password login enabled.' };
  }

  // 5. Verify password with Argon2 (or legacy bcrypt with auto-migration to Argon2)
  let isMatch = false;
  if (user.passwordHash.startsWith('$argon2')) {
    isMatch = await argon2.verify(user.passwordHash, password);
  } else if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
    const bcrypt = require('bcryptjs');
    isMatch = await bcrypt.compare(password, user.passwordHash);
    if (isMatch) {
      const newHash = await argon2.hash(password, ARGON2_OPTIONS);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }
  } else {
    try {
      isMatch = await argon2.verify(user.passwordHash, password);
    } catch {
      isMatch = false;
    }
  }

  // 6. Handle password failure
  if (!isMatch) {
    const nextFailedAttempts = (user.failedLoginAttempts || 0) + 1;
    const shouldLock = nextFailedAttempts >= 5;
    const lockoutUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: nextFailedAttempts,
        lockoutUntil,
      },
    });

    await recordLoginAttempt({
      userId: user.id,
      identifier,
      ipAddress: ip,
      userAgent,
      status: shouldLock ? 'BLOCKED' : 'FAILED',
      failureReason: shouldLock ? 'LOCKOUT_TRIGGERED' : 'INVALID_CREDENTIALS',
    });

    if (shouldLock) {
      dispatchSecurityAlert({
        event: 'ACCOUNT_LOCKED',
        severity: 'CRITICAL',
        title: `Account locked due to 5 failed password attempts (${user.email})`,
        details: {
          userId: user.id,
          email: user.email,
          ipAddress: ip,
          userAgent,
          lockoutDuration: '15 minutes',
        },
      }).catch(() => {});

      throw {
        status: 423,
        message: 'Too many failed login attempts. Account temporarily locked for 15 minutes. Contact an administrator for immediate unlock.',
      };
    }

    throw { status: 401, message: 'Invalid credentials' };
  }

  // 6.5. If user has 2FA enabled, require TOTP verification before issuing session
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    const tempToken = jwt.sign(
      {
        id: user.id,
        purpose: '2fa_login',
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return {
      requires2FA: true,
      tempToken,
      email: user.email,
    };
  }

  // 7. Successful login: reset failed counters and update last login metadata
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip || null,
      updatedAt: new Date(),
    },
  });

  await recordLoginAttempt({
    userId: user.id,
    identifier,
    ipAddress: ip,
    userAgent,
    status: 'SUCCESS',
  });

  await recordUserSessionLog({
    userId: user.id,
    authType: 'EMAIL_PASSWORD',
    ipAddress: ip,
    userAgent,
  });

  return authResponse(user);
};

// ════════════════════════════════════════════════════════════════════════════
// 3. REAL SMTP PASSWORD RESET LIFECYCLE
// ════════════════════════════════════════════════════════════════════════════

const requestPasswordReset = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const genericResponse = {
    message: 'If an account exists for that email, a reset code has been sent.',
  };

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) {
    return genericResponse;
  }

  // Rate limiting cooldown: check if active code was created in last 60 seconds
  const recentCode = await prisma.passwordResetCode.findFirst({
    where: {
      email: normalizedEmail,
      consumed: false,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
  });
  if (recentCode) {
    throw { status: 429, message: 'Please wait 60 seconds before requesting another reset code.' };
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashOtp(code, normalizedEmail);

  await prisma.passwordResetCode.updateMany({
    where: { email: normalizedEmail, consumed: false },
    data: { consumed: true },
  });
  await prisma.passwordResetCode.create({
    data: {
      email: normalizedEmail,
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
  });

  try {
    await emailService.sendPasswordResetCode(normalizedEmail, code);
  } catch (error) {
    await prisma.passwordResetCode.updateMany({
      where: { email: normalizedEmail, codeHash, consumed: false },
      data: { consumed: true },
    });
    throw error;
  }
  return genericResponse;
};

const resetPasswordWithCode = async ({ email, code, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const resetCode = await prisma.passwordResetCode.findFirst({
    where: { email: normalizedEmail, consumed: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!resetCode || resetCode.expiresAt < new Date()) {
    throw { status: 400, message: 'Invalid or expired reset code.' };
  }
  if (resetCode.attempts >= 5) {
    throw { status: 429, message: 'Too many invalid code attempts. Request a new code.' };
  }

  const expectedHash = hashOtp(code, normalizedEmail);
  const isMatch = compareHashSafe(resetCode.codeHash, expectedHash);

  if (!isMatch) {
    await prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { attempts: { increment: 1 } },
    });
    throw { status: 400, message: 'Invalid or expired reset code.' };
  }

  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
  await prisma.$transaction([
    prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash, tokenVersion: { increment: 1 } }, // Revokes all previous sessions
    }),
    prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { consumed: true },
    }),
  ]);
  return { message: 'Password reset successfully. You can now sign in.' };
};

// ════════════════════════════════════════════════════════════════════════════
// 4. REAL SMTP EMAIL VERIFICATION LIFECYCLE
// ════════════════════════════════════════════════════════════════════════════

const requestEmailVerification = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user && user.isEmailVerified) {
    return { message: 'Email is already verified.' };
  }

  // 60-second cooldown check
  const lookupKey = `verify:${normalizedEmail}`;
  const recentCode = await prisma.passwordResetCode.findFirst({
    where: {
      email: lookupKey,
      consumed: false,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
  });
  if (recentCode) {
    throw { status: 429, message: 'Please wait 60 seconds before requesting another verification code.' };
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashOtp(code, normalizedEmail);

  await prisma.passwordResetCode.updateMany({
    where: { email: lookupKey, consumed: false },
    data: { consumed: true },
  });

  await prisma.passwordResetCode.create({
    data: {
      email: lookupKey,
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    },
  });

  try {
    await emailService.sendEmailVerificationOtp(normalizedEmail, code);
  } catch (error) {
    await prisma.passwordResetCode.updateMany({
      where: { email: lookupKey, codeHash, consumed: false },
      data: { consumed: true },
    });
    throw error;
  }

  return { message: 'Verification code sent to your email.' };
};

const confirmEmailVerification = async ({ email, code }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const lookupKey = `verify:${normalizedEmail}`;
  const record = await prisma.passwordResetCode.findFirst({
    where: { email: lookupKey, consumed: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record || record.expiresAt < new Date()) {
    throw { status: 400, message: 'Invalid or expired verification code.' };
  }
  if (record.attempts >= 5) {
    throw { status: 429, message: 'Too many invalid attempts. Request a new code.' };
  }

  const expectedHash = hashOtp(code, normalizedEmail);
  const isMatch = compareHashSafe(record.codeHash, expectedHash);

  if (!isMatch) {
    await prisma.passwordResetCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw { status: 400, message: 'Invalid verification code.' };
  }

  // Mark consumed and update User table isEmailVerified = true
  const [_, updatedUser] = await prisma.$transaction([
    prisma.passwordResetCode.update({
      where: { id: record.id },
      data: { consumed: true },
    }),
    prisma.user.update({
      where: { email: normalizedEmail },
      data: { isEmailVerified: true },
      include: { learnerProfile: true },
    }),
  ]);

  return {
    verified: true,
    message: 'Email verified successfully.',
    ...authResponse(updatedUser),
  };
};

// ════════════════════════════════════════════════════════════════════════════
// 5. GOOGLE LOGIN
// ════════════════════════════════════════════════════════════════════════════

const googleLogin = async ({ idToken, role, learnerType, ip, userAgent }) => {
  const user = await googleAuthService.googleLogin(idToken, { role, learnerType });

  if (user.status && user.status !== 'ACTIVE') {
    const reason = user.status === 'BANNED' ? 'ACCOUNT_BANNED' : 'ACCOUNT_SUSPENDED';
    await recordLoginAttempt({
      userId: user.id,
      identifier: user.email || 'google_user',
      ipAddress: ip,
      userAgent,
      status: 'BLOCKED',
      failureReason: reason,
    });
    throw {
      status: 403,
      message: `Your account is ${user.status.toLowerCase()}. Access denied. Please contact an administrator.`,
    };
  }

  // Update last activity and login metadata
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip || null,
      updatedAt: new Date(),
    },
  });

  await recordLoginAttempt({
    userId: user.id,
    identifier: user.email || 'google_user',
    ipAddress: ip,
    userAgent,
    status: 'SUCCESS',
  });

  await recordUserSessionLog({
    userId: user.id,
    authType: 'GOOGLE',
    ipAddress: ip,
    userAgent,
  });

  return authResponse(user);
};

// ════════════════════════════════════════════════════════════════════════════
// 6. SECURE PARENT-CHILD VERIFICATION & LINKING WORKFLOW
// ════════════════════════════════════════════════════════════════════════════

/**
 * Student generates a secure 6-character linking PIN (valid for 24h)
 */
const generateStudentLinkCode = async (studentId) => {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, studentUsername: true },
  });

  if (!student || student.role !== 'STUDENT') {
    throw { status: 403, message: 'Only student accounts can generate parent linking codes.' };
  }

  // Cryptographically random 6-character uppercase PIN
  const pin = 'ED-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.user.update({
    where: { id: studentId },
    data: {
      parentLinkCode: pin,
      parentLinkCodeExpiresAt: expiresAt,
    },
  });

  return {
    linkCode: pin,
    expiresAt: expiresAt.toISOString(),
    studentUsername: student.studentUsername,
    message: 'Parent linking code generated. Share this code with your parent.',
  };
};

/**
 * Parent links to student using student's username AND verified student PIN
 */
const linkParentToStudent = async (parentId, studentUsername, linkCode) => {
  if (!studentUsername || !studentUsername.trim()) {
    throw { status: 400, message: 'Student username is required' };
  }
  if (!linkCode || !linkCode.trim()) {
    throw { status: 400, message: 'Verification link code from student is required' };
  }

  // Verify student exists
  const student = await prisma.user.findFirst({
    where: { studentUsername: studentUsername.trim(), role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      studentUsername: true,
      parentLinkCode: true,
      parentLinkCodeExpiresAt: true,
    },
  });

  if (!student) {
    throw { status: 404, message: `No student found with username "${studentUsername}"` };
  }

  // Validate student's generated link code
  const inputPin = linkCode.trim().toUpperCase();
  if (
    !student.parentLinkCode ||
    student.parentLinkCode.toUpperCase() !== inputPin ||
    !student.parentLinkCodeExpiresAt ||
    student.parentLinkCodeExpiresAt < new Date()
  ) {
    throw {
      status: 400,
      message: 'Invalid or expired student linking code. The student must generate an active code in their profile.',
    };
  }

  // Fetch existing parent record to append child if multiple children exist
  const existingParent = await prisma.user.findUnique({
    where: { id: parentId },
    select: { studentUsername: true },
  });

  const existingList = (existingParent?.studentUsername || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!existingList.includes(student.studentUsername)) {
    existingList.push(student.studentUsername);
  }
  const combinedUsernames = existingList.join(', ');

  // Consume linking code and link parent atomically
  const [parent] = await prisma.$transaction([
    prisma.user.update({
      where: { id: parentId },
      data: { studentUsername: combinedUsernames },
      include: { learnerProfile: true },
    }),
    prisma.user.update({
      where: { id: student.id },
      data: {
        parentLinkCode: null,
        parentLinkCodeExpiresAt: null,
      },
    }),
  ]);

  return {
    message: `Successfully linked to student: ${student.name}`,
    parent: safeUserResponse(parent),
    linkedStudent: { id: student.id, name: student.name, studentUsername: student.studentUsername },
  };
};

/**
 * Parent or student unlinks the companion monitoring connection
 */
const unlinkParentStudent = async (userId, targetStudentUsername = null) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  if (user.role === 'PARENT') {
    if (targetStudentUsername && user.studentUsername) {
      const remaining = user.studentUsername
        .split(',')
        .map((s) => s.trim())
        .filter((s) => Boolean(s) && s !== targetStudentUsername.trim());
      await prisma.user.update({
        where: { id: userId },
        data: { studentUsername: remaining.length > 0 ? remaining.join(', ') : null },
      });
      return { success: true, message: `Student ${targetStudentUsername} unlinked successfully.` };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { studentUsername: null },
    });
    return { success: true, message: 'Student(s) unlinked successfully.' };
  }

  if (user.role === 'STUDENT' && user.studentUsername) {
    // Unlink any parent monitoring this student
    const parents = await prisma.user.findMany({
      where: {
        role: 'PARENT',
        studentUsername: { contains: user.studentUsername },
      },
    });

    for (const p of parents) {
      const remaining = (p.studentUsername || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => Boolean(s) && s !== user.studentUsername);
      await prisma.user.update({
        where: { id: p.id },
        data: { studentUsername: remaining.length > 0 ? remaining.join(', ') : null },
      });
    }

    return { success: true, message: 'Parent unlinked successfully.' };
  }

  return { success: true, message: 'No active parent link found.' };
};

// ════════════════════════════════════════════════════════════════════════════
// 7. GET CURRENT USER
// ════════════════════════════════════════════════════════════════════════════

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { learnerProfile: true },
  });

  if (!user) throw { status: 404, message: 'User not found' };
  return safeUserResponse(user);
};

// ════════════════════════════════════════════════════════════════════════════
// 8. REFRESH TOKEN ROTATION WITH REUSE REVOCATION
// ════════════════════════════════════════════════════════════════════════════

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) throw { status: 401, message: 'User not found' };
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw { status: 401, message: 'Session has been revoked. Please sign in again.' };
    }

    const token = generateToken(user.id, user.role, user.tokenVersion);
    const rotatedRefreshToken = generateRefreshToken(user.id, user.tokenVersion);
    return { token, refreshToken: rotatedRefreshToken };
  } catch (error) {
    if (error.status) throw error;
    throw { status: 401, message: 'Invalid or expired refresh token' };
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 9. TWO-FACTOR AUTHENTICATION (2FA / TOTP)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Verify 2FA code during login and issue full authentication tokens
 */
const verifyTwoFactorLogin = async ({ tempToken, code, ip, userAgent }) => {
  if (!tempToken || !code) {
    throw { status: 400, message: 'Temporary token and verification code are required' };
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (decoded.purpose !== '2fa_login') {
      throw new Error('Invalid token purpose');
    }
  } catch {
    throw { status: 401, message: '2FA session has expired or is invalid. Please sign in again.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { learnerProfile: true },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw { status: 400, message: 'Two-factor authentication is not active for this account' };
  }

  // Check if account is currently locked out
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    const remainingMins = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
    await recordLoginAttempt({
      userId: user.id,
      identifier: user.email || 'user_2fa',
      ipAddress: ip,
      userAgent,
      status: 'BLOCKED',
      failureReason: 'ACCOUNT_LOCKED',
    });
    throw {
      status: 423,
      message: `Account is temporarily locked due to failed attempts. Try again in ${remainingMins} minute${remainingMins === 1 ? '' : 's'}.`,
    };
  }

  const cleanCode = code.toString().trim();
  let verified = false;
  let usedRecoveryCode = false;

  // 1. Try TOTP 6-digit code first
  if (/^\d{6}$/.test(cleanCode)) {
    verified = totp.verifyTOTP(user.twoFactorSecret, cleanCode, 1);
  }

  // 2. If not verified, try backup recovery code
  if (!verified && Array.isArray(user.twoFactorRecoveryCodes) && user.twoFactorRecoveryCodes.length > 0) {
    const matchIndex = totp.verifyRecoveryCode(cleanCode, user.twoFactorRecoveryCodes);
    if (matchIndex !== -1) {
      verified = true;
      usedRecoveryCode = true;
      const remainingCodes = [...user.twoFactorRecoveryCodes];
      remainingCodes.splice(matchIndex, 1);
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorRecoveryCodes: remainingCodes },
      });
      await prisma.userChangeLog.create({
        data: {
          userId: user.id,
          changedById: user.id,
          action: '2FA_RECOVERY_CODE_USED',
          details: { remainingCount: remainingCodes.length },
          ipAddress: ip || null,
        },
      });
    }
  }

  if (!verified) {
    const newFailedCount = (user.failedLoginAttempts || 0) + 1;
    const shouldLock = newFailedCount >= 5;
    const lockoutUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedCount,
        ...(shouldLock ? { lockoutUntil } : {}),
      },
    });

    await recordLoginAttempt({
      userId: user.id,
      identifier: user.email || 'user_2fa',
      ipAddress: ip,
      userAgent,
      status: shouldLock ? 'BLOCKED' : 'FAILED',
      failureReason: shouldLock ? '2FA_LOCKOUT_TRIGGERED' : 'INVALID_2FA_CODE',
    });

    if (shouldLock) {
      dispatchSecurityAlert({
        event: '2FA_LOCKOUT',
        severity: 'CRITICAL',
        title: `Account locked due to 5 failed 2FA verification attempts (${user.email})`,
        details: {
          userId: user.id,
          email: user.email,
          ipAddress: ip,
          userAgent,
          lockoutDuration: '15 minutes',
        },
      }).catch(() => {});

      throw {
        status: 423,
        message: 'Too many failed 2FA verification attempts. Account temporarily locked for 15 minutes. Contact an administrator for immediate unlock.',
      };
    }

    throw { status: 401, message: 'Invalid two-factor authentication code or backup recovery code' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip || null,
      updatedAt: new Date(),
    },
  });

  await recordLoginAttempt({
    userId: user.id,
    identifier: user.email || 'user_2fa',
    ipAddress: ip,
    userAgent,
    status: 'SUCCESS',
  });

  await recordUserSessionLog({
    userId: user.id,
    authType: usedRecoveryCode ? 'EMAIL_PASSWORD_2FA_BACKUP' : 'EMAIL_PASSWORD_2FA',
    ipAddress: ip,
    userAgent,
  });

  return authResponse(user);
};

/**
 * Setup 2FA: generates candidate secret, otpauth URI, and QR Code Data URL
 */
const setupTwoFactor = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, twoFactorEnabled: true },
  });
  if (!user) throw { status: 404, message: 'User not found' };

  const secret = totp.generateSecret();
  const otpauthUrl = totp.generateKeyUri({
    email: user.email || user.name,
    secret,
    issuer: 'EduNova',
  });
  const qrCodeDataUrl = await totp.generateQRCodeDataURL(otpauthUrl);

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
    twoFactorEnabled: user.twoFactorEnabled,
  };
};

/**
 * Enable 2FA: verifies candidate code and saves secret + 8 recovery backup codes
 */
const enableTwoFactor = async (userId, { code, secret }) => {
  if (!code || !secret) {
    throw { status: 400, message: 'Verification code and secret are required' };
  }

  const isValid = totp.verifyTOTP(secret, code, 1);
  if (!isValid) {
    throw { status: 400, message: 'Invalid 6-digit verification code. Please check your authenticator app.' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  const { codes, hashedCodes } = totp.generateRecoveryCodes(8);

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorRecoveryCodes: hashedCodes,
    },
  });

  await prisma.userChangeLog.create({
    data: {
      userId,
      changedById: userId,
      action: '2FA_ENABLED',
      details: { enabled: true, recoveryCodesCount: codes.length },
    },
  });

  if (user.role === 'ADMIN') {
    await prisma.adminAuditLog.create({
      data: {
        adminId: userId,
        action: 'ENABLE_2FA',
        targetType: 'User',
        targetId: userId,
        details: { adminEmail: user.email },
      },
    });
  }

  return {
    success: true,
    message: 'Two-factor authentication has been successfully activated!',
    recoveryCodes: codes,
  };
};

/**
 * Disable 2FA: requires valid TOTP code or account password
 */
const disableTwoFactor = async (userId, { code, password }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };
  if (!user.twoFactorEnabled) {
    throw { status: 400, message: 'Two-factor authentication is not enabled' };
  }

  let authorized = false;

  if (code && user.twoFactorSecret) {
    authorized = totp.verifyTOTP(user.twoFactorSecret, code, 1);
  }

  if (!authorized && password && user.passwordHash) {
    if (user.passwordHash.startsWith('$argon2')) {
      authorized = await argon2.verify(user.passwordHash, password);
    } else {
      const bcrypt = require('bcryptjs');
      authorized = await bcrypt.compare(password, user.passwordHash);
    }
  }

  if (!authorized) {
    throw { status: 401, message: 'Invalid 6-digit TOTP code or current password' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorRecoveryCodes: [],
    },
  });

  await prisma.userChangeLog.create({
    data: {
      userId,
      changedById: userId,
      action: '2FA_DISABLED',
      details: { enabled: false },
    },
  });

  if (user.role === 'ADMIN') {
    await prisma.adminAuditLog.create({
      data: {
        adminId: userId,
        action: 'DISABLE_2FA',
        targetType: 'User',
        targetId: userId,
        details: { adminEmail: user.email },
      },
    });
  }

  dispatchSecurityAlert({
    event: '2FA_DISABLED',
    severity: user.role === 'ADMIN' ? 'CRITICAL' : 'WARNING',
    title: `Two-factor authentication disabled on account ${user.email}`,
    details: { userId, email: user.email, role: user.role },
  }).catch(() => {});

  return {
    success: true,
    message: 'Two-factor authentication has been disabled',
  };
};

/**
 * Get 2FA status for the current user
 */
const getTwoFactorStatus = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      twoFactorEnabled: true,
      twoFactorRecoveryCodes: true,
    },
  });
  if (!user) throw { status: 404, message: 'User not found' };

  return {
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    recoveryCodesLeft: Array.isArray(user.twoFactorRecoveryCodes) ? user.twoFactorRecoveryCodes.length : 0,
  };
};

/**
 * Regenerate new backup recovery codes
 */
const generateNewRecoveryCodes = async (userId, { code, password }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw { status: 400, message: 'Two-factor authentication must be enabled first' };
  }

  let authorized = false;
  if (code) {
    authorized = totp.verifyTOTP(user.twoFactorSecret, code, 1);
  }
  if (!authorized && password && user.passwordHash) {
    if (user.passwordHash.startsWith('$argon2')) {
      authorized = await argon2.verify(user.passwordHash, password);
    } else {
      const bcrypt = require('bcryptjs');
      authorized = await bcrypt.compare(password, user.passwordHash);
    }
  }

  if (!authorized) {
    throw { status: 401, message: 'Invalid 6-digit TOTP code or password' };
  }

  const { codes, hashedCodes } = totp.generateRecoveryCodes(8);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorRecoveryCodes: hashedCodes },
  });

  await prisma.userChangeLog.create({
    data: {
      userId,
      changedById: userId,
      action: '2FA_RECOVERY_CODES_REGENERATED',
      details: { newCount: codes.length },
    },
  });

  return {
    success: true,
    message: 'New recovery codes generated. Please store them securely.',
    recoveryCodes: codes,
  };
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPasswordWithCode,
  requestEmailVerification,
  confirmEmailVerification,
  googleLogin,
  generateStudentLinkCode,
  linkParentToStudent,
  unlinkParentStudent,
  getMe,
  refreshAccessToken,
  generateToken,
  generateRefreshToken,
  verifyTwoFactorLogin,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  generateNewRecoveryCodes,
};
