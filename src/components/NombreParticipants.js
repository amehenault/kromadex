export default function NombreParticipants({ n }) {
  const nombre = Number(n) || 0;
  return (
    <small style={{ color: 'var(--couleur-secondaire)', fontWeight: 700 }}>
      {nombre} participant{nombre > 1 ? 's' : ''}
    </small>
  );
}
