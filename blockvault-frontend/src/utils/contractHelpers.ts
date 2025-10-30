import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// BlockVaultLegal contract ABI for new functions
const BLOCKVAULT_LEGAL_ABI = [
  // View functions
  'function paused() view returns (bool)',
  'function getDocument(bytes32 docHash) view returns (tuple(bytes32 docHash, string cid, address owner, bytes32 parentHash, uint256 timestamp, uint8 status, bool exists))',
  'function getEscrowAmount(bytes32 docHash) view returns (uint256)',
  'function hasPermission(bytes32 docHash, address user) view returns (bool)',
  'function hasSigned(bytes32 docHash, address signer) view returns (bool)',
  
  // State-changing functions
  'function revokeAccess(bytes32 docHash, address recipient)',
  'function revokeDocument(bytes32 docHash)',
  'function cancelSignatureRequest(bytes32 docHash)',
  
  // Events
  'event AccessRevoked(bytes32 indexed docHash, address indexed owner, address indexed recipient)',
  'event DocumentRevoked(bytes32 indexed docHash, address indexed owner)',
  'event EscrowRefunded(bytes32 indexed docHash, address indexed owner, uint256 amount)',
  'event SignatureRequestCancelled(bytes32 indexed docHash, address indexed owner)',
];

export class ContractService {
  private contract: ethers.Contract | null = null;
  private contractAddress: string | null = null;

  async initialize(contractAddress: string, provider: ethers.Provider) {
    try {
      this.contractAddress = contractAddress;
      this.contract = new ethers.Contract(contractAddress, BLOCKVAULT_LEGAL_ABI, provider);
      return true;
    } catch (error) {
      console.error('Failed to initialize contract:', error);
      return false;
    }
  }

  async isPaused(): Promise<boolean> {
    try {
      if (!this.contract) return false;
      return await this.contract.paused();
    } catch (error) {
      console.error('Error checking pause status:', error);
      return false;
    }
  }

  async getDocument(docHash: string) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      return await this.contract.getDocument(docHash);
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  async getEscrowAmount(docHash: string): Promise<bigint> {
    try {
      if (!this.contract) return BigInt(0);
      return await this.contract.getEscrowAmount(docHash);
    } catch (error) {
      console.error('Error getting escrow amount:', error);
      return BigInt(0);
    }
  }

  async hasPermission(docHash: string, userAddress: string): Promise<boolean> {
    try {
      if (!this.contract) return false;
      return await this.contract.hasPermission(docHash, userAddress);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  async revokeAccess(docHash: string, recipientAddress: string, signer: ethers.Signer) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const contractWithSigner = this.contract.connect(signer) as any;
      
      const tx = await contractWithSigner.revokeAccess(docHash, recipientAddress);
      toast.success('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      toast.success('Access revoked successfully!');
      
      return receipt;
    } catch (error: any) {
      console.error('Error revoking access:', error);
      const message = error?.reason || error?.message || 'Failed to revoke access';
      toast.error(message);
      throw error;
    }
  }

  async revokeDocument(docHash: string, signer: ethers.Signer) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const contractWithSigner = this.contract.connect(signer) as any;
      
      const tx = await contractWithSigner.revokeDocument(docHash);
      toast.success('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      toast.success('Document revoked successfully!');
      
      return receipt;
    } catch (error: any) {
      console.error('Error revoking document:', error);
      const message = error?.reason || error?.message || 'Failed to revoke document';
      toast.error(message);
      throw error;
    }
  }

  async cancelSignatureRequest(docHash: string, signer: ethers.Signer) {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      const contractWithSigner = this.contract.connect(signer) as any;
      
      // Check escrow amount first
      const escrowAmount = await this.getEscrowAmount(docHash);
      
      const tx = await contractWithSigner.cancelSignatureRequest(docHash);
      
      if (escrowAmount > 0) {
        toast.success(`Transaction submitted. You will receive ${ethers.formatEther(escrowAmount)} ETH refund...`);
      } else {
        toast.success('Transaction submitted. Waiting for confirmation...');
      }
      
      const receipt = await tx.wait();
      
      if (escrowAmount > 0) {
        toast.success(`Signature request cancelled! Refund of ${ethers.formatEther(escrowAmount)} ETH processed.`);
      } else {
        toast.success('Signature request cancelled successfully!');
      }
      
      return receipt;
    } catch (error: any) {
      console.error('Error cancelling signature request:', error);
      const message = error?.reason || error?.message || 'Failed to cancel signature request';
      toast.error(message);
      throw error;
    }
  }
}

// Singleton instance
export const contractService = new ContractService();

// Helper to get signer
export const getSigner = async (): Promise<ethers.Signer | null> => {
  try {
    if (!window.ethereum) {
      toast.error('MetaMask not installed');
      return null;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer:', error);
    toast.error('Failed to get wallet signer');
    return null;
  }
};

// Helper to format document hash
export const formatDocHash = (hash: string): string => {
  if (hash.startsWith('0x')) return hash;
  return '0x' + hash;
};

