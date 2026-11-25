import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import {
  getOrCreateUser,
  getQuizSettingsRow,
  hasAnyAdminUser,
  promoteUserToAdmin,
  saveAdminPasscodeHash,
} from '../db/queries.ts';

const ADMIN_CODE = 'AN7';
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    email: string;
    displayName: string | null;
    role: string;
  };
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashPasscode(passcode: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passcode, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPasscodeHash(passcode: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(passcode, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function issueAdminSessionToken(uid: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 6; // 6 hours
  const payload = `${uid}.${exp}`;
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string, expectedUid: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [uid, expStr, sig] = parts;
  if (uid !== expectedUid) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${uid}.${expStr}`)
    .digest('hex');
  return timingSafeStringEqual(sig, expectedSig);
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول بحساب Google أولاً.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name || null
    );
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'جلسة الدخول غير صالحة أو منتهية.' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    if (!req.user || !req.dbUser) {
      return res.status(401).json({ error: 'غير مصرح بالدخول.' });
    }
    if (req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'ليس لديك صلاحيات الإدارة.' });
    }
    const adminToken = req.headers['x-admin-token'];
    if (
      typeof adminToken !== 'string' ||
      !verifyAdminSessionToken(adminToken, req.user.uid)
    ) {
      return res
        .status(403)
        .json({ error: 'يرجى التحقق من رمز الأدمن وكلمة المرور أولاً.' });
    }
    next();
  });
};

export async function getAdminGateStatus(uid: string, currentRole: string) {
  const settings = await getQuizSettingsRow();
  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  const adminExists = await hasAnyAdminUser();
  const hasPasscodeConfigured = Boolean(envPasscode) || Boolean(settings.adminPasscodeHash);

  const canClaimFirstAdmin =
    !adminExists || currentRole === 'admin';

  return {
    isAdminUser: currentRole === 'admin',
    canClaimFirstAdmin,
    requiresFirstTimePasscodeSetup: !hasPasscodeConfigured && canClaimFirstAdmin,
  };
}

export async function verifyAndUnlockAdmin(params: {
  uid: string;
  currentRole: string;
  adminName: string;
  passcode: string;
}) {
  const trimmedName = params.adminName.trim();
  if (!timingSafeStringEqual(trimmedName, ADMIN_CODE)) {
    return { ok: false as const, status: 403, error: 'اسم الأدمن غير صحيح.' };
  }

  const passcode = params.passcode;
  if (!passcode || passcode.length < 4) {
    return {
      ok: false as const,
      status: 400,
      error: 'كلمة مرور الإدارة يجب أن تتكون من 4 أحرف على الأقل.',
    };
  }

  const adminExists = await hasAnyAdminUser();
  if (adminExists && params.currentRole !== 'admin') {
    return {
      ok: false as const,
      status: 403,
      error: 'هذا الحساب لا يملك صلاحية الإدارة المعتمدة.',
    };
  }

  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  const settings = await getQuizSettingsRow();

  if (envPasscode) {
    if (!timingSafeStringEqual(passcode, envPasscode)) {
      return { ok: false as const, status: 403, error: 'كلمة مرور الإدارة غير صحيحة.' };
    }
  } else if (settings.adminPasscodeHash) {
    if (!verifyPasscodeHash(passcode, settings.adminPasscodeHash)) {
      return { ok: false as const, status: 403, error: 'كلمة مرور الإدارة غير صحيحة.' };
    }
  } else {
    // First-run setup: atomically hash and store the admin's chosen passcode
    const newHash = hashPasscode(passcode);
    await saveAdminPasscodeHash(newHash);
  }

  if (params.currentRole !== 'admin') {
    await promoteUserToAdmin(params.uid);
  }

  const adminToken = issueAdminSessionToken(params.uid);
  return { ok: true as const, adminToken };
}
