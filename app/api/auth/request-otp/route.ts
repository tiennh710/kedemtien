import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ensureDatabase, getD1 } from '@/lib/server/database';
import { sendOtpEmail } from '@/lib/server/email';
import { env } from '@/lib/server/env';
import { hmac, normalizeEmail, requestFingerprint } from '@/lib/server/security';

const inputSchema = z.object({ email: z.email().max(254) });

export async function POST(request: Request) {
  let stage = 'parse-request';
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 });
    const email = normalizeEmail(parsed.data.email);
    stage = 'fingerprint';
    const ipHash = await requestFingerprint(request);
    stage = 'database';
    await ensureDatabase();
    const db = getD1();
    const now = Date.now();
    const recent = await db.prepare('SELECT created_at FROM otp_challenges WHERE email = ? ORDER BY created_at DESC LIMIT 1').bind(email).first<{ created_at: number }>();
    if (recent && now - recent.created_at < 60_000) return NextResponse.json({ error: 'Vui lòng chờ một phút trước khi gửi lại mã.' }, { status: 429 });
    const hourly = await db.prepare('SELECT COUNT(*) AS count FROM otp_challenges WHERE (email = ? OR ip_hash = ?) AND created_at > ?').bind(email, ipHash, now - 60 * 60 * 1000).first<{ count: number }>();
    if ((hourly?.count ?? 0) >= 5) return NextResponse.json({ error: 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau.' }, { status: 429 });

    const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
    const code = random.toString().padStart(6, '0');
    stage = 'hmac';
    const codeHash = await hmac(`${email}:${code}`, 'otp');
    stage = 'save-challenge';
    const result = await db.prepare('INSERT INTO otp_challenges (email, code_hash, ip_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)').bind(email, codeHash, ipHash, now + 10 * 60 * 1000, now).run();
    const challengeId = Number(result.meta.last_row_id);
    stage = 'send-email';
    const delivery = await sendOtpEmail(email, code, challengeId);
    if (!delivery.ok && env.ALLOW_DEV_OTP !== '1') return NextResponse.json({ error: delivery.error }, { status: 503 });
    return NextResponse.json({ ok: true, ...(env.ALLOW_DEV_OTP === '1' ? { debugCode: code } : {}) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể gửi mã đăng nhập.';
    return NextResponse.json({ error: `[${stage}] ${message}` }, { status: 500 });
  }
}
