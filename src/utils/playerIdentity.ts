const STORAGE_KEY_PLAYER_NAME = 'mot-melange-player-name';
const STORAGE_KEY_PLAYER_ID = 'mot-melange-player-id';

function generatePlayerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }

  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY_PLAYER_ID);
    if (!id) {
      id = generatePlayerId();
      localStorage.setItem(STORAGE_KEY_PLAYER_ID, id);
    }
    return id;
  } catch {
    return generatePlayerId();
  }
}

export function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_PLAYER_NAME) || '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYER_NAME, name);
  } catch {
    // localStorage might be unavailable
  }
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
