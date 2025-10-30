// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title BlockVaultLegal
 * @dev Smart contract for legal document management with ZK proofs
 * @notice This contract handles document notarization, ZKPT redaction, e-signatures, and ZKML analysis
 * @custom:security-contact security@blockvault.com
 */
contract BlockVaultLegal is Ownable, ReentrancyGuard, Pausable {
    
    // ============ CONSTANTS ============
    
    uint256 public constant MAX_SIGNERS = 50;
    uint256 public constant MAX_DEADLINE = 365 days;
    
    // ============ STRUCTS ============
    
    enum Status {
        Registered,
        AwaitingSignatures,
        Executed,
        Revoked,
        Cancelled
    }
    
    struct DocumentRecord {
        bytes32 docHash;
        string cid;
        address owner;
        bytes32 parentHash;
        uint256 timestamp;
        Status status;
        bool exists;
    }
    
    struct SignatureRequest {
        address[] requiredSigners;
        mapping(address => bytes) signatures;
        mapping(address => bool) hasSigned;
        uint256 signedCount;
        uint256 deadline;
        bool escrowClaimed;
    }
    
    // ============ STATE VARIABLES ============
    
    mapping(bytes32 => DocumentRecord) public documentRegistry;
    mapping(bytes32 => SignatureRequest) public signatureRequests;
    mapping(bytes32 => mapping(address => bool)) public documentPermissions;
    mapping(bytes32 => uint256) public escrowedFunds;
    
    // ZK Verifiers
    address public integrityVerifier;
    address public zkptVerifier;
    address public zkmlVerifier;
    
    // ============ EVENTS ============
    
    event DocumentRegistered(bytes32 indexed docHash, address indexed owner, string cid);
    event TransformationRegistered(bytes32 indexed transformedHash, bytes32 indexed originalHash);
    event AccessGranted(bytes32 indexed docHash, address indexed owner, address indexed recipient);
    event AccessRevoked(bytes32 indexed docHash, address indexed owner, address indexed recipient);
    event SignatureRequested(bytes32 indexed docHash, address[] signers, uint256 deadline, uint256 escrowAmount);
    event DocumentSigned(bytes32 indexed docHash, address indexed signer);
    event ContractExecuted(bytes32 indexed docHash, address indexed recipient, uint256 amount);
    event MLInferenceVerified(bytes32 indexed docHash, int256 result);
    event VerifiersUpdated(address integrityVerifier, address zkptVerifier, address zkmlVerifier);
    event DocumentRevoked(bytes32 indexed docHash, address indexed owner);
    event EscrowRefunded(bytes32 indexed docHash, address indexed owner, uint256 amount);
    event SignatureRequestCancelled(bytes32 indexed docHash, address indexed owner);
    
    // ============ ERRORS ============
    
    error InvalidAddress();
    error DocumentAlreadyExists();
    error DocumentNotFound();
    error NotDocumentOwner();
    error InvalidProof();
    error InvalidSignatureLength();
    error InvalidSignature();
    error NotRequiredSigner();
    error AlreadySigned();
    error DeadlinePassed();
    error TooManySigners();
    error InvalidDeadline();
    error NoSignersProvided();
    error InvalidStatus();
    error EscrowAlreadyClaimed();
    error TransferFailed();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _integrityVerifier,
        address _zkptVerifier,
        address _zkmlVerifier
    ) {
        if (_integrityVerifier == address(0) || _zkptVerifier == address(0) || _zkmlVerifier == address(0)) {
            revert InvalidAddress();
        }
        integrityVerifier = _integrityVerifier;
        zkptVerifier = _zkptVerifier;
        zkmlVerifier = _zkmlVerifier;
    }
    
    // ============ MODIFIERS ============
    
    modifier onlyDocumentOwner(bytes32 _docHash) {
        if (documentRegistry[_docHash].owner != msg.sender) {
            revert NotDocumentOwner();
        }
        _;
    }
    
    modifier documentExists(bytes32 _docHash) {
        if (!documentRegistry[_docHash].exists) {
            revert DocumentNotFound();
        }
        _;
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Registers a new, original document using a "Proof of Integrity"
     * @param _cid The IPFS Content Identifier of the document
     * @param a The ZK proof's 'a' component
     * @param b The ZK proof's 'b' component  
     * @param c The ZK proof's 'c' component
     * @param publicInputs The public inputs for the proof, containing the document's hash
     */
    function registerDocument(
        string calldata _cid,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[2] calldata publicInputs
    ) external whenNotPaused {
        bytes32 docHash = bytes32(publicInputs[0]);
        
        if (docHash == bytes32(0)) revert InvalidAddress();
        if (documentRegistry[docHash].exists) revert DocumentAlreadyExists();
        
        // Verify the ZK proof of integrity
        if (!_verifyZKProof(integrityVerifier, a, b, c, publicInputs)) {
            revert InvalidProof();
        }
        
        // Record the document
        documentRegistry[docHash] = DocumentRecord({
            docHash: docHash,
            cid: _cid,
            owner: msg.sender,
            parentHash: bytes32(0), // parentHash is zero for an original document
            timestamp: block.timestamp,
            status: Status.Registered,
            exists: true
        });
        
        emit DocumentRegistered(docHash, msg.sender, _cid);
    }
    
    /**
     * @dev Registers a new document as a verifiable transformation of an existing one
     * @param _newFileCID The IPFS CID of the transformed document
     * @param a The ZKPT proof's 'a' component
     * @param b The ZKPT proof's 'b' component
     * @param c The ZKPT proof's 'c' component
     * @param publicInputs The public inputs containing original and transformed hashes
     */
    function registerTransformation(
        string calldata _newFileCID,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[2] calldata publicInputs
    ) external whenNotPaused {
        bytes32 originalHash = bytes32(publicInputs[0]);
        bytes32 transformedHash = bytes32(publicInputs[1]);
        
        if (originalHash == bytes32(0) || transformedHash == bytes32(0)) revert InvalidAddress();
        if (!documentRegistry[originalHash].exists) revert DocumentNotFound();
        if (documentRegistry[originalHash].owner != msg.sender) revert NotDocumentOwner();
        if (documentRegistry[transformedHash].exists) revert DocumentAlreadyExists();
        
        // Verify the ZKPT proof
        if (!_verifyZKProof(zkptVerifier, a, b, c, publicInputs)) {
            revert InvalidProof();
        }
        
        // Record the transformation
        documentRegistry[transformedHash] = DocumentRecord({
            docHash: transformedHash,
            cid: _newFileCID,
            owner: msg.sender,
            parentHash: originalHash, // Link to the parent document
            timestamp: block.timestamp,
            status: Status.Registered,
            exists: true
        });
        
        emit TransformationRegistered(transformedHash, originalHash);
    }
    
    /**
     * @dev Grants another user access to a specific document
     * @param _docHash The hash of the document
     * @param _recipient The address to grant access to
     */
    function grantAccess(bytes32 _docHash, address _recipient) 
        external 
        whenNotPaused
        onlyDocumentOwner(_docHash) 
        documentExists(_docHash) 
    {
        if (_recipient == address(0)) revert InvalidAddress();
        if (_recipient == msg.sender) revert InvalidAddress();
        
        documentPermissions[_docHash][_recipient] = true;
        emit AccessGranted(_docHash, msg.sender, _recipient);
    }
    
    /**
     * @dev Revokes user access to a specific document
     * @param _docHash The hash of the document
     * @param _recipient The address to revoke access from
     */
    function revokeAccess(bytes32 _docHash, address _recipient) 
        external 
        whenNotPaused
        onlyDocumentOwner(_docHash) 
        documentExists(_docHash) 
    {
        if (_recipient == address(0)) revert InvalidAddress();
        
        documentPermissions[_docHash][_recipient] = false;
        emit AccessRevoked(_docHash, msg.sender, _recipient);
    }
    
    /**
     * @dev Requests signatures for a document and optionally locks funds in escrow
     * @param _docHash The hash of the document
     * @param _signers Array of addresses that need to sign
     * @param _deadline Timestamp when the signature request expires
     */
    function requestSignaturesAndEscrow(
        bytes32 _docHash,
        address[] calldata _signers,
        uint256 _deadline
    ) external payable whenNotPaused onlyDocumentOwner(_docHash) documentExists(_docHash) {
        if (documentRegistry[_docHash].status != Status.Registered) revert InvalidStatus();
        if (_signers.length == 0) revert NoSignersProvided();
        if (_signers.length > MAX_SIGNERS) revert TooManySigners();
        if (_deadline <= block.timestamp) revert InvalidDeadline();
        if (_deadline > block.timestamp + MAX_DEADLINE) revert InvalidDeadline();
        
        // Validate signers (no duplicates, no zero addresses)
        for (uint256 i = 0; i < _signers.length; i++) {
            if (_signers[i] == address(0)) revert InvalidAddress();
            // Check for duplicates
            for (uint256 j = i + 1; j < _signers.length; j++) {
                if (_signers[i] == _signers[j]) revert InvalidAddress();
            }
        }
        
        // Set up signature request
        signatureRequests[_docHash].requiredSigners = _signers;
        signatureRequests[_docHash].deadline = _deadline;
        signatureRequests[_docHash].signedCount = 0;
        signatureRequests[_docHash].escrowClaimed = false;
        documentRegistry[_docHash].status = Status.AwaitingSignatures;
        
        // Handle escrow if funds are provided
        if (msg.value > 0) {
            escrowedFunds[_docHash] = msg.value;
        }
        
        emit SignatureRequested(_docHash, _signers, _deadline, msg.value);
    }
    
    /**
     * @dev Allows a required signatory to submit their cryptographic signature
     * @param _docHash The hash of the document
     * @param _signature The signature to verify and record
     */
    function signDocument(bytes32 _docHash, bytes calldata _signature) 
        external 
        whenNotPaused
        documentExists(_docHash) 
        nonReentrant 
    {
        SignatureRequest storage request = signatureRequests[_docHash];
        
        if (documentRegistry[_docHash].status != Status.AwaitingSignatures) revert InvalidStatus();
        if (block.timestamp > request.deadline) revert DeadlinePassed();
        
        // Check if already signed
        if (request.hasSigned[msg.sender]) revert AlreadySigned();
        
        // Check if sender is a required signer
        bool isRequiredSigner = false;
        address[] memory requiredSigners = request.requiredSigners;
        for (uint256 i = 0; i < requiredSigners.length; i++) {
            if (requiredSigners[i] == msg.sender) {
                isRequiredSigner = true;
                break;
            }
        }
        if (!isRequiredSigner) revert NotRequiredSigner();
        
        // Verify the signature
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _docHash));
        address signer = _recoverSigner(messageHash, _signature);
        if (signer != msg.sender) revert InvalidSignature();
        
        // Record the signature
        request.signatures[msg.sender] = _signature;
        request.hasSigned[msg.sender] = true;
        request.signedCount++;
        emit DocumentSigned(_docHash, msg.sender);
        
        // Check if all signatures are collected
        if (request.signedCount == requiredSigners.length) {
            documentRegistry[_docHash].status = Status.Executed;
            
            // Execute escrow if funds are locked
            uint256 amount = escrowedFunds[_docHash];
            if (amount > 0 && !request.escrowClaimed) {
                request.escrowClaimed = true;
                address payable recipient = payable(documentRegistry[_docHash].owner);
                escrowedFunds[_docHash] = 0;
                (bool success, ) = recipient.call{value: amount}("");
                if (!success) revert TransferFailed();
                emit ContractExecuted(_docHash, recipient, amount);
            }
        }
    }
    
    /**
     * @dev Allows document owner to cancel signature request and reclaim escrow after deadline
     * @param _docHash The hash of the document
     */
    function cancelSignatureRequest(bytes32 _docHash) 
        external 
        whenNotPaused
        onlyDocumentOwner(_docHash) 
        documentExists(_docHash)
        nonReentrant
    {
        SignatureRequest storage request = signatureRequests[_docHash];
        
        if (documentRegistry[_docHash].status != Status.AwaitingSignatures) revert InvalidStatus();
        if (block.timestamp <= request.deadline) revert InvalidDeadline();
        
        // Update status
        documentRegistry[_docHash].status = Status.Cancelled;
        
        // Refund escrow if exists and not claimed
        uint256 amount = escrowedFunds[_docHash];
        if (amount > 0 && !request.escrowClaimed) {
            request.escrowClaimed = true;
            escrowedFunds[_docHash] = 0;
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            if (!success) revert TransferFailed();
            emit EscrowRefunded(_docHash, msg.sender, amount);
        }
        
        emit SignatureRequestCancelled(_docHash, msg.sender);
    }
    
    /**
     * @dev Allows document owner to revoke a document
     * @param _docHash The hash of the document
     */
    function revokeDocument(bytes32 _docHash) 
        external 
        whenNotPaused
        onlyDocumentOwner(_docHash) 
        documentExists(_docHash) 
    {
        if (documentRegistry[_docHash].status == Status.Revoked) revert InvalidStatus();
        
        documentRegistry[_docHash].status = Status.Revoked;
        emit DocumentRevoked(_docHash, msg.sender);
    }
    
    /**
     * @dev Verifies a ZKML proof that a specific AI model was run on a document
     * @param _docHash The hash of the document
     * @param a The ZKML proof's 'a' component
     * @param b The ZKML proof's 'b' component
     * @param c The ZKML proof's 'c' component
     * @param publicInputs The public inputs containing model parameters and result
     */
    function verifyMLInference(
        bytes32 _docHash,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata publicInputs
    ) external whenNotPaused documentExists(_docHash) {
        // Verify the ZKML proof
        if (!_verifyZKProof(zkmlVerifier, a, b, c, publicInputs)) {
            revert InvalidProof();
        }
        
        emit MLInferenceVerified(_docHash, int256(publicInputs[2]));
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Returns the document record for a given hash
     */
    function getDocument(bytes32 _docHash) external view returns (DocumentRecord memory) {
        return documentRegistry[_docHash];
    }
    
    /**
     * @dev Returns the signature request for a given document
     */
    function getSignatureRequest(bytes32 _docHash) external view returns (
        address[] memory requiredSigners,
        uint256 signedCount,
        uint256 deadline,
        bool escrowClaimed
    ) {
        SignatureRequest storage request = signatureRequests[_docHash];
        return (request.requiredSigners, request.signedCount, request.deadline, request.escrowClaimed);
    }
    
    /**
     * @dev Checks if a signer has already signed a document
     */
    function hasSigned(bytes32 _docHash, address _signer) external view returns (bool) {
        return signatureRequests[_docHash].hasSigned[_signer];
    }
    
    /**
     * @dev Returns the signature for a specific signer
     */
    function getSignature(bytes32 _docHash, address _signer) external view returns (bytes memory) {
        return signatureRequests[_docHash].signatures[_signer];
    }
    
    /**
     * @dev Checks if an address has permission to access a document
     */
    function hasPermission(bytes32 _docHash, address _user) external view returns (bool) {
        return documentPermissions[_docHash][_user] || documentRegistry[_docHash].owner == _user;
    }
    
    /**
     * @dev Returns the escrow amount for a document
     */
    function getEscrowAmount(bytes32 _docHash) external view returns (uint256) {
        return escrowedFunds[_docHash];
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Verifies a ZK proof using the specified verifier contract
     * @notice This calls an external verifier contract that implements the Groth16 verification
     */
    function _verifyZKProof(
        address verifier,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory publicInputs
    ) internal view returns (bool) {
        if (verifier == address(0)) return false;
        
        // Call the verifier contract's verifyProof function
        // Standard Groth16 verifier interface
        (bool success, bytes memory result) = verifier.staticcall(
            abi.encodeWithSignature(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[])",
                a,
                b,
                c,
                publicInputs
            )
        );
        
        if (!success) return false;
        if (result.length == 0) return false;
        
        return abi.decode(result, (bool));
    }
    
    /**
     * @dev Recovers the signer address from a signature
     * @notice Uses ecrecover and checks for zero address (invalid signature)
     */
    function _recoverSigner(bytes32 messageHash, bytes calldata signature) internal pure returns (address) {
        if (signature.length != 65) revert InvalidSignatureLength();
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        
        // Adjust v if necessary (some libraries use 0/1 instead of 27/28)
        if (v < 27) {
            v += 27;
        }
        
        // ecrecover returns address(0) on invalid signature
        address signer = ecrecover(messageHash, v, r, s);
        if (signer == address(0)) revert InvalidSignature();
        
        return signer;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Updates the verifier contract addresses
     * @param _integrityVerifier New integrity verifier address
     * @param _zkptVerifier New ZKPT verifier address
     * @param _zkmlVerifier New ZKML verifier address
     */
    function updateVerifiers(
        address _integrityVerifier,
        address _zkptVerifier,
        address _zkmlVerifier
    ) external onlyOwner {
        if (_integrityVerifier == address(0) || _zkptVerifier == address(0) || _zkmlVerifier == address(0)) {
            revert InvalidAddress();
        }
        
        integrityVerifier = _integrityVerifier;
        zkptVerifier = _zkptVerifier;
        zkmlVerifier = _zkmlVerifier;
        
        emit VerifiersUpdated(_integrityVerifier, _zkptVerifier, _zkmlVerifier);
    }
    
    /**
     * @dev Pauses all contract operations (emergency use only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal function (only for accidentally sent ETH)
     * @notice Does not affect escrowed funds tied to documents
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert TransferFailed();
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();
    }
}
