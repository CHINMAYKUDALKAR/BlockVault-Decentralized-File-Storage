/**
 * API Test Utilities
 * Test backend connectivity and authentication
 */

export class ApiTester {
  private static getApiBase(): string {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:5000';
    }
    return '';
  }

  /**
   * Test backend health
   */
  static async testBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBase()}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Test authentication flow
   */
  static async testAuthFlow(address: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch(`${this.getApiBase()}/auth/get_nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!nonceResponse.ok) {
        return { success: false, error: 'Failed to get nonce' };
      }

      const { nonce } = await nonceResponse.json();
      console.log('✅ Nonce received:', nonce);

      // Step 2: Test login (this would require actual wallet signing in real scenario)
      return { success: true };
    } catch (error) {
      console.error('Auth flow test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test file upload with mock data
   */
  static async testFileUpload(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a small test file
      const testContent = 'This is a test file for BlockVault';
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('key', 'testpassphrase');

      const response = await fetch(`${this.getApiBase()}/files/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        return { 
          success: false, 
          error: `Upload failed: ${response.status} ${response.statusText}` 
        };
      }

      console.log('✅ Test file upload successful');
      return { success: true };
    } catch (error) {
      console.error('File upload test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Run comprehensive API tests
   */
  static async runAllTests(): Promise<{
    backendHealth: boolean;
    authFlow: { success: boolean; error?: string };
    fileUpload?: { success: boolean; error?: string };
  }> {
    console.log('🧪 Starting API Tests...');

    // Test 1: Backend Health
    const backendHealth = await this.testBackendHealth();
    console.log('Backend Health:', backendHealth ? '✅ OK' : '❌ FAILED');

    // Test 2: Auth Flow
    const authFlow = await this.testAuthFlow('0x1234567890123456789012345678901234567890');
    console.log('Auth Flow:', authFlow.success ? '✅ OK' : `❌ FAILED: ${authFlow.error}`);

    // Test 3: File Upload (only if we have a token)
    let fileUpload;
    const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
    if (user.jwt) {
      fileUpload = await this.testFileUpload(user.jwt);
      console.log('File Upload:', fileUpload.success ? '✅ OK' : `❌ FAILED: ${fileUpload.error}`);
    } else {
      console.log('File Upload: ⏭️ SKIPPED (no token)');
    }

    return {
      backendHealth,
      authFlow,
      fileUpload,
    };
  }
}

export default ApiTester;
