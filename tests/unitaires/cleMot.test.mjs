import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleMot } from '../../src/lib/cleMot.js';

test('majuscules, pluriel et accents donnent le même mot', () => {
  for (const m of ['Lapin', 'lapin', 'Lapins', 'lapins', 'LAPINS', ' lapîn ', 'lapin.']) assert.equal(cleMot(m), 'lapin', m);
});

test('pluriels en -x, -eaux et -aux', () => {
  assert.equal(cleMot('Oiseaux'), cleMot('oiseau'));
  assert.equal(cleMot('chevaux'), cleMot('Cheval'));
  assert.equal(cleMot('Hiboux'), cleMot('hibou'));
});

test('expressions de plusieurs mots', () => {
  assert.equal(cleMot('Fleurs  roses'), cleMot('fleur rose'));
  assert.equal(cleMot('Arc-en-ciel'), cleMot('arc en ciel'));
});

test('des mots différents restent différents', () => {
  assert.notEqual(cleMot('lapin'), cleMot('renard'));
  assert.notEqual(cleMot('chat'), cleMot('chats roux'));
  assert.equal(cleMot('bus'), 'bus');
});
