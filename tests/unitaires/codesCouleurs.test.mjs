import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appliquerCode } from '../../src/lib/codesCouleurs.js';

const coloriage = () => [
  { id: 'g1', name: 'Fond', rows: [{ id: 'a', sym: '2', num: '' }, { id: 'b', sym: '3', num: '' }] },
  { id: 'g2', name: 'Robe', rows: [{ id: 'c', sym: '2', num: '' }, { id: 'd', sym: '2', num: '45 Prisma' }] },
];
const code = (g, id) => g.flatMap((x) => x.rows).find((r) => r.id === id);

test('le même symbole reçoit le même code dans tout le coloriage (toutes les sous-catégories)', () => {
  const g = appliquerCode(coloriage(), 'a', '119 Prisma', '#ff0000');
  assert.equal(code(g, 'a').num, '119 Prisma');
  assert.equal(code(g, 'c').num, '119 Prisma');
  assert.equal(code(g, 'c').hex, '#ff0000');
});

test('un autre symbole n’est pas touché', () => {
  assert.equal(code(appliquerCode(coloriage(), 'a', '119', ''), 'b').num, '');
});

test('une ligne du même symbole avec un autre code déjà choisi garde son code', () => {
  assert.equal(code(appliquerCode(coloriage(), 'a', '119', ''), 'd').num, '45 Prisma');
});

test('changer un code met à jour les lignes qui avaient ce même code', () => {
  let g = appliquerCode(coloriage(), 'a', '119', '');
  g = appliquerCode(g, 'c', '120', '');
  assert.equal(code(g, 'a').num, '120');
  assert.equal(code(g, 'c').num, '120');
  assert.equal(code(g, 'd').num, '45 Prisma');
});

test('une ligne sans symbole ne remplit rien d’autre', () => {
  const g = appliquerCode([{ id: 'g', rows: [{ id: 'x', sym: '', num: '' }, { id: 'y', sym: '', num: '' }] }], 'x', '7', '');
  assert.equal(code(g, 'y').num, '');
});

test('les autres coloriages ne sont jamais concernés : la fonction ne modifie pas la liste reçue', () => {
  const avant = coloriage();
  const copie = JSON.stringify(avant);
  appliquerCode(avant, 'a', '119', '');
  assert.equal(JSON.stringify(avant), copie);
});
