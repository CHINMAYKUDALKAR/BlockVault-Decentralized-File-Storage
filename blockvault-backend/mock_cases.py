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

    @app.route('/cases/<case_id>/documents', methods=['GET'])
    def get_case_documents(case_id):
        """Get documents for a specific case"""
        try:
            case = next((c for c in mock_cases if c['id'] == case_id), None)
            if not case:
                return jsonify({"error": "Case not found"}), 404
            
            return jsonify({
                "documents": case.get('documents', []),
                "total": len(case.get('documents', [])),
                "page": 1,
                "limit": 50
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/cases/<case_id>/documents', methods=['POST'])
    def add_document_to_case(case_id):
        """Add a document to a case"""
        try:
            data = request.get_json()
            case_index = next((i for i, c in enumerate(mock_cases) if c['id'] == case_id), None)
            
            if case_index is None:
                return jsonify({"error": "Case not found"}), 404
            
            new_document = {
                "id": str(uuid.uuid4()),
                "caseId": case_id,
                "originalFileId": data.get('originalFileId', ''),
                "title": data.get('title', ''),
                "documentType": data.get('documentType', 'other'),
                "status": data.get('status', 'draft'),
                "parties": data.get('parties', []),
                "uploadedBy": data.get('uploadedBy', ''),
                "uploadedAt": datetime.now().isoformat(),
                "notarizedAt": None,
                "blockchainHash": None,
                "ipfsCid": None,
                "zkProof": None,
                "metadata": data.get('metadata', {}),
                "annotations": [],
                "versions": [],
                "accessLevel": data.get('accessLevel', 'team-only')
            }
            
            mock_cases[case_index]['documents'].append(new_document)
            return jsonify(new_document), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

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

    # Initialize mock data
    init_mock_data()
