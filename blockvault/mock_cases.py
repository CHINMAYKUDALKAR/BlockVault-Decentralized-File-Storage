# Mock Case Management Endpoints for BlockVault
# This file provides mock responses for case management API endpoints

from flask import jsonify, request
from datetime import datetime
import uuid

# Mock data storage
mock_cases = []
mock_documents = []
mock_tasks = []
mock_team_members = []
mock_annotations = []
mock_bundles = []
mock_audit_trail = []

def init_mock_data():
    """Initialize mock data for testing"""
    global mock_cases, mock_documents, mock_tasks, mock_team_members
    
    # Sample case
    sample_case = {
        "id": str(uuid.uuid4()),
        "title": "Acme Corp Merger",
        "description": "Merger and acquisition case for Acme Corporation",
        "status": "active",
        "priority": "high",
        "clientName": "Acme Corporation",
        "matterNumber": "2024-001",
        "practiceArea": "corporate",
        "createdAt": datetime.now().isoformat(),
        "updatedAt": datetime.now().isoformat(),
        "leadAttorney": "0x1234567890abcdef1234567890abcdef12345678",
        "team": [],
        "documents": [],
        "tasks": [],
        "deadlines": [],
        "annotations": [],
        "accessControl": {
            "caseId": "",
            "permissions": {},
            "roleAssignments": {},
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
    }
    mock_cases.append(sample_case)

def register_case_routes(app):
    """Register case management routes with the Flask app"""
    
    @app.route('/cases', methods=['GET'])
    def get_cases():
        """Get all cases with optional filtering"""
        try:
            # Get query parameters
            status_filter = request.args.get('status', '').split(',') if request.args.get('status') else []
            priority_filter = request.args.get('priority', '').split(',') if request.args.get('priority') else []
            practice_area_filter = request.args.get('practiceArea', '').split(',') if request.args.get('practiceArea') else []
            
            # Filter cases
            filtered_cases = mock_cases.copy()
            
            if status_filter and status_filter[0]:
                filtered_cases = [c for c in filtered_cases if c['status'] in status_filter]
            
            if priority_filter and priority_filter[0]:
                filtered_cases = [c for c in filtered_cases if c['priority'] in priority_filter]
            
            if practice_area_filter and practice_area_filter[0]:
                filtered_cases = [c for c in filtered_cases if c['practiceArea'] in practice_area_filter]
            
            return jsonify({
                "cases": filtered_cases,
                "total": len(filtered_cases),
                "page": 1,
                "limit": 50
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases', methods=['POST'])
    def create_case():
        """Create a new case"""
        try:
            data = request.get_json()
            
            new_case = {
                "id": str(uuid.uuid4()),
                "title": data.get('title', ''),
                "description": data.get('description', ''),
                "status": data.get('status', 'active'),
                "priority": data.get('priority', 'medium'),
                "clientName": data.get('clientName', ''),
                "matterNumber": data.get('matterNumber', ''),
                "practiceArea": data.get('practiceArea', 'corporate'),
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat(),
                "leadAttorney": data.get('leadAttorney', ''),
                "team": data.get('team', []),
                "documents": [],
                "tasks": [],
                "deadlines": [],
                "annotations": [],
                "accessControl": {
                    "caseId": "",
                    "permissions": {},
                    "roleAssignments": {},
                    "createdAt": datetime.now().isoformat(),
                    "updatedAt": datetime.now().isoformat()
                }
            }
            
            mock_cases.append(new_case)
            return jsonify(new_case), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>', methods=['GET'])
    def get_case(case_id):
        """Get a specific case by ID"""
        try:
            case = next((c for c in mock_cases if c['id'] == case_id), None)
            if not case:
                return jsonify({"error": "Case not found"}), 404
            return jsonify(case)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>', methods=['PUT'])
    def update_case(case_id):
        """Update a specific case"""
        try:
            data = request.get_json()
            case_index = next((i for i, c in enumerate(mock_cases) if c['id'] == case_id), None)
            
            if case_index is None:
                return jsonify({"error": "Case not found"}), 404
            
            # Update case
            mock_cases[case_index].update(data)
            mock_cases[case_index]['updatedAt'] = datetime.now().isoformat()
            
            return jsonify(mock_cases[case_index])
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>', methods=['DELETE'])
    def delete_case(case_id):
        """Delete a specific case"""
        try:
            global mock_cases
            mock_cases = [c for c in mock_cases if c['id'] != case_id]
            return jsonify({"message": "Case deleted successfully"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>/dashboard', methods=['GET'])
    def get_case_dashboard(case_id):
        """Get dashboard data for a specific case"""
        try:
            case = next((c for c in mock_cases if c['id'] == case_id), None)
            if not case:
                return jsonify({"error": "Case not found"}), 404
            
            # Mock dashboard data
            dashboard = {
                "caseId": case_id,
                "overview": {
                    "totalDocuments": len(case.get('documents', [])),
                    "documentsAwaitingSignature": 0,
                    "upcomingDeadlines": 0,
                    "pendingTasks": len(case.get('tasks', [])),
                    "recentActivity": 0,
                    "teamMembers": len(case.get('team', [])),
                    "lastUpdated": case['updatedAt']
                },
                "recentActivity": [],
                "upcomingDeadlines": [],
                "pendingTasks": [],
                "documentStats": {
                    "total": len(case.get('documents', [])),
                    "byType": {},
                    "byStatus": {},
                    "byAccessLevel": {},
                    "totalSize": 0,
                    "averageSize": 0
                },
                "teamActivity": []
            }
            
            return jsonify(dashboard)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Removed duplicate get_case_documents function - using the newer one below

    # Removed duplicate add_document_to_case function - using the newer one below

    @app.route('/cases/<case_id>/tasks', methods=['GET'])
    def get_case_tasks(case_id):
        """Get tasks for a specific case"""
        try:
            case = next((c for c in mock_cases if c['id'] == case_id), None)
            if not case:
                return jsonify({"error": "Case not found"}), 404
            
            return jsonify({
                "tasks": case.get('tasks', []),
                "total": len(case.get('tasks', [])),
                "page": 1,
                "limit": 50
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>/tasks', methods=['POST'])
    def create_case_task(case_id):
        """Create a task for a specific case"""
        try:
            data = request.get_json()
            case_index = next((i for i, c in enumerate(mock_cases) if c['id'] == case_id), None)
            
            if case_index is None:
                return jsonify({"error": "Case not found"}), 404
            
            new_task = {
                "id": str(uuid.uuid4()),
                "caseId": case_id,
                "title": data.get('title', ''),
                "description": data.get('description', ''),
                "assignedTo": data.get('assignedTo', ''),
                "assignedBy": data.get('assignedBy', ''),
                "status": data.get('status', 'pending'),
                "priority": data.get('priority', 'medium'),
                "dueDate": data.get('dueDate', ''),
                "createdAt": datetime.now().isoformat(),
                "completedAt": None,
                "documentIds": data.get('documentIds', []),
                "comments": [],
                "blockchainTxId": None
            }
            
            mock_cases[case_index]['tasks'].append(new_task)
            return jsonify(new_task), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>/team', methods=['POST'])
    def add_team_member(case_id):
        """Add a team member to a case"""
        try:
            data = request.get_json()
            case_index = next((i for i, c in enumerate(mock_cases) if c['id'] == case_id), None)
            
            if case_index is None:
                return jsonify({"error": "Case not found"}), 404
            
            new_member = {
                "walletAddress": data.get('walletAddress', ''),
                "role": data.get('role', 'associate'),
                "name": data.get('name', ''),
                "email": data.get('email', ''),
                "permissions": data.get('permissions', ['view']),
                "addedAt": datetime.now().isoformat(),
                "addedBy": data.get('addedBy', '')
            }
            
            mock_cases[case_index]['team'].append(new_member)
            return jsonify(new_member), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>/audit', methods=['GET'])
    def get_case_audit_trail(case_id):
        """Get audit trail for a specific case"""
        try:
            case = next((c for c in mock_cases if c['id'] == case_id), None)
            if not case:
                return jsonify({"error": "Case not found"}), 404
            
            # Mock audit trail
            audit_trail = [
                {
                    "id": str(uuid.uuid4()),
                    "caseId": case_id,
                    "action": "case-created",
                    "performedBy": case['leadAttorney'],
                    "performedAt": case['createdAt'],
                    "details": f"Case '{case['title']}' was created",
                    "blockchainTxId": str(uuid.uuid4()),
                    "metadata": {}
                }
            ]
            
            return jsonify(audit_trail)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/documents/<document_id>/request-signature', methods=['POST'])
    def request_signature(document_id):
        """Request signature for a document"""
        try:
            data = request.get_json()
            signers = data.get('signers', [])
            
            # Create signature request
            request_id = str(uuid.uuid4())
            signature_request = {
                "id": request_id,
                "documentId": document_id,
                "documentName": data.get('documentName', 'Unknown Document'),
                "requestedBy": data.get('requestedBy', ''),
                "signers": signers,
                "status": "pending",
                "createdAt": datetime.now().isoformat(),
                "expiresAt": data.get('expiresAt', ''),
                "message": data.get('message', 'Please sign this document')
            }
            
            # Store the signature request
            signature_requests_storage[request_id] = signature_request
            print(f"[mock_cases] Stored signature request {request_id} for document {document_id} -> signers: {[s.get('address') for s in signers]}")
            
            # In a real implementation, this would send notifications to signers
            # For now, we'll just return success
            return jsonify({
                "signatureRequest": signature_request,
                "message": "Signature requests sent to all signers"
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/documents/<document_id>/sign', methods=['POST'])
    def sign_document(document_id):
        """Sign a document"""
        try:
            data = request.get_json()
            signer_address = data.get('signerAddress', '')
            signature = data.get('signature', '')
            
            # Update signature request status
            for request_id, request_data in signature_requests_storage.items():
                if request_data.get('documentId') == document_id:
                    # Update the request status
                    request_data['status'] = 'signed'
                    request_data['signedBy'] = signer_address
                    request_data['signedAt'] = datetime.now().isoformat()
                    break
            
            # Create signature record
            document_signature = {
                "id": str(uuid.uuid4()),
                "documentId": document_id,
                "signerAddress": signer_address,
                "signature": signature,
                "signedAt": datetime.now().isoformat(),
                "status": "signed"
            }
            
            return jsonify({
                "signature": document_signature,
                "message": "Document signed successfully"
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Signature requests storage (in production, this would be a database)
    signature_requests_storage = {}
    
    @app.route('/signature-requests', methods=['GET'])
    def get_signature_requests():
        """Get signature requests for the current user"""
        try:
            # Note: For mock/demo server we accept requests without Authorization header
            # and rely on the `user_address` query parameter to identify the user.
            user_address = request.args.get('user_address', '')
            
            # Get signature requests for this user
            user_requests = []
            for request_id, request_data in signature_requests_storage.items():
                # Check if this user is a signer in any request
                for signer in request_data.get('signers', []):
                    if signer.get('address', '').lower() == user_address.lower():
                        user_requests.append({
                            "id": request_id,
                            "documentId": request_data.get('documentId', ''),
                            "documentName": request_data.get('documentName', ''),
                            "requestedBy": request_data.get('requestedBy', ''),
                            "status": request_data.get('status', 'pending'),
                            "createdAt": request_data.get('createdAt', ''),
                            "expiresAt": request_data.get('expiresAt', ''),
                            "message": request_data.get('message', '')
                        })
                        break
            
            return jsonify({
                "signatureRequests": user_requests,
                "total": len(user_requests)
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/signature-requests-sent', methods=['GET'])
    def get_signature_requests_sent():
        """Get signature requests sent by the current user"""
        try:
            # Note: For mock/demo server we accept requests without Authorization header
            # and rely on the `user_address` query parameter to identify the user.
            user_address = request.args.get('user_address', '')
            
            # Get signature requests sent by this user
            sent_requests = []
            for request_id, request_data in signature_requests_storage.items():
                if request_data.get('requestedBy', '').lower() == user_address.lower():
                    sent_requests.append({
                        "id": request_id,
                        "documentId": request_data.get('documentId', ''),
                        "documentName": request_data.get('documentName', ''),
                        "status": request_data.get('status', 'pending'),
                        "createdAt": request_data.get('createdAt', ''),
                        "expiresAt": request_data.get('expiresAt', ''),
                        "message": request_data.get('message', ''),
                        "signers": request_data.get('signers', []),
                        "signedBy": request_data.get('signedBy', ''),
                        "signedAt": request_data.get('signedAt', '')
                    })
            
            return jsonify({
                "signatureRequests": sent_requests,
                "total": len(sent_requests)
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/signature-requests/<request_id>/status', methods=['POST'])
    def update_signature_request_status(request_id):
        """Update status (signed/declined) for a specific signature request"""
        try:
            data = request.get_json() or {}
            status = data.get('status')
            signer = data.get('signer', '')

            if request_id not in signature_requests_storage:
                return jsonify({"error": "Signature request not found"}), 404

            req = signature_requests_storage[request_id]
            # Update status and record actor/time
            req['status'] = status
            if status == 'signed':
                req['signedBy'] = signer
                req['signedAt'] = datetime.now().isoformat()
            if status == 'declined':
                req['declinedBy'] = signer
                req['declinedAt'] = datetime.now().isoformat()

            signature_requests_storage[request_id] = req
            return jsonify({"signatureRequest": req}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/documents/<document_id>/download', methods=['GET'])
    def download_document(document_id):
        """Download a document"""
        try:
            # Get current user from auth header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({"error": "No authorization header"}), 401
            
            # In a real implementation, this would fetch the document from storage
            # For now, return a mock response
            return jsonify({
                "message": "Document download initiated",
                "documentId": document_id,
                "downloadUrl": f"/api/documents/{document_id}/file"
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>/documents', methods=['GET'])
    def get_case_documents(case_id):
        """Get all documents for a specific case"""
        try:
            # Get current user from auth header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({"error": "No authorization header"}), 401
            
            # Mock documents for the case
            documents = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Employment Contract - Smith.pdf",
                    "hash": "0x1234567890abcdef1234567890abcdef12345678",
                    "cid": "QmEmployment123",
                    "size": 1024000,
                    "type": "application/pdf",
                    "uploadedAt": datetime.now().isoformat(),
                    "uploadedBy": "0x1234567890abcdef1234567890abcdef12345678",
                    "status": "verified",
                    "signatures": {
                        "required": 2,
                        "completed": 1,
                        "signers": [
                            {"address": "0x1234...", "signed": True, "signature": "0xabc123..."},
                            {"address": "0x5678...", "signed": False}
                        ]
                    }
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Evidence - Email Chain.pdf",
                    "hash": "0xabcdef1234567890abcdef1234567890abcdef12",
                    "cid": "QmEvidence123",
                    "size": 512000,
                    "type": "application/pdf",
                    "uploadedAt": (datetime.now().timestamp() - 86400) * 1000,  # 1 day ago
                    "uploadedBy": "0x1234567890abcdef1234567890abcdef12345678",
                    "status": "signed",
                    "signatures": {
                        "required": 1,
                        "completed": 1,
                        "signers": [
                            {"address": "0x1234...", "signed": True, "signature": "0xdef456..."}
                        ]
                    }
                }
            ]
            
            return jsonify({
                "documents": documents,
                "total": len(documents)
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>/documents', methods=['POST'])
    def add_document_to_case(case_id):
        """Add a new document to a case"""
        try:
            # Get current user from auth header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({"error": "No authorization header"}), 401
            
            data = request.get_json()
            
            # Create new document
            document = {
                "id": str(uuid.uuid4()),
                "name": data.get('name', 'Unknown Document'),
                "hash": data.get('hash', ''),
                "cid": data.get('cid', ''),
                "size": data.get('size', 0),
                "type": data.get('type', 'application/octet-stream'),
                "uploadedAt": data.get('uploadedAt', datetime.now().isoformat()),
                "uploadedBy": data.get('uploadedBy', ''),
                "status": "verified",
                "zkProof": data.get('zkProof', {})
            }
            
            return jsonify({
                "document": document,
                "message": "Document added to case successfully"
            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/ipfs/upload', methods=['POST', 'OPTIONS'])
    def upload_to_ipfs():
        """Upload file to IPFS (mock implementation)"""
        # Handle preflight OPTIONS request
        if request.method == 'OPTIONS':
            return '', 200
        
        try:
            # Get current user from auth header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({"error": "No authorization header"}), 401
            
            # Check if file is in request
            if 'file' not in request.files:
                return jsonify({"error": "No file provided"}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            # Mock IPFS upload - in real implementation, this would upload to IPFS
            # For now, we'll generate a mock CID
            import hashlib
            import time
            
            # Generate a mock CID based on file content and timestamp
            file_content = file.read()
            file_hash = hashlib.sha256(file_content).hexdigest()
            timestamp = str(int(time.time()))
            mock_cid = f"Qm{file_hash[:46]}{timestamp[-6:]}"
            
            return jsonify({
                "cid": mock_cid,
                "size": len(file_content),
                "message": "File uploaded to IPFS successfully"
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/test-cors', methods=['GET', 'POST', 'OPTIONS'])
    def test_cors():
        """Test CORS configuration"""
        return jsonify({
            "message": "CORS is working",
            "method": request.method,
            "origin": request.headers.get('Origin', 'No Origin header')
        }), 200
