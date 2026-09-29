import { redirect } from 'next/navigation';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { getCurrentUser } from '@/data/auth';

export const metadata = { title: 'Workspace — Vesper' };

export default async function WorkspacePage() {
  // The real check: the proxy only saw that a cookie exists; this validates it.
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=/workspace');
  return <WorkspaceShell user={{ name: user.name, email: user.email }} />;
}
