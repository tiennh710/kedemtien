import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { safeReturnTo } from '@/lib/server/security';

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.27.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  );
}

export function LoginForm({
  returnTo = '/tai-khoan',
  error,
}: {
  returnTo?: string;
  error?: string;
}) {
  const destination = safeReturnTo(returnTo);
  const loginUrl = `/api/auth/google?returnTo=${encodeURIComponent(destination)}`;
  const message =
    error === 'oauth_setup'
      ? 'Google OAuth chưa được cấu hình đầy đủ. Vui lòng liên hệ quản trị viên.'
      : error
        ? 'Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại.'
        : '';

  return (
    <div className="min-h-screen bg-[#f7f8fc] px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6d6e80]"
        >
          <ArrowLeft className="size-4" />
          Về thư viện
        </Link>
        <div className="mt-12 rounded-3xl bg-white p-7 shadow-[0_18px_60px_rgba(38,34,99,.09)] ring-1 ring-[#e0e1ea] sm:p-9">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#ece9ff] text-[#4635f3]">
            <ShieldCheck />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
            Đăng nhập bằng Google
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6f7082]">
            Dùng tài khoản Google để truy cập thư viện file và quản lý các sản
            phẩm bạn đã mua.
          </p>
          <a
            href={loginUrl}
            className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#d8d9e3] bg-white px-4 text-sm font-semibold text-[#252538] shadow-sm transition hover:border-[#b9b5f6] hover:bg-[#faf9ff] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#cbc7ff]"
          >
            <GoogleLogo />
            Tiếp tục với Google
          </a>
          {message && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {message}
            </p>
          )}
          <p className="mt-6 text-xs leading-5 text-[#8a8b9c]">
            Khi tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách riêng
            tư.
          </p>
        </div>
      </div>
    </div>
  );
}
