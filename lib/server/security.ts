import { ensureDatabase, getD1 } from '@/lib/server/database';
import { env } from '@/lib/server/env';

export const SESSION_COOKIE = 'kdt_session';

const encoder = new TextEncoder();

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase('en-US');
}

export function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return toBase64Url(bytes);
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export async function sha256(value: string | ArrayBuffer) {
  const input = typeof value === 'string' ? encoder.encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function hmac(value: string) {
  const secret = env.SESSION_SECRET;
  if (!secret || secret.length < 24)
    throw new Error('SESSION_SECRET chưa được cấu hình an toàn.');
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function requestFingerprint(request: Request) {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    'local';
  return sha256(`${ip}|${request.headers.get('user-agent') ?? ''}`);
}

export function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export type SessionUser = { id: number; email: string; isAdmin: boolean };

export function isAdminEmail(email: string) {
  const allowed = (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  return allowed.includes(normalizeEmail(email));
}

export async function getSessionUser(
  request: Request,
): Promise<SessionUser | null> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  await ensureDatabase();
  const tokenHash = await hmac(token);
  const row = await getD1()
    .prepare(`
    SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1
  `)
    .bind(tokenHash, Date.now())
    .first<{ id: number; email: string }>();
  if (!row) return null;
  void getD1()
    .prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?')
    .bind(Date.now(), tokenHash)
    .run();
  return { ...row, isAdmin: isAdminEmail(row.email) };
}

export async function createUserSession(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  await ensureDatabase();
  const db = getD1();
  const now = Date.now();
  await db
    .prepare('INSERT OR IGNORE INTO users (email, created_at) VALUES (?, ?)')
    .bind(email, now)
    .run();
  const user = await db
    .prepare('SELECT id FROM users WHERE email = ? LIMIT 1')
    .bind(email)
    .first<{ id: number }>();
  if (!user) throw new Error('Không thể tạo tài khoản.');

  await db
    .prepare(
      'UPDATE entitlements SET user_id = ? WHERE email = ? AND user_id IS NULL',
    )
    .bind(user.id, email)
    .run();
  await db
    .prepare(
      'UPDATE orders SET user_id = ? WHERE email = ? AND user_id IS NULL',
    )
    .bind(user.id, email)
    .run();

  const token = randomToken();
  const tokenHash = await hmac(token);
  await db
    .prepare(
      'INSERT INTO sessions (user_id, token_hash, expires_at, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(user.id, tokenHash, now + 30 * 24 * 60 * 60 * 1000, now, now)
    .run();
  return token;
}

export function sessionCookie(
  token: string,
  maxAgeSeconds = 60 * 60 * 24 * 30,
) {
  const secure = env.APP_ORIGIN?.startsWith('http://localhost')
    ? ''
    : '; Secure';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  const secure = env.APP_ORIGIN?.startsWith('http://localhost')
    ? ''
    : '; Secure';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`;
}

export function safeReturnTo(value: unknown) {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : '/tai-khoan';
}
