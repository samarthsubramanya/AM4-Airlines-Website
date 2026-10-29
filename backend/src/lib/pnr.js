import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newPnr() {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

export function newTicketNumber() {
  return `963-${String(randomInt(1e9)).padStart(9, '0')}${randomInt(10)}`;
}
