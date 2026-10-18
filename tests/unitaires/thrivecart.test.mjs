import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleEvenement, modeAccepte, memeSecret, formuleDe } from '../../src/lib/thrivecart.js';

test('la clé d’un avis vient de son event_id', () => {
  assert.equal(cleEvenement({ event: 'order.success', event_id: '123', order_id: '9' }), 'order.success:123');
});

test('sans event_id, deux copies identiques (ordre des champs différent) donnent la même clé', () => {
  const a = { event: 'order.refund', order_id: '9', customer: { email: 'a@b.c', nom: 'X' }, thrivecart_secret: 's1' };
  const b = { customer: { nom: 'X', email: 'a@b.c' }, thrivecart_secret: 's2', order_id: '9', event: 'order.refund' };
  assert.equal(cleEvenement(a), cleEvenement(b));
  assert.notEqual(cleEvenement(a), cleEvenement({ ...a, order_id: '10' }));
});

test('les modes test et production sont séparés', () => {
  assert.equal(modeAccepte({ mode: 'live' }, 'live'), true);
  assert.equal(modeAccepte({ mode: 'test' }, 'live'), false);
  assert.equal(modeAccepte({}, 'live'), false);
  assert.equal(modeAccepte({ mode: 'test' }, 'test'), true);
  assert.equal(modeAccepte({ mode: 'live' }, 'test'), false);
});

test('le mot secret est comparé exactement', () => {
  assert.equal(memeSecret('abc', 'abc'), true);
  assert.equal(memeSecret('abd', 'abc'), false);
  assert.equal(memeSecret('', ''), false);
  assert.equal(memeSecret(undefined, 'abc'), false);
});

test('formule mensuelle ou annuelle', () => {
  assert.equal(formuleDe({ base_product_name: 'Kromadex+ annuel' }), 'annuel');
  // Montants réels de ThriveCart : total en cents, total_str en dollars
  assert.equal(formuleDe({ order: { total: '379' } }), 'mensuel');
  assert.equal(formuleDe({ order: { total: '4099' } }), 'annuel');
  assert.equal(formuleDe({ order: { total: '379', total_str: '3.79' } }), 'mensuel');
  assert.equal(formuleDe({ order: { total: '4099', total_str: '40.99' } }), 'annuel');
});
