import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { getCurrentUser } from '@/data/auth';

export const metadata = { title: 'Sign in — Vesper' };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  if (await getCurrentUser()) redirect('/workspace');
  const { next } = await searchParams;
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <AuthForm mode="sign-in" next={next} />
    </AuthLayout>
  );
}
