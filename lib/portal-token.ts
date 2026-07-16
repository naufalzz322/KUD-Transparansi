import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
);

const PORTAL_COOKIE_NAME = 'portal_session';
const PORTAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface PortalSession {
  memberId: string;
  memberToken: string;
  memberNumber: string;
  name: string;
  exp: number;
}

export async function generatePortalToken(): Promise<string> {
  const { randomBytes } = await import('crypto');
  return randomBytes(32).toString('hex');
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function generateSessionToken(
  memberId: string,
  memberToken: string,
  memberNumber: string,
  name: string
): Promise<string> {
  const token = await new SignJWT({
    memberId,
    memberToken,
    memberNumber,
    name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

export async function setPortalSession(
  memberId: string,
  memberToken: string,
  memberNumber: string,
  name: string
): Promise<void> {
  const token = await generateSessionToken(memberId, memberToken, memberNumber, name);
  const cookieStore = await cookies();

  cookieStore.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PORTAL_COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function getPortalSession(): Promise<PortalSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return payload as unknown as PortalSession;
  } catch (error) {
    return null;
  }
}

export async function clearPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_COOKIE_NAME);
}

export async function verifySessionToken(token: string): Promise<PortalSession | null> {
  try {
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as PortalSession;
  } catch {
    return null;
  }
}

/**
 * Verify a portal session token matches the expected member token.
 * Returns the session payload if valid, null otherwise.
 */
export async function verifyPortalSession(
  sessionToken: string,
  expectedMemberToken: string
): Promise<PortalSession | null> {
  try {
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);

    if (payload.memberToken !== expectedMemberToken) {
      return null;
    }

    return payload as unknown as PortalSession;
  } catch {
    return null;
  }
}
