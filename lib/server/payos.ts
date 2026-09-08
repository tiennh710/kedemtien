import { env } from 'cloudflare:workers';

const encoder = new TextEncoder();

async function signData(data: Record<string, unknown>, secret: string) {
  const canonical = Object.keys(data).sort().map((key) => `${key}=${serializeValue(data[key])}`).join('&');
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(canonical));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function serializeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function requirePayOs() {
  if (!env.PAYOS_CLIENT_ID || !env.PAYOS_API_KEY || !env.PAYOS_CHECKSUM_KEY) throw new Error('PayOS chưa được cấu hình.');
  return { clientId: env.PAYOS_CLIENT_ID, apiKey: env.PAYOS_API_KEY, checksumKey: env.PAYOS_CHECKSUM_KEY };
}

export async function createPayOsLink(input: { orderCode: number; amount: number; items: Array<{ name: string; quantity: number; price: number }>; returnUrl: string; cancelUrl: string }) {
  const config = requirePayOs();
  const description = `KDT${String(input.orderCode).slice(-6)}`;
  const signingFields = { amount: input.amount, cancelUrl: input.cancelUrl, description, orderCode: input.orderCode, returnUrl: input.returnUrl };
  const signature = await signData(signingFields, config.checksumKey);
  const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
    method: 'POST',
    headers: { 'x-client-id': config.clientId, 'x-api-key': config.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...signingFields, items: input.items, signature, expiredAt: Math.floor(Date.now() / 1000) + 30 * 60 }),
  });
  const payload = (await response.json()) as { code?: string; desc?: string; data?: { checkoutUrl?: string; paymentLinkId?: string } };
  if (!response.ok || payload.code !== '00' || !payload.data?.checkoutUrl) throw new Error(payload.desc || `PayOS trả về ${response.status}`);
  return payload.data;
}

export async function verifyPayOsWebhook(payload: unknown) {
  const config = requirePayOs();
  if (!payload || typeof payload !== 'object') return null;
  const input = payload as { data?: Record<string, unknown>; signature?: string; success?: boolean };
  if (!input.data || !input.signature) return null;
  const expected = await signData(input.data, config.checksumKey);
  if (!timingSafeEqual(expected, input.signature.toLowerCase())) return null;
  return { ...input.data, success: input.success };
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}
