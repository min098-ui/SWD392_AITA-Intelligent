import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes recommended for AES-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes authentication tag

/**
 * AES-256 Bidirectional Encryption Service (BR-02)
 * Encrypts API keys before storing in DB and decrypts when fetching to call Gemini/LLM APIs.
 */
export class CryptoService {
  /**
   * Derive a 32-byte Buffer from secret key
   */
  public static getKey(customKey?: string | Buffer): Buffer {
    const rawKey = customKey || process.env.AES_SECRET_KEY || '12345678901234567890123456789012';
    if (Buffer.isBuffer(rawKey)) {
      if (rawKey.length === 32) return rawKey;
      return crypto.createHash('sha256').update(rawKey).digest();
    }
    const keyStr = String(rawKey);
    if (keyStr.length === 32) {
      return Buffer.from(keyStr, 'utf8');
    }
    return crypto.createHash('sha256').update(keyStr).digest();
  }

  /**
   * Encrypt plain text using AES-256-GCM.
   * Returns formatted ciphertext: `${ivHex}:${authTagHex}:${encryptedHex}`
   */
  public static encrypt(plainText: string, customKey?: string | Buffer): string {
    if (!plainText) return '';
    const key = this.getKey(customKey);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt AES-256-GCM ciphertext.
   * Expects format: `${ivHex}:${authTagHex}:${encryptedHex}`
   */
  public static decrypt(cipherText: string, customKey?: string | Buffer): string {
    if (!cipherText) return '';

    // Handle mock values from seed data gracefully
    if (cipherText.startsWith('enc_gemini_api_key_mock_value')) {
      return process.env.GEMINI_API_KEY || 'MOCK_GEMINI_KEY_DEC_xxxx1234';
    }
    if (cipherText.startsWith('enc_openai_api_key_mock_value')) {
      return process.env.OPENAI_API_KEY || 'MOCK_OPENAI_KEY_DEC_yyyy5678';
    }

    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid AES-256 ciphertext format. Expected iv:authTag:encrypted');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = this.getKey(customKey);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Verify if a string is a valid AES-256 ciphertext
   */
  public static isEncrypted(text: string): boolean {
    if (!text) return false;
    if (text.startsWith('enc_gemini_') || text.startsWith('enc_openai_')) return true;
    const parts = text.split(':');
    return parts.length === 3 && parts[0].length === IV_LENGTH * 2 && parts[1].length === AUTH_TAG_LENGTH * 2;
  }

  /**
   * Helper to mask an API key for safe display (e.g. AIzaSy...xxxx)
   */
  public static maskApiKey(rawKey: string): string {
    if (!rawKey || rawKey.length <= 8) return '****';
    const prefix = rawKey.substring(0, 6);
    const suffix = rawKey.substring(rawKey.length - 4);
    return `${prefix}...${suffix}`;
  }
}

export const encryptApiKey = (text: string, key?: string | Buffer) => CryptoService.encrypt(text, key);
export const decryptApiKey = (text: string, key?: string | Buffer) => CryptoService.decrypt(text, key);
