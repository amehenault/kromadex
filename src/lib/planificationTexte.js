// Textes des rappels d'activités à planifier (utilisables dans le navigateur et sur le serveur)

// « dans 12 jours », « demain », « aujourd'hui », « il y a 3 jours »
export function quand(jours) {
  if (jours > 1) return `dans ${jours} jours`;
  if (jours === 1) return 'demain';
  if (jours === 0) return 'aujourd’hui';
  return `il y a ${-jours} jour${jours < -1 ? 's' : ''}`;
}

// Phrase du rappel : « Activité à planifier, début d'une nouvelle expédition dans 12 jours »
export function texteRappel(a) {
  const quoi = a.genre === 'bingo'
    ? (a.manquants > 1 ? `de ${a.manquants} nouveaux bingos` : 'd’un nouveau bingo')
    : `d’${a.une}`;
  const moment = a.jours < 0 ? `en retard de ${-a.jours} jour${a.jours < -1 ? 's' : ''}` : quand(a.jours);
  return `${a.manquants > 1 ? 'Activités à planifier' : 'Activité à planifier'}, début ${quoi} ${moment}`;
}
