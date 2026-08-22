"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.maskBankAccount = maskBankAccount;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'dayflow_hrms_super_secret_key_32b'; // 32 characters key
const KEY = crypto_1.default.scryptSync(SECRET_KEY, 'salt', 32);
function encrypt(text) {
    if (!text)
        return null;
    // If already encrypted (format iv:data), return as is
    if (text.includes(':') && text.split(':')[0].length === 32)
        return text;
    try {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }
    catch (error) {
        console.error('Encryption error:', error);
        return text;
    }
}
function decrypt(text) {
    if (!text)
        return null;
    if (!text.includes(':'))
        return text; // Return unencrypted as fallback if plain text
    try {
        const parts = text.split(':');
        if (parts.length !== 2)
            return text;
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        // If decryption fails (e.g. invalid format), return original text
        return text;
    }
}
function maskBankAccount(accountNumber) {
    if (!accountNumber)
        return '••••••••';
    const plain = decrypt(accountNumber) || accountNumber;
    if (plain.length <= 4)
        return `••••${plain}`;
    return `••••••••${plain.slice(-4)}`;
}
