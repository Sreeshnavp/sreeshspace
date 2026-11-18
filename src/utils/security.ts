// 🔒 MASTER VAULT SECURITY & CRYPTOGRAPHIC VERIFICATION

const VAULT_SALT = 'orbit_sreeshnav_vault_sec_#99k28a!7';

// Cryptographic one-way hash of master passcode
export const INITIAL_PIN_HASH = '24a5dd2b5a73977f488c0b02b0f8402729047de805e1643c875e70fc94768b54';
export const STORAGE_KEY_PIN_HASH = 'orbit_pin_hash_v1';
export const STORAGE_KEY_UNLOCKED = 'orbit_unlocked_device_v1';

/**
 * Computes salted SHA-256 hash of passcode using native Web Crypto API
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + VAULT_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gets currently active PIN hash (custom if user changed it, otherwise initial hash)
 */
export function getActivePinHash(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_PIN_HASH) || INITIAL_PIN_HASH;
  } catch {
    return INITIAL_PIN_HASH;
  }
}

/**
 * Sets new PIN hash
 */
export async function updatePinHash(newPin: string): Promise<void> {
  const hash = await hashPin(newPin);
  try {
    localStorage.setItem(STORAGE_KEY_PIN_HASH, hash);
  } catch (err) {
    console.error('Failed to save PIN hash:', err);
  }
}

/**
 * Checks if current device is authenticated & unlocked
 */
export function isDeviceUnlocked(): boolean {
  try {
    // Check localStorage (remembered device) or sessionStorage (single tab)
    const local = localStorage.getItem(STORAGE_KEY_UNLOCKED);
    const session = sessionStorage.getItem(STORAGE_KEY_UNLOCKED);
    return local === 'unlocked' || session === 'unlocked';
  } catch {
    return false;
  }
}

/**
 * Marks device as unlocked
 */
export function setDeviceUnlocked(remember: boolean): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_UNLOCKED, 'unlocked');
    if (remember) {
      localStorage.setItem(STORAGE_KEY_UNLOCKED, 'unlocked');
    } else {
      localStorage.removeItem(STORAGE_KEY_UNLOCKED);
    }
  } catch (err) {
    console.error('Failed to persist unlock state:', err);
  }
}

/**
 * Instantly locks the device
 */
export function lockDevice(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_UNLOCKED);
    sessionStorage.removeItem(STORAGE_KEY_UNLOCKED);
  } catch (err) {
    console.error('Failed to lock device:', err);
  }
}

/**
 * Verifies entered PIN against stored SHA-256 hash
 */
export async function verifyPin(enteredPin: string): Promise<boolean> {
  const enteredHash = await hashPin(enteredPin);
  const targetHash = getActivePinHash();
  return enteredHash === targetHash;
}
