'use client';

import { ArrowLeft, KeyRound, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm({ returnTo = '/tai-khoan' }: { returnTo?: string }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function requestCode(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('');
    try {
      const response = await fetch('/api/auth/request-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSent(true); if (data.debugCode) { setCode(data.debugCode); setMessage(`Chế độ local: mã ${data.debugCode} đã được điền sẵn.`); } else setMessage('Mã đăng nhập đã được gửi tới email của bạn.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể gửi mã.'); }
    finally { setLoading(false); }
  }

  async function verify(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('');
    try {
      const response = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, returnTo }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.href = data.returnTo;
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể đăng nhập.'); }
    finally { setLoading(false); }
  }

  return <div className="min-h-screen bg-[#f7f8fc] px-4 py-8"><div className="mx-auto max-w-md"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#6d6e80]"><ArrowLeft className="size-4" />Về thư viện</Link><div className="mt-12 rounded-3xl bg-white p-7 shadow-[0_18px_60px_rgba(38,34,99,.09)] ring-1 ring-[#e0e1ea] sm:p-9"><div className="grid size-12 place-items-center rounded-2xl bg-[#ece9ff] text-[#4635f3]">{sent ? <KeyRound /> : <Mail />}</div><h1 className="mt-5 text-2xl font-extrabold tracking-tight">{sent ? 'Nhập mã đăng nhập' : 'Đăng nhập bằng email'}</h1><p className="mt-2 text-sm leading-6 text-[#6f7082]">{sent ? `Mã gồm 6 chữ số đã được gửi tới ${email}.` : 'Không cần mật khẩu. Chúng tôi sẽ gửi một mã dùng một lần tới email của bạn.'}</p>
      {!sent ? <form onSubmit={requestCode} className="mt-6"><label htmlFor="login-email" className="text-sm font-semibold">Email</label><Input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" className="mt-2 h-11" placeholder="ban@example.com" /><Button disabled={loading} type="submit" className="mt-4 h-11 w-full bg-[#4635f3]">{loading && <Loader2 className="animate-spin" />}Gửi mã đăng nhập</Button></form> : <form onSubmit={verify} className="mt-6"><label htmlFor="login-code" className="text-sm font-semibold">Mã 6 chữ số</label><Input id="login-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required pattern="\d{6}" className="mt-2 h-12 text-center text-xl tracking-[.35em]" /><Button disabled={loading || code.length !== 6} type="submit" className="mt-4 h-11 w-full bg-[#4635f3]">{loading && <Loader2 className="animate-spin" />}Xác minh & đăng nhập</Button><button type="button" onClick={() => { setSent(false); setCode(''); setMessage(''); }} className="mt-3 w-full text-sm font-medium text-[#696a7e] hover:text-[#4635f3]">Dùng email khác</button></form>}
      {message && <p className="mt-4 rounded-xl bg-[#f4f2ff] px-3 py-2 text-sm text-[#5140c4]">{message}</p>}<p className="mt-6 text-xs leading-5 text-[#8a8b9c]">Khi tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách riêng tư.</p></div></div></div>;
}
