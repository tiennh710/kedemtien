import { LoginForm } from '@/components/login-form';

export const metadata = { title: 'Đăng nhập' };

export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  return <LoginForm returnTo={(await searchParams).returnTo} />;
}
