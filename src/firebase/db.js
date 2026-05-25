// src/firebase/db.js
import { db } from './config';
import {
  ref,
  push,
  set,
  get,
  remove,
  onValue,
} from 'firebase/database';

// Guard: return no-op when Firebase is not configured
function noDb(callback) {
  if (callback) callback([]);
  return () => {};
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export function subscribeTransactions(callback) {
  if (!db) return noDb(callback);
  const r = ref(db, 'transactions');
  return onValue(r, (snapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);
    const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  });
}

export async function addTransaction(transaction) {
  if (!db) throw new Error('Firebase not configured');
  const r = ref(db, 'transactions');
  const newRef = push(r);
  await set(newRef, { ...transaction, createdAt: Date.now() });
  return newRef.key;
}

export async function deleteTransaction(id) {
  if (!db) throw new Error('Firebase not configured');
  await remove(ref(db, `transactions/${id}`));
}

// ─── CASH ─────────────────────────────────────────────────────────────────────

export function subscribeCash(callback) {
  if (!db) return noDb(() => callback(0));
  const r = ref(db, 'cashBalance');
  return onValue(r, (snapshot) => callback(snapshot.val() ?? 0));
}

export async function setCashBalance(amount) {
  if (!db) throw new Error('Firebase not configured');
  await set(ref(db, 'cashBalance'), amount);
}

export async function getCashBalance() {
  if (!db) return 0;
  const snap = await get(ref(db, 'cashBalance'));
  return snap.val() ?? 0;
}

// ─── CASH HISTORY ─────────────────────────────────────────────────────────────

export function subscribeCashHistory(callback) {
  if (!db) return noDb(callback);
  const r = ref(db, 'cashHistory');
  return onValue(r, (snapshot) => {
    const data = snapshot.val();
    if (!data) return callback([]);
    const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  });
}

export async function addCashEntry(entry) {
  if (!db) throw new Error('Firebase not configured');
  const r = ref(db, 'cashHistory');
  const newRef = push(r);
  await set(newRef, { ...entry, createdAt: Date.now() });
}
