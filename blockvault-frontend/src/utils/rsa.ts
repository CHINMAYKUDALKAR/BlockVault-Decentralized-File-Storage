import forge from 'node-forge';

export interface RSAKeyPair {
  privateKey: string;
  publicKey: string;
}

export class RSAKeyManager {
  private static instance: RSAKeyManager;
  private keyPair: RSAKeyPair | null = null;

  private constructor() {}

  static getInstance(): RSAKeyManager {
    if (!RSAKeyManager.instance) {
      RSAKeyManager.instance = new RSAKeyManager();
    }
    return RSAKeyManager.instance;
  }

  generateKeyPair(): RSAKeyPair {
    const keypair = forge.pki.rsa.generateKeyPair(2048);
    const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
    
    this.keyPair = {
      privateKey: privateKeyPem,
      publicKey: publicKeyPem
    };

    // Store in localStorage
    localStorage.setItem('blockvault_rsa_keys', JSON.stringify(this.keyPair));
    
    return this.keyPair;
  }

  getKeyPair(): RSAKeyPair | null {
    if (this.keyPair) {
      return this.keyPair;
    }

    // Try to load from localStorage
    const stored = localStorage.getItem('blockvault_rsa_keys');
    if (stored) {
      try {
        this.keyPair = JSON.parse(stored);
        return this.keyPair;
      } catch (error) {
        console.error('Failed to parse stored RSA keys:', error);
        localStorage.removeItem('blockvault_rsa_keys');
      }
    }

    return null;
  }

  hasKeyPair(): boolean {
    return this.getKeyPair() !== null;
  }

  clearKeyPair(): void {
    this.keyPair = null;
    localStorage.removeItem('blockvault_rsa_keys');
  }

  getPublicKey(): string | null {
    const keyPair = this.getKeyPair();
    return keyPair ? keyPair.publicKey : null;
  }

  getPrivateKey(): string | null {
    const keyPair = this.getKeyPair();
    return keyPair ? keyPair.privateKey : null;
  }
}

export const rsaKeyManager = RSAKeyManager.getInstance();
