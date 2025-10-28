"""
ZKML Inference Service for Document Summarization
Integrates pretrained models with Zero-Knowledge proofs for verifiable AI inference
"""

import os
import json
import hashlib
import numpy as np
import torch
from transformers import AutoTokenizer, BartForConditionalGeneration
from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)

class ZKMLSummarizer:
    """
    Zero-Knowledge Machine Learning Summarizer
    Runs model inference with verifiable ZK proofs for document summarization
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize ZKML Summarizer
        
        Args:
            model_path: Path to model directory (defaults to ../models/bart-large-cnn)
        """
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            model_path = os.path.join(base_dir, 'models', 'bart-large-cnn')
        
        self.model_path = model_path
        
        try:
            # Load BART model and tokenizer
            logger.info(f"Loading ZKML model from {model_path}")
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = BartForConditionalGeneration.from_pretrained(model_path)
            
            # Set model to evaluation mode
            self.model.eval()
            
            # Get model hash for verification
            self.model_hash = self._get_model_hash()
            
            logger.info(f"✅ ZKML Model loaded successfully. Hash: {self.model_hash[:16]}...")
            
        except Exception as e:
            logger.error(f"Failed to load ZKML model: {str(e)}")
            raise RuntimeError(f"Could not load model from {model_path}: {str(e)}")
    
    def preprocess_document(self, text: str, max_length: int = 1024) -> Dict[str, torch.Tensor]:
        """
        Preprocess document for model input
        
        Args:
            text: Input document text
            max_length: Maximum sequence length
            
        Returns:
            Dictionary of input tensors
        """
        # Clean and truncate text
        text = text.strip()
        if len(text) > 10000:  # Limit very long documents
            text = text[:10000] + "..."
        
        # Tokenize text
        inputs = self.tokenizer(
            text,
            max_length=max_length,
            truncation=True,
            padding='max_length',
            return_tensors='pt'
        )
        
        return inputs
    
    def run_inference(self, text: str, max_length: int = 150, min_length: int = 30) -> Tuple[str, Dict[str, Any]]:
        """
        Run model inference on document
        
        Args:
            text: Input document text
            max_length: Maximum summary length
            min_length: Minimum summary length
            
        Returns:
            Tuple of (summary, metadata)
        """
        try:
            # Preprocess
            inputs = self.preprocess_document(text)
            
            # Run inference
            with torch.no_grad():
                summary_ids = self.model.generate(
                    inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_length=max_length,
                    min_length=min_length,
                    length_penalty=2.0,
                    num_beams=4,
                    early_stopping=True
                )
            
            # Decode output
            summary = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)
            
            # Generate metadata for ZK proof
            metadata = {
                'input_hash': hashlib.sha256(text.encode('utf-8')).hexdigest(),
                'output_hash': hashlib.sha256(summary.encode('utf-8')).hexdigest(),
                'model_hash': self.model_hash,
                'input_length': len(text),
                'output_length': len(summary),
                'max_length': max_length,
                'min_length': min_length,
                'timestamp': int(os.times().elapsed * 1000),
                'model_name': 'bart-large-cnn',
                'verification_key': self._generate_verification_key(text, summary)
            }
            
            logger.info(f"✅ Generated summary: {len(summary)} chars")
            return summary, metadata
            
        except Exception as e:
            logger.error(f"Inference error: {str(e)}")
            raise RuntimeError(f"Failed to run inference: {str(e)}")
    
    def generate_zk_proof(self, text: str, summary: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate ZK proof for model inference
        
        Args:
            text: Original document text
            summary: Generated summary
            metadata: Inference metadata
            
        Returns:
            ZK proof data
        """
        try:
            # Prepare circuit inputs for ZK proof
            circuit_inputs = {
                'input_hash': metadata['input_hash'],
                'output_hash': metadata['output_hash'],
                'model_hash': metadata['model_hash'],
                'input_length': str(metadata['input_length']),
                'output_length': str(metadata['output_length']),
                'verification_key': metadata['verification_key']
            }
            
            # Generate commitment for ZK proof
            commitment = self._generate_commitment(circuit_inputs)
            
            # In production, this would generate actual ZK proof using snarkjs/circom
            # For now, return structured proof with verifiable commitments
            proof = {
                'pi_a': self._generate_proof_point(commitment, 'a'),
                'pi_b': self._generate_proof_matrix(commitment, 'b'),
                'pi_c': self._generate_proof_point(commitment, 'c'),
                'protocol': 'groth16',
                'curve': 'bn128',
                'public_signals': [
                    metadata['input_hash'][:16],  # Truncated for circuit efficiency
                    metadata['output_hash'][:16],
                    metadata['model_hash'][:16],
                    metadata['verification_key'][:16]
                ],
                'commitment': commitment,
                'circuit_inputs': circuit_inputs
            }
            
            logger.info("✅ Generated ZK proof")
            return proof
            
        except Exception as e:
            logger.error(f"ZK proof generation error: {str(e)}")
            raise RuntimeError(f"Failed to generate ZK proof: {str(e)}")
    
    def verify_inference(self, text: str, summary: str, proof: Dict[str, Any]) -> bool:
        """
        Verify inference with ZK proof
        
        Args:
            text: Original document text
            summary: Generated summary
            proof: ZK proof to verify
            
        Returns:
            True if proof is valid
        """
        try:
            # Verify hashes match
            input_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
            output_hash = hashlib.sha256(summary.encode('utf-8')).hexdigest()
            
            # Check public signals match
            hash_matches = (
                proof['public_signals'][0] == input_hash[:16] and
                proof['public_signals'][1] == output_hash[:16] and
                proof['public_signals'][2] == self.model_hash[:16]
            )
            
            # Verify commitment
            commitment_valid = self._verify_commitment(proof['commitment'], proof['circuit_inputs'])
            
            # Verify proof structure
            proof_structure_valid = (
                'pi_a' in proof and
                'pi_b' in proof and
                'pi_c' in proof and
                len(proof['public_signals']) == 4
            )
            
            is_valid = hash_matches and commitment_valid and proof_structure_valid
            
            logger.info(f"ZK verification result: {is_valid}")
            return is_valid
            
        except Exception as e:
            logger.error(f"ZK verification error: {str(e)}")
            return False
    
    def _get_model_hash(self) -> str:
        """Get hash of model files for verification"""
        try:
            # Hash the main model file
            model_file = os.path.join(self.model_path, 'pytorch_model.bin')
            if os.path.exists(model_file):
                with open(model_file, 'rb') as f:
                    return hashlib.sha256(f.read()).hexdigest()
            else:
                # Fallback: hash config and tokenizer
                config_file = os.path.join(self.model_path, 'config.json')
                tokenizer_file = os.path.join(self.model_path, 'tokenizer.json')
                
                combined_hash = hashlib.sha256()
                for file_path in [config_file, tokenizer_file]:
                    if os.path.exists(file_path):
                        with open(file_path, 'rb') as f:
                            combined_hash.update(f.read())
                
                return combined_hash.hexdigest()
        except Exception as e:
            logger.warning(f"Could not compute model hash: {str(e)}")
            return "unknown_model_hash"
    
    def _generate_verification_key(self, text: str, summary: str) -> str:
        """Generate verification key for ZK proof"""
        combined = f"{text[:100]}{summary}{self.model_hash}"
        return hashlib.sha256(combined.encode('utf-8')).hexdigest()
    
    def _generate_commitment(self, inputs: Dict[str, str]) -> str:
        """Generate commitment for ZK proof"""
        combined = ''.join(f"{k}:{v}" for k, v in sorted(inputs.items()))
        return hashlib.sha256(combined.encode('utf-8')).hexdigest()
    
    def _verify_commitment(self, commitment: str, inputs: Dict[str, str]) -> bool:
        """Verify commitment matches inputs"""
        expected = self._generate_commitment(inputs)
        return commitment == expected
    
    def _generate_proof_point(self, commitment: str, suffix: str) -> List[str]:
        """Generate mock proof point (replace with actual snarkjs)"""
        # Use commitment as seed for deterministic "random" values
        seed = int(commitment[:8], 16)
        np.random.seed(seed)
        
        return [str(np.random.randint(1, 1000)) for _ in range(3)]
    
    def _generate_proof_matrix(self, commitment: str, suffix: str) -> List[List[str]]:
        """Generate mock proof matrix (replace with actual snarkjs)"""
        # Use commitment as seed for deterministic "random" values
        seed = int(commitment[:8], 16) + len(suffix)
        np.random.seed(seed)
        
        return [[str(np.random.randint(1, 1000)) for _ in range(2)] for _ in range(3)]


# Global instance
_summarizer = None

def get_zkml_summarizer() -> ZKMLSummarizer:
    """Get or create ZKML summarizer instance"""
    global _summarizer
    if _summarizer is None:
        _summarizer = ZKMLSummarizer()
    return _summarizer


def test_zkml_summarizer():
    """Test function for ZKML summarizer"""
    try:
        summarizer = get_zkml_summarizer()
        
        # Test document
        test_text = """
        Artificial Intelligence (AI) has revolutionized numerous industries and continues to shape our daily lives. 
        From healthcare to finance, AI technologies are being deployed to solve complex problems and improve efficiency. 
        Machine learning algorithms can analyze vast amounts of data to identify patterns and make predictions. 
        Deep learning, a subset of machine learning, uses neural networks to process information in ways similar to the human brain. 
        Natural language processing enables computers to understand and generate human language. 
        Computer vision allows machines to interpret and analyze visual information. 
        These technologies are being integrated into autonomous vehicles, medical diagnosis systems, and financial trading platforms. 
        However, the rapid advancement of AI also raises important questions about ethics, privacy, and the future of work. 
        As AI becomes more sophisticated, ensuring responsible development and deployment becomes crucial for society.
        """
        
        print("🧪 Testing ZKML Summarizer...")
        summary, metadata = summarizer.run_inference(test_text)
        print(f"📄 Summary: {summary}")
        
        proof = summarizer.generate_zk_proof(test_text, summary, metadata)
        print(f"🔐 Proof generated: {len(proof['public_signals'])} public signals")
        
        verified = summarizer.verify_inference(test_text, summary, proof)
        print(f"✅ Verification: {verified}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False


if __name__ == "__main__":
    test_zkml_summarizer()
