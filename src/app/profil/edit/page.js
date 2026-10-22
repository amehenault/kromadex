import { redirect } from 'next/navigation';

// L'ancienne page « Modifier mon profil » est maintenant dans Paramètres > Mes informations
export default function EditProfilPage() {
  redirect('/parametres/informations');
}
