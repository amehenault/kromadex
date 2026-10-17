import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Palettes from './palettes';

export const dynamic = 'force-dynamic';

export default async function PalettesPage() {
  if (!(await getUser())) redirect('/login');
  return <Palettes />;
}
