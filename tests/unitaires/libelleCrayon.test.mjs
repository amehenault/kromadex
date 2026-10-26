import { test } from 'node:test';
import assert from 'node:assert/strict';
import { libelleMarque } from '../../src/lib/libelleCrayon.js';

test('brush et alcool : la marque seule', () => {
  assert.equal(libelleMarque('Guangna', 'Brush acrylique'), 'Guangna');
  assert.equal(libelleMarque('Languo', 'Acrylique Brush (M720)'), 'Languo');
  assert.equal(libelleMarque('Ohuhu', 'Alcool'), 'Ohuhu');
});

test('gel acrylique et High Gloss : « acrylique gel »', () => {
  assert.equal(libelleMarque('Languo', 'Gel acrylique PLUS 1,0 (P650)'), 'Languo acrylique gel');
  assert.equal(libelleMarque('Infiart', 'Gel acrylique'), 'Infiart acrylique gel');
  assert.equal(libelleMarque('Guangna', 'High Gloss'), 'Guangna acrylique gel');
});

test('autre sorte : la sorte sans le modèle', () => {
  assert.equal(libelleMarque('Shuttle Art', 'Gel'), 'Shuttle Art gel');
  assert.equal(libelleMarque('Languo', 'Acrylique Pro (M730)'), 'Languo acrylique Pro');
  assert.equal(libelleMarque('Prismacolor', 'Crayons de couleur'), 'Prismacolor crayons de couleur');
  assert.equal(libelleMarque('Posca', ''), 'Posca');
});
