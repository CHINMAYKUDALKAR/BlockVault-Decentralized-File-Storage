<!-- 345ee837-68b7-4fd7-8e82-860f49013398 6b9f21f4-cd9e-4566-a23e-f726ac0db787 -->
# BlockVault Complete Learning Plan

## Learning Path Overview

This plan takes you through the entire BlockVault codebase in a structured way, starting from the application entry point and progressively building up to complex features. Follow this order for optimal understanding.

---

## Phase 1: Application Foundation & Entry Points

### 1. Start Here: Application Bootstrap

**File:** `blockvault-frontend/src/index.tsx`

- Application entry point
- React app initialization
- Root DOM rendering

**File:** `blockvault-frontend/src/App.tsx`

- Main app structure with routing
- Provider hierarchy (AuthProvider, FileProvider, RBACProvider)
- Route protection with ProtectedRoute
- Understanding the application shell

### 2. Project Configuration

**File:** `blockvault-frontend/package.json`

- Dependencies: React, TypeScript, ethers, lucide-react, node-forge
- Build scripts and tooling
- Project metadata

**File:** `netlify.toml`

- Deployment configuration
- Environment variables
- SPA routing setup

---

## Phase 2: Core Authentication & Security

### 3. Authentication System

**File:** `blockvault-frontend/src/contexts/AuthContext.tsx`

- Wallet connection (MetaMask, WalletConnect)
- JWT authentication flow
- User session management
- Mobile wallet support

**Key Concepts:**

- Web3 wallet integration
- Challenge-response authentication
- Token-based sessions

### 4. RSA Key Management

**File:** `blockvault-frontend/src/utils/rsa.ts`

- RSA key pair generation (2048-bit)
- Key storage in localStorage
- Encryption/decryption utilities

**File:** `blockvault-frontend/src/components/RSAManager.tsx`

- Key generation UI
- Public key registration with backend
- Key export/import functionality

---

## Phase 3: User Interface Components

### 5. Layout & Navigation

**File:** `blockvault-frontend/src/components/Header.tsx`

- Navigation bar with wallet status
- RSA key indicator (green when set up)
- Logo and page refresh functionality
- Route navigation (Files, Legal)

**File:** `blockvault-frontend/src/components/LandingPage.tsx`

- Public landing page
- Feature showcase
- Authentication entry point

### 6. UI Component Library

**File:** `blockvault-frontend/src/components/ui/Button.tsx`

- Reusable button with variants (primary, secondary, outline, danger, ghost)
- Size options and loading states

**File:** `blockvault-frontend/src/components/ui/Card.tsx`

- Card container component
- Consistent styling across app

**File:** `blockvault-frontend/src/components/ui/Input.tsx`

- Input field with icons
- Validation and styling

---

## Phase 4: File Storage System

### 7. File Management Context

**File:** `blockvault-frontend/src/contexts/FileContext.tsx`

- File upload/download operations
- IPFS integration
- File encryption with RSA
- File metadata management

### 8. File Components

**File:** `blockvault-frontend/src/components/FileUpload.tsx`

- Drag-and-drop interface
- File encryption before upload
- Progress tracking
- IPFS pinning

**File:** `blockvault-frontend/src/components/FileList.tsx`

- File display (grid/list views)
- File actions (view, download, share, delete)
- File metadata display

**File:** `blockvault-frontend/src/pages/Dashboard.tsx`

- Main files dashboard
- Statistics cards
- Search and filtering
- View mode toggling

---

## Phase 5: Role-Based Access Control (RBAC)

### 9. RBAC System

**File:** `blockvault-frontend/src/contexts/RBACContext.tsx`

- User roles (client, lawyer, judge, notary)
- Permission management
- Role switching functionality
- Access control checks

**File:** `blockvault-frontend/src/types/rbac.ts`

- Role definitions
- Permission types
- RBAC type system

**File:** `blockvault-frontend/src/utils/debugPermissions.ts` & `testPermissions.ts`

- Permission testing utilities
- Debug helpers for RBAC

### 10. User Onboarding

**File:** `blockvault-frontend/src/components/onboarding/UserOnboarding.tsx`

- First-time user flow
- Role selection
- Profile setup

---

## Phase 6: Legal Document Management

### 11. Legal Dashboard

**File:** `blockvault-frontend/src/pages/LegalDashboard.tsx`

- Main legal interface with tabs:
  - Cases: Case management
  - Documents: Legal document listing
  - Signatures: Signature requests
  - Analysis: AI/ZKML analysis results
  - Chain of Custody: Audit trail
- Document actions (view, download, redact, analyze, request signatures)
- Statistics and metrics

### 12. Document Operations

**File:** `blockvault-frontend/src/components/legal/NotarizeDocumentModal.tsx`

- Document notarization flow
- Blockchain registration
- Hash verification

**File:** `blockvault-frontend/src/components/legal/RedactionModal.tsx`

- Document redaction interface
- Sensitive information removal
- Version tracking

**File:** `blockvault-frontend/src/components/legal/ZKMLAnalysisModal.tsx`

- AI analysis with zero-knowledge proofs
- Model selection (GPT-2, BERT, ResNet)
- Verifiable AI inference
- Results storage and verification

---

## Phase 7: Signature Management

### 13. Signature Workflows

**File:** `blockvault-frontend/src/components/legal/RequestSignatureModal.tsx`

- Request signatures from multiple parties
- Set expiration dates
- Track signature status

**File:** `blockvault-frontend/src/components/legal/SignatureRequests.tsx`

- Incoming signature requests
- Sign/decline functionality
- Document viewing before signing

**File:** `blockvault-frontend/src/components/legal/SentSignatureRequests.tsx`

- Outgoing signature requests
- Track completion status
- Download signed documents

---

## Phase 8: Case Management System

### 14. Case Context & Management

**File:** `blockvault-frontend/src/contexts/CaseContext.tsx`

- Case CRUD operations
- Document management within cases
- Task tracking
- Team member management
- Audit trail generation

**File:** `blockvault-frontend/src/types/caseManagement.ts`

- Case data structures
- Document types
- Task and deadline types
- Team member permissions

### 15. Case Components

**File:** `blockvault-frontend/src/components/case/CreateCaseModal.tsx`

- New case creation
- Case metadata input
- Priority and type selection

**File:** `blockvault-frontend/src/components/case/CaseDashboard.tsx`

- Individual case view
- Case statistics
- Document and task management

**File:** `blockvault-frontend/src/components/case/CaseDocumentsList.tsx`

- Documents within a case
- Add/remove documents
- Document actions

---

## Phase 9: Zero-Knowledge & Blockchain Integration

### 16. ZK Circuits & ZKML

**File:** `blockvault-frontend/src/utils/zkCircuits.ts`

- Zero-knowledge circuit management
- ZKML model integration
- Proof generation and verification
- AI model managers (GPT-2, BERT, ResNet)

**Key Concepts:**

- Zero-knowledge proofs for privacy
- Verifiable AI inference
- On-chain proof verification

### 17. Smart Contract Interaction

**File:** `blockvault-frontend/src/utils/contract.ts`

- Ethereum contract interfaces
- Document registration on-chain
- Signature verification
- Transaction management

---

## Phase 10: Utilities & Supporting Systems

### 18. API Integration

**File:** `blockvault-frontend/src/utils/apiTest.ts`

- Backend API testing utilities
- Endpoint verification
- Error handling patterns

### 19. Demo & Testing

**File:** `blockvault-frontend/src/components/demo/DemoLauncher.tsx`

- Demo data generation
- Feature demonstrations
- Testing helpers

---

## Phase 11: Backend Understanding (Context)

While the frontend is the focus, understanding the backend integration points:

### 20. API Endpoints (Referenced in Contexts)

- `/auth/*` - Authentication endpoints
- `/files/*` - File operations
- `/documents/*` - Document management
- `/cases/*` - Case management
- `/users/*` - User profile and RSA keys
- `/signatures/*` - Signature workflows

---

## Key Architectural Patterns to Understand

### Context Pattern

- AuthContext: Global authentication state
- FileContext: File operations state
- RBACContext: Permission management
- CaseContext: Case management state

### Component Hierarchy

```
App
├── Providers (Auth, File, RBAC)
├── Router
│   ├── LandingPage (public)
│   ├── Dashboard (protected) - Files
│   └── LegalDashboard (protected) - Legal features
└── Toaster (notifications)
```

### Data Flow

1. User authenticates via wallet
2. JWT token stored in localStorage
3. Contexts manage global state
4. Components consume context data
5. API calls update backend
6. Local storage for persistence

---

## Learning Strategy

### Recommended Reading Order:

1. **Week 1**: Phases 1-3 (Foundation & Auth)
2. **Week 2**: Phases 4-5 (Files & RBAC)
3. **Week 3**: Phases 6-7 (Legal & Signatures)
4. **Week 4**: Phases 8-10 (Cases & Advanced Features)

### Hands-On Practice:

1. Set up the development environment
2. Run the application locally
3. Create test accounts with different roles
4. Upload files and create legal documents
5. Test signature workflows
6. Create cases and manage documents
7. Run AI analysis on documents
8. Explore RSA key generation

### Key Files to Master:

- `App.tsx` - Application structure
- `AuthContext.tsx` - Authentication flow
- `LegalDashboard.tsx` - Main legal interface
- `FileContext.tsx` - File operations
- `RBACContext.tsx` - Permissions system
- `CaseContext.tsx` - Case management

---

## Technologies Used

### Frontend

- React 18 with TypeScript
- React Router for navigation
- Context API for state management
- Tailwind CSS for styling
- Lucide React for icons

### Web3 & Crypto

- ethers.js for Ethereum interaction
- WalletConnect for mobile wallets
- node-forge for RSA encryption

### File Storage

- IPFS for decentralized storage
- RSA encryption for file security

### UI/UX

- Toast notifications (react-hot-toast)
- Responsive design
- Dark theme

---

## End Goal

After completing this learning path, you will understand:

- Full-stack Web3 application architecture
- Authentication with crypto wallets
- Decentralized file storage with IPFS
- Role-based access control implementation
- Legal document management systems
- Zero-knowledge proof integration
- Blockchain-based verification
- React context patterns for state management
- TypeScript best practices

Start with Phase 1 and work your way through sequentially. Each phase builds on the previous one, ensuring a solid understanding of the entire system.