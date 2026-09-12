import { env } from '@/lib/server/env';

type EmailResult = { ok: true; id?: string } | { ok: false; error: string };

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}): Promise<EmailResult> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM)
    return { ok: false, error: 'Resend chưa được cấu hình.' };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey,
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!response.ok)
    return {
      ok: false,
      error: `Resend trả về ${response.status}: ${(await response.text()).slice(0, 300)}`,
    };
  const data = (await response.json()) as { id?: string };
  return { ok: true, id: data.id };
}

export function sendDownloadEmail(
  email: string,
  orderCode: number,
  links: Array<{ title: string; url: string }>,
  attemptKey = 'initial',
) {
  const items = links
    .map(
      (link) =>
        `<li style="margin:12px 0"><a href="${link.url}" style="color:#4635f3;font-weight:700">Tải ${escapeHtml(link.title)}</a></li>`,
    )
    .join('');
  const plain = links.map((link) => `${link.title}: ${link.url}`).join('\n');
  return sendEmail({
    to: email,
    subject: `File Excel cho đơn #${orderCode}`,
    idempotencyKey: `order-${orderCode}-delivery-${attemptKey}`,
    text: `Cảm ơn bạn đã chọn Kẻ Đếm Tiền. Link có hiệu lực trong 7 ngày và tối đa 5 lượt tải.\n${plain}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#17172a"><p style="font-weight:800;color:#4635f3">KẺ ĐẾM TIỀN</p><h1 style="font-size:24px">File của bạn đã sẵn sàng</h1><p>Cảm ơn bạn đã chọn Kẻ Đếm Tiền. Link có hiệu lực trong 7 ngày và tối đa 5 lượt tải.</p><ul>${items}</ul><p style="color:#737386;font-size:13px">Đơn hàng #${orderCode}</p></div>`,
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[
        character
      ] ?? character,
  );
}
