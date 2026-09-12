import { LoginForm } from '@/components/login-form';

export const metadata = { title: 'Đăng nhập' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm returnTo={params.returnTo} error={params.error} />;
}
