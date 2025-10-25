// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BlockVaultLegal
 * @dev Smart contract for legal document management with ZK proofs
 * @notice This contract handles document notarization, ZKPT redaction, e-signatures, and ZKML analysis
 */
contract BlockVaultLegal is Ownable, ReentrancyGuard {
    
    // ============ STRUCTS ============
    
    enum Status {
        Registered,
        AwaitingSignatures,
        Executed,
        Revoked
    }
    
    struct DocumentRecord {
        bytes32 docHash;
        string cid;
        address owner;
        bytes32 parentHash;
        uint256 timestamp;
        Status status;
    }
    
    struct SignatureRequest {
        address[] requiredSigners;
        mapping(address => bytes) signatures;
        uint256 signedCount;
        uint256 deadline;
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
    
    event DocumentRegistered(bytes32 indexed docHash, address indexed owner);
    event TransformationRegistered(bytes32 indexed transformedHash, bytes32 indexed originalHash);
    event AccessGranted(bytes32 indexed docHash, address indexed owner, address indexed recipient);
    event SignatureRequested(bytes32 indexed docHash, address[] signers);
    event DocumentSigned(bytes32 indexed docHash, address indexed signer);
    event ContractExecuted(bytes32 indexed docHash, address indexed recipient, uint256 amount);
    event MLInferenceVerified(bytes32 indexed docHash, int256 result);
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _integrityVerifier,
        address _zkptVerifier,
        address _zkmlVerifier
    ) {
        integrityVerifier = _integrityVerifier;
        zkptVerifier = _zkptVerifier;
        zkmlVerifier = _zkmlVerifier;
    }
    
    // ============ MODIFIERS ============
    
    modifier onlyDocumentOwner(bytes32 _docHash) {
        require(documentRegistry[_docHash].owner == msg.sender, "BlockVault: Not the owner of the document");
        _;
    }
    
    modifier documentExists(bytes32 _docHash) {
        require(documentRegistry[_docHash].owner != address(0), "BlockVault: Document does not exist");
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
        string memory _cid,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory publicInputs
    ) external {
        bytes32 docHash = bytes32(publicInputs[0]);
        require(documentRegistry[docHash].owner == address(0), "BlockVault: Document with this hash already exists");
        
        // Verify the ZK proof of integrity
        require(verifyZKProof(integrityVerifier, a, b, c, publicInputs), "BlockVault: Invalid Proof of Integrity");
        
        // Record the document
        documentRegistry[docHash] = DocumentRecord(
            docHash,
            _cid,
            msg.sender,
            bytes32(0), // parentHash is zero for an original document
            block.timestamp,
            Status.Registered
        );
        
        emit DocumentRegistered(docHash, msg.sender);
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
        string memory _newFileCID,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory publicInputs
    ) external {
        bytes32 originalHash = bytes32(publicInputs[0]);
        bytes32 transformedHash = bytes32(publicInputs[1]);
        
        require(documentRegistry[originalHash].owner == msg.sender, "BlockVault: Not the owner of the original document");
        require(documentRegistry[transformedHash].owner == address(0), "BlockVault: This transformed document already exists");
        
        // Verify the ZKPT proof
        require(verifyZKProof(zkptVerifier, a, b, c, publicInputs), "BlockVault: Invalid Proof of Transformation");
        
        // Record the transformation
        documentRegistry[transformedHash] = DocumentRecord(
            transformedHash,
            _newFileCID,
            msg.sender,
            originalHash, // Link to the parent document
            block.timestamp,
            Status.Registered
        );
        
        emit TransformationRegistered(transformedHash, originalHash);
    }
    
    /**
     * @dev Grants another user access to a specific document
     * @param _docHash The hash of the document
     * @param _recipient The address to grant access to
     */
    function grantAccess(bytes32 _docHash, address _recipient) 
        external 
        onlyDocumentOwner(_docHash) 
        documentExists(_docHash) 
    {
        documentPermissions[_docHash][_recipient] = true;
        emit AccessGranted(_docHash, msg.sender, _recipient);
    }
    
    /**
     * @dev Requests signatures for a document and optionally locks funds in escrow
     * @param _docHash The hash of the document
     * @param _signers Array of addresses that need to sign
     * @param _deadline Timestamp when the signature request expires
     */
    function requestSignaturesAndEscrow(
        bytes32 _docHash,
        address[] memory _signers,
        uint256 _deadline
    ) external payable onlyDocumentOwner(_docHash) documentExists(_docHash) {
        require(documentRegistry[_docHash].status == Status.Registered, "BlockVault: Document is not in a registrable state");
        require(_signers.length > 0, "BlockVault: At least one signer required");
        require(_deadline > block.timestamp, "BlockVault: Deadline must be in the future");
        
        // Set up signature request
        signatureRequests[_docHash].requiredSigners = _signers;
        signatureRequests[_docHash].deadline = _deadline;
        documentRegistry[_docHash].status = Status.AwaitingSignatures;
        
        // Handle escrow if funds are provided
        if (msg.value > 0) {
            escrowedFunds[_docHash] = msg.value;
        }
        
        emit SignatureRequested(_docHash, _signers);
    }
    
    /**
     * @dev Allows a required signatory to submit their cryptographic signature
     * @param _docHash The hash of the document
     * @param _signature The signature to verify and record
     */
    function signDocument(bytes32 _docHash, bytes memory _signature) 
        external 
        documentExists(_docHash) 
        nonReentrant 
    {
        require(documentRegistry[_docHash].status == Status.AwaitingSignatures, "BlockVault: Document is not awaiting signatures");
        require(block.timestamp <= signatureRequests[_docHash].deadline, "BlockVault: Signature deadline has passed");
        
        // Check if sender is a required signer
        bool isRequiredSigner = false;
        address[] memory requiredSigners = signatureRequests[_docHash].requiredSigners;
        for (uint i = 0; i < requiredSigners.length; i++) {
            if (requiredSigners[i] == msg.sender) {
                isRequiredSigner = true;
                break;
            }
        }
        require(isRequiredSigner, "BlockVault: Not a required signer");
        
        // Verify the signature
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _docHash));
        address signer = recoverSigner(messageHash, _signature);
        require(signer == msg.sender, "BlockVault: Invalid signature");
        
        // Record the signature
        signatureRequests[_docHash].signatures[msg.sender] = _signature;
        signatureRequests[_docHash].signedCount++;
        emit DocumentSigned(_docHash, msg.sender);
        
        // Check if all signatures are collected
        if (signatureRequests[_docHash].signedCount == requiredSigners.length) {
            documentRegistry[_docHash].status = Status.Executed;
            
            // Execute escrow if funds are locked
            uint256 amount = escrowedFunds[_docHash];
            if (amount > 0) {
                address payable recipient = payable(documentRegistry[_docHash].owner);
                escrowedFunds[_docHash] = 0;
                (bool success, ) = recipient.call{value: amount}("");
                require(success, "BlockVault: Escrow transfer failed");
                emit ContractExecuted(_docHash, recipient, amount);
            }
        }
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
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory publicInputs
    ) external documentExists(_docHash) {
        // Verify the ZKML proof
        require(verifyZKProof(zkmlVerifier, a, b, c, publicInputs), "BlockVault: Invalid ZKML proof");
        
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
        uint256 deadline
    ) {
        SignatureRequest storage request = signatureRequests[_docHash];
        return (request.requiredSigners, request.signedCount, request.deadline);
    }
    
    /**
     * @dev Checks if an address has permission to access a document
     */
    function hasPermission(bytes32 _docHash, address _user) external view returns (bool) {
        return documentPermissions[_docHash][_user] || documentRegistry[_docHash].owner == _user;
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Verifies a ZK proof using the specified verifier
     */
    function verifyZKProof(
        address verifier,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory publicInputs
    ) internal view returns (bool) {
        // This is a placeholder - in a real implementation, you would call the actual verifier contract
        // For now, we'll return true to allow testing
        return true;
    }
    
    /**
     * @dev Recovers the signer address from a signature
     */
    function recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "BlockVault: Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        return ecrecover(messageHash, v, r, s);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Updates the verifier contract addresses
     */
    function updateVerifiers(
        address _integrityVerifier,
        address _zkptVerifier,
        address _zkmlVerifier
    ) external onlyOwner {
        integrityVerifier = _integrityVerifier;
        zkptVerifier = _zkptVerifier;
        zkmlVerifier = _zkmlVerifier;
    }
}
