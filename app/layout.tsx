import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { CartProvider } from '@/components/cart-provider';

import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
const allowIndexing = process.env.ALLOW_INDEXING === '1';

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: 'Kẻ Đếm Tiền — Mẫu Excel thực chiến',
    template: '%s — Kẻ Đếm Tiền',
  },
  description:
    'Kho mẫu Excel chọn lọc cho tài chính, kinh doanh và quản lý. Mua một lần, tải xuống và dùng ngay.',
  icons: { icon: '/favicon.svg' },
  robots: allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: 'Kẻ Đếm Tiền — Mẫu Excel thực chiến',
    description: 'Kho mẫu Excel chọn lọc cho tài chính, kinh doanh và quản lý.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Kẻ Đếm Tiền — Mẫu Excel thực chiến',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kẻ Đếm Tiền — Mẫu Excel thực chiến',
    description: 'Kho mẫu Excel chọn lọc cho tài chính, kinh doanh và quản lý.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
