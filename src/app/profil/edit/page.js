import { redirect } from 'next/navigation';

// L'ancienne page « Modifier mon profil » est maintenant dans Paramètres
export default function EditProfilPage() {
  redirect('/parametres');
}
