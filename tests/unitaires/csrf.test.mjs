import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requeteAutorisee } from '../../src/lib/csrf.js';

const hote = 'app.kromadex.com';
const base = { methode: 'POST', chemin: '/api/palettes', hote };

test('les lectures (GET) passent toujours', () => {
  assert.equal(requeteAutorisee({ ...base, methode: 'GET', origin: 'https://evil.example' }), true);
});

test('une écriture venant du site passe', () => {
  assert.equal(requeteAutorisee({ ...base, origin: 'https://app.kromadex.com' }), true);
  assert.equal(requeteAutorisee({ ...base, secFetchSite: 'same-origin' }), true);
});

test('une écriture venant d’un autre site est refusée', () => {
  assert.equal(requeteAutorisee({ ...base, origin: 'https://evil.example' }), false);
  assert.equal(requeteAutorisee({ ...base, origin: 'https://app.kromadex.com.evil.example' }), false);
  assert.equal(requeteAutorisee({ ...base, origin: 'null' }), false);
  assert.equal(requeteAutorisee({ ...base, methode: 'DELETE', origin: 'http://app.kromadex.com.evil.example' }), false);
});

test('un sous-domaine (même « site ») est refusé', () => {
  assert.equal(requeteAutorisee({ ...base, origin: 'https://autre.kromadex.com' }), false);
  assert.equal(requeteAutorisee({ ...base, secFetchSite: 'same-site' }), false);
  assert.equal(requeteAutorisee({ ...base, secFetchSite: 'cross-site' }), false);
});

test('le webhook ThriveCart est exempté (protégé par son mot secret)', () => {
  assert.equal(requeteAutorisee({ ...base, chemin: '/api/paiements/thrivecart', origin: 'https://evil.example' }), true);
});

test('un client hors navigateur (sans Origin ni Sec-Fetch-Site) passe', () => {
  assert.equal(requeteAutorisee(base), true);
});
