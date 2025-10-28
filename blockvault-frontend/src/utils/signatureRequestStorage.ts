/**
 * Client-side storage for signature requests
 * Since backend doesn't have signature request endpoints yet,
 * we store them in localStorage
 */

export interface StoredSignatureRequest {
  id: string;
  documentId: string; // This is the actual file_id from backend
  documentName: string;
  requestedBy: string;
  requestedTo: string;
  status: 'pending' | 'signed' | 'declined' | 'expired';
  message: string;
  createdAt: string;
  expiresAt: number;
}

const STORAGE_KEY = 'blockvault_signature_requests';

// Get all signature requests
export const getAllSignatureRequests = (): StoredSignatureRequest[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load signature requests:', error);
    return [];
  }
};

// Get signature requests for a specific user
export const getSignatureRequestsForUser = (userAddress: string): StoredSignatureRequest[] => {
  const allRequests = getAllSignatureRequests();
  const normalized = userAddress.toLowerCase();
  
  console.log('🔍 getSignatureRequestsForUser called');
  console.log('   User address:', userAddress);
  console.log('   Normalized:', normalized);
  console.log('   Total requests in storage:', allRequests.length);
  
  if (allRequests.length > 0) {
    console.log('   Sample request addresses:');
    allRequests.slice(0, 3).forEach((req, idx) => {
      console.log(`     ${idx + 1}. requestedTo: "${req.requestedTo}" | requestedBy: "${req.requestedBy}" | doc: "${req.documentName}"`);
    });
  }
  
  const filtered = allRequests.filter(req => {
    const matches = req.requestedTo.toLowerCase() === normalized;
    if (matches) {
      console.log('   ✅ Match found:', req.documentName);
    }
    return matches;
  });
  
  console.log('   Filtered results:', filtered.length);
  
  return filtered;
};

// Get signature requests sent by a user
export const getSignatureRequestsSentBy = (userAddress: string): StoredSignatureRequest[] => {
  const allRequests = getAllSignatureRequests();
  const normalized = userAddress.toLowerCase();
  return allRequests.filter(req => req.requestedBy.toLowerCase() === normalized);
};

// Create signature request
export const createSignatureRequest = (
  documentId: string,
  documentName: string,
  requestedBy: string,
  requestedTo: string,
  message: string,
  expiresAt: number
): StoredSignatureRequest => {
  console.log('📝 Creating signature request:');
  console.log('   Document ID:', documentId);
  console.log('   Document Name:', documentName);
  console.log('   Requested By (raw):', requestedBy);
  console.log('   Requested To (raw):', requestedTo);
  
  const request: StoredSignatureRequest = {
    id: `sig_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    documentId,
    documentName,
    requestedBy: requestedBy.toLowerCase(),
    requestedTo: requestedTo.toLowerCase(),
    status: 'pending',
    message,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  console.log('   Created request object:', request);

  const allRequests = getAllSignatureRequests();
  allRequests.push(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allRequests));
  
  console.log('   ✅ Saved to localStorage. Total requests:', allRequests.length);
  console.log('   Storage key:', STORAGE_KEY);
  
  return request;
};

// Update signature request status
export const updateSignatureRequestStatus = (
  requestId: string,
  status: 'pending' | 'signed' | 'declined' | 'expired'
): void => {
  console.log(`🔄 Updating signature request status: ${requestId} → ${status}`);
  
  const allRequests = getAllSignatureRequests();
  console.log(`   Total requests before update: ${allRequests.length}`);
  
  const updated = allRequests.map(req => {
    if (req.id === requestId) {
      console.log(`   ✅ Found request to update:`, req);
      console.log(`   ✅ Changing status from "${req.status}" to "${status}"`);
      return { ...req, status };
    }
    return req;
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  console.log(`   💾 Saved ${updated.length} requests to localStorage`);
  
  // Verify it was saved
  const verified = getAllSignatureRequests().find(r => r.id === requestId);
  console.log(`   🔍 Verification - Request status is now: ${verified?.status}`);
};

// Delete signature request
export const deleteSignatureRequest = (requestId: string): void => {
  const allRequests = getAllSignatureRequests();
  const filtered = allRequests.filter(req => req.id !== requestId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

