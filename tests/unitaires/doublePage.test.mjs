import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pagesDuNumero, estDoublePage, numeroDoublePage, debutDoublePage } from '../../src/lib/doublePage.js';

test('une double page couvre les deux pages', () => {
  assert.deepEqual(pagesDuNumero('28-29'), [28, 29]);
  assert.deepEqual(pagesDuNumero(' 1-2 '), [1, 2]);
  assert.equal(debutDoublePage('28-29'), 28);
  assert.equal(numeroDoublePage(28), '28-29');
});

test('une page simple reste une seule page', () => {
  assert.deepEqual(pagesDuNumero('12'), [12]);
  assert.deepEqual(pagesDuNumero(''), []);
  assert.deepEqual(pagesDuNumero('0'), []);
  assert.equal(estDoublePage('12'), false);
});

test('deux pages qui ne se suivent pas ne sont pas une double page', () => {
  assert.equal(estDoublePage('28-30'), false);
  assert.equal(estDoublePage('0-1'), false);
});
