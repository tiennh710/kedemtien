import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ensureDatabase, getD1 } from '@/lib/server/database';
import { hmac, normalizeEmail, randomToken, safeReturnTo, sessionCookie } from '@/lib/server/security';

const inputSchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/),
  returnTo: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Thông tin xác minh không hợp lệ.' }, { status: 400 });
    const email = normalizeEmail(parsed.data.email);
    await ensureDatabase();
    const db = getD1();
    const challenge = await db.prepare(`SELECT id, code_hash, expires_at, attempts FROM otp_challenges WHERE email = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`).bind(email).first<{ id: number; code_hash: string; expires_at: number; attempts: number }>();
    if (!challenge || challenge.expires_at < Date.now() || challenge.attempts >= 5) return NextResponse.json({ error: 'Mã đã hết hạn. Vui lòng yêu cầu mã mới.' }, { status: 400 });
    const codeHash = await hmac(`${email}:${parsed.data.code}`, 'otp');
    if (codeHash !== challenge.code_hash) {
      await db.prepare('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?').bind(challenge.id).run();
      return NextResponse.json({ error: 'Mã xác minh chưa đúng.' }, { status: 400 });
    }

    const now = Date.now();
    await db.prepare('UPDATE otp_challenges SET consumed_at = ? WHERE id = ?').bind(now, challenge.id).run();
    await db.prepare('INSERT OR IGNORE INTO users (email, created_at) VALUES (?, ?)').bind(email, now).run();
    const user = await db.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first<{ id: number; email: string }>();
    if (!user) throw new Error('Không thể tạo tài khoản.');
    await db.prepare('UPDATE entitlements SET user_id = ? WHERE email = ? AND user_id IS NULL').bind(user.id, email).run();
    await db.prepare('UPDATE orders SET user_id = ? WHERE email = ? AND user_id IS NULL').bind(user.id, email).run();
    const token = randomToken();
    const tokenHash = await hmac(token);
    await db.prepare('INSERT INTO sessions (user_id, token_hash, expires_at, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?)').bind(user.id, tokenHash, now + 30 * 24 * 60 * 60 * 1000, now, now).run();
    const response = NextResponse.json({ ok: true, returnTo: safeReturnTo(parsed.data.returnTo) });
    response.headers.set('Set-Cookie', sessionCookie(token));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể đăng nhập.' }, { status: 500 });
  }
}
