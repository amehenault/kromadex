import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AMBIANCES, FETES, couleursDuTheme, cleValide, nomTheme } from '../../src/lib/themesPalettes.js';

test('chaque ambiance et chaque fête donne le bon nombre de couleurs valides', () => {
  for (const t of [...AMBIANCES, ...FETES]) {
    for (let n = 2; n <= 8; n++) {
      const c = couleursDuTheme(t, n);
      assert.equal(c.length, n, `${t.nom} : ${n} couleurs`);
      for (const hex of c) assert.match(hex, /^#[0-9A-F]{6}$/, `${t.nom} : ${hex}`);
    }
  }
});

test('clés uniques et noms retrouvés', () => {
  for (const l of [AMBIANCES, FETES]) assert.equal(new Set(l.map((t) => t.cle)).size, l.length);
  assert.equal(nomTheme('fete', 'halloween'), 'Halloween');
  assert.equal(nomTheme('ambiance', 'pastel'), 'Pastel');
});

test('une clé inconnue ou d’une autre catégorie est refusée', () => {
  assert.equal(cleValide('fete', 'noel'), 'noel');
  assert.equal(cleValide('ambiance', 'noel'), '');
  assert.equal(cleValide('fete', 'n’importe quoi'), '');
});
