import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { getCurrentUser } from '@/data/auth';

export const metadata = { title: 'Create account — Vesper' };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  if (await getCurrentUser()) redirect('/workspace');
  const { next } = await searchParams;
  return (
    <AuthLayout title="Create your account" subtitle="Your sessions, notes and history, saved in one place.">
      <AuthForm mode="sign-up" next={next} />
    </AuthLayout>
  );
}
