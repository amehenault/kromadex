import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleEvenement, modeAccepte, memeSecret, formuleDe, resumeAvis } from '../../src/lib/thrivecart.js';

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

test('le journal ne garde que les champs listés : ni secret, ni nom, ni adresse, ni carte', () => {
  const avis = {
    event: 'order.success', event_id: '77', mode: 'live', thrivecart_secret: 'SECRET',
    customer: { email: 'a@b.c', name: 'Marie Tremblay', address: { line1: '1 rue X' } },
    order: { total: '379', total_str: '3.79', card_last4: '4242' }, passthrough: { user_id: 'abc' },
  };
  const r = resumeAvis(avis);
  assert.deepEqual(Object.keys(r).sort(), ['event', 'event_id', 'formule', 'mode', 'order_total', 'order_total_str', 'passthrough_user_id']);
  const texte = JSON.stringify(r);
  for (const interdit of ['SECRET', 'Marie', '1 rue X', '4242', 'a@b.c']) assert.ok(!texte.includes(interdit), interdit);
  assert.equal(r.formule, 'mensuel');
  assert.equal(r.order_total_str, '3.79');
});

test('un avis en formulaire (customer[email]) est résumé de la même façon', () => {
  const r = resumeAvis({ event: 'order.refund', 'passthrough[user_id]': 'u1', 'customer[name]': 'X', order_total: '4099' });
  assert.equal(r.passthrough_user_id, 'u1');
  assert.equal(r.order_total, '4099');
  assert.ok(!JSON.stringify(r).includes('"X"'));
});
