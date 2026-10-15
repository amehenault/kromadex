'use client';
import { useState, useEffect, useMemo } from 'react';
import { Users, Search, Tag, Plus, Sparkles } from 'lucide-react';

export default function RolesPanel() {
  const [users, setUsers] = useState([]);
  const [titles, setTitles] = useState([]);
  const [userRole, setUserRole] = useState('');
  
  const [rechercheUser, setRechercheUser] = useState('');
  const [filtreRole, setFiltreRole] = useState('tous');

  const [nomTitre, setNomTitre] = useState('');
  const [conditionTitre, setConditionTitre] = useState('');
  const [chargement, setChargement] = useState(true);

  async function chargerDonnees() {
    const res = await fetch('/api/roles');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setTitles(data.titles || []);
      setUserRole(data.userRole || '');
    }
    setChargement(false);
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  const membresFiltres = useMemo(() => {
    return users.filter((u) => {
      const matchRecherche = (u.email || '').toLowerCase().includes(rechercheUser.toLowerCase()) ||
                             (u.pseudo || '').toLowerCase().includes(rechercheUser.toLowerCase());
      const matchRole = filtreRole === 'tous' || u.role === filtreRole;
      return matchRecherche && matchRole;
    });
  }, [users, rechercheUser, filtreRole]);

  async function changerRole(userId, nouveauRole) {
    await fetch('/api/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, role: nouveauRole }),
    });
    chargerDonnees();
  }

  async function changerTitre(userId, nouveauTitre) {
    await fetch('/api/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, title: nouveauTitre }),
    });
    chargerDonnees();
  }

  async function creerTitre(e) {
    e.preventDefault();
    if (!nomTitre.trim()) return;

    await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nomTitre, description: conditionTitre }),
    });

    setNomTitre('');
    setConditionTitre('');
    chargerDonnees();
  }

  if (chargement) return <p>Chargement du panneau...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-4)' }}>
      
      {/* SECTION 1 : GESTION DES RÔLES */}
      <div className="carte">
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} style={{ color: 'var(--accent-primaire)' }} />
          Gestion des Rôles
        </h3>

        <div style={{ display: 'flex', gap: 'var(--espace-2)', flexWrap: 'wrap', marginBottom: 'var(--espace-3)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--texte-secondaire)' }} />
            <input 
              placeholder="Rechercher un utilisateur..." 
              value={rechercheUser}
              onChange={(e) => setRechercheUser(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>

          <select value={filtreRole} onChange={(e) => setFiltreRole(e.target.value)} style={{ width: 'auto' }}>
            <option value="tous">Tous les rôles</option>
            <option value="admin">Admins</option>
            <option value="modo">Modos</option>
            <option value="cheffe">Cheffes</option>
            <option value="coloriste">Coloristes</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-2)' }}>
          {membresFiltres.map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--espace-2)', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-s)', border: '1px solid var(--bordure-carte)', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <b>{u.email}</b> <small>({u.pseudo ? `@${u.pseudo}` : 'Sans pseudo'})</small>
              </div>

              {userRole === 'admin' ? (
                <div style={{ display: 'flex', gap: 'var(--espace-2)', alignItems: 'center' }}>
                  <select value={u.role || 'coloriste'} onChange={(e) => changerRole(u.id, e.target.value)}>
                    <option value="coloriste">Coloriste</option>
                    <option value="cheffe">Cheffe (1 mois)</option>
                    <option value="modo">Modo</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select value={u.title || ''} onChange={(e) => changerTitre(u.id, e.target.value)}>
                    <option value="">Attribuer un titre</option>
                    {titles.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span>Rôle : <b>{u.role}</b></span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 : GESTION DES TITRES */}
      <div className="carte">
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={20} style={{ color: 'var(--accent-primaire)' }} />
          Gestion des Titres
        </h3>

        {userRole === 'admin' && (
          <form onSubmit={creerTitre} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espace-2)', marginBottom: 'var(--espace-4)' }}>
            <h4>Ajouter un nouveau titre</h4>
            <input 
              placeholder="Nom du titre (ex: Maître des Nuances)" 
              value={nomTitre} 
              onChange={(e) => setNomTitre(e.target.value)}
            />
            <input 
              placeholder="Condition pour l'obtenir (ex: Avoir colorié 50 pages)" 
              value={conditionTitre} 
              onChange={(e) => setConditionTitre(e.target.value)}
            />
            <button type="submit" className="btn" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Créer le titre
            </button>
          </form>
        )}

        <h4>Titres actuels et conditions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--espace-2)' }}>
          {titles.map((t) => (
            <div key={t.id} style={{ padding: 'var(--espace-2)', background: 'var(--fond-carte)', borderRadius: 'var(--rayon-s)', border: '1px solid var(--bordure-carte)' }}>
              <b style={{ color: 'var(--accent-primaire)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} /> {t.name}
              </b>
              <small style={{ color: 'var(--texte-secondaire)', display: 'block', marginTop: '4px' }}>
                {t.description || 'Aucune condition définie'}
              </small>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}