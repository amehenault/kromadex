import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import AuthForm from '@/components/AuthForm';

export default async function Login() {
  if (await getUser()) redirect('/');
  return <AuthForm />;
}
