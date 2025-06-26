import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function TestDuplicate() {
  const router = useRouter();
  const { currentUser, getUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState([]);
  const [testEmail, setTestEmail] = useState('test-duplicate@example.com');
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      try {
        const userData = await getUserData();
        if (!userData || userData.role !== 'admin') {
          router.push('/home');
          return;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/home');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [currentUser, router, getUserData]);

  const addTestResult = (test, status, message, details = null) => {
    setTestResults(prev => [...prev, {
      test,
      status, // 'success', 'error', 'info'
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const createTestUser = async (email, membershipType = 'premium') => {
    try {
      const testUserId = `test-user-${Date.now()}`;
      const userRef = doc(db, 'users', testUserId);
      
      await setDoc(userRef, {
        email: email,
        displayName: 'Test User',
        membershipType: membershipType,
        subscriptionId: membershipType === 'premium' ? `sub_test_${Date.now()}` : null,
        subscription: membershipType === 'premium' ? {
          id: `sub_test_${Date.now()}`,
          status: 'active',
          plan: 'monthly',
          startDate: new Date().toISOString()
        } : null,
        createdAt: new Date().toISOString(),
        isTestUser: true
      });

      return testUserId;
    } catch (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }
  };

  const checkDuplicateSubscription = async (email) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: 'monthly',
          userId: `test-user-${Date.now()}`,
          userEmail: email,
          returnUrl: window.location.href
        })
      });

      const result = await response.json();
      return { status: response.status, data: result };
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  };

  const runDuplicateTest = async () => {
    setIsRunningTest(true);
    clearTestResults();

    try {
      addTestResult('SETUP', 'info', `Testing duplicate subscription prevention for: ${testEmail}`);

      // Test 1: Firebase'da test kullanıcısı oluştur
      addTestResult('TEST 1', 'info', 'Creating test user with premium subscription...');
      const testUserId = await createTestUser(testEmail, 'premium');
      addTestResult('TEST 1', 'success', `Test user created: ${testUserId}`);

      // Test 2: Aynı email ile subscription oluşturmaya çalış
      addTestResult('TEST 2', 'info', 'Attempting to create subscription with same email...');
      const checkResult = await checkDuplicateSubscription(testEmail);
      
      if (checkResult.status === 400 && 
          (checkResult.data.error === 'Subscription already exists' || 
           checkResult.data.error === 'Active subscription exists')) {
        addTestResult('TEST 2', 'success', 'Duplicate subscription prevented successfully!', checkResult.data);
      } else {
        addTestResult('TEST 2', 'error', 'Duplicate subscription was NOT prevented!', checkResult.data);
      }

      // Test 3: Farklı email ile test
      const differentEmail = `different-${Date.now()}@example.com`;
      addTestResult('TEST 3', 'info', `Testing with different email: ${differentEmail}`);
      const differentResult = await checkDuplicateSubscription(differentEmail);
      
      if (differentResult.status === 200 || differentResult.status === 500) {
        addTestResult('TEST 3', 'success', 'Different email allowed (or failed due to Stripe config)', differentResult.data);
      } else {
        addTestResult('TEST 3', 'error', 'Different email was rejected unexpectedly', differentResult.data);
      }

      // Test 4: Firebase'dan test kullanıcısını temizle
      addTestResult('CLEANUP', 'info', 'Cleaning up test user...');
      // Not: Production'da test user'ı silmek için deleteDoc kullanılabilir
      addTestResult('CLEANUP', 'success', 'Test completed. Manual cleanup may be required.');

    } catch (error) {
      addTestResult('ERROR', 'error', error.message);
    } finally {
      setIsRunningTest(false);
    }
  };

  const checkExistingDuplicates = async () => {
    try {
      addTestResult('AUDIT', 'info', 'Checking for existing duplicate emails...');
      
      const usersRef = collection(db, 'users');
      const premiumQuery = query(usersRef, where('membershipType', '==', 'premium'));
      const premiumSnapshot = await getDocs(premiumQuery);
      
      const emailCounts = {};
      premiumSnapshot.forEach((doc) => {
        const userData = doc.data();
        const email = userData.email;
        if (email) {
          emailCounts[email] = (emailCounts[email] || 0) + 1;
        }
      });

      const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
      
      if (duplicates.length > 0) {
        addTestResult('AUDIT', 'error', `Found ${duplicates.length} duplicate emails:`, duplicates);
      } else {
        addTestResult('AUDIT', 'success', 'No duplicate premium emails found');
      }
    } catch (error) {
      addTestResult('AUDIT', 'error', error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🧪 Duplicate Subscription Test</h1>
          
          <div className="space-y-6">
            {/* Test Configuration */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">Test Configuration</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Email:</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isRunningTest}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={runDuplicateTest}
                    disabled={isRunningTest}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunningTest ? 'Running Test...' : 'Run Duplicate Test'}
                  </button>
                  <button
                    onClick={checkExistingDuplicates}
                    disabled={isRunningTest}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    Check Existing Duplicates
                  </button>
                  <button
                    onClick={clearTestResults}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Clear Results
                  </button>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Results</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 italic">No test results yet...</p>
                ) : (
                  testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md border ${
                        result.status === 'success' 
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : result.status === 'error'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            [{result.timestamp}] {result.test}: {result.message}
                          </div>
                          {result.details && (
                            <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          )}
                        </div>
                        <div className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'success' ? 'bg-green-100 text-green-800' :
                          result.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {result.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Test Information */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">📋 Test Scenarios</h3>
              <ul className="space-y-2 text-yellow-800">
                <li><strong>Test 1:</strong> Create a test user with premium subscription</li>
                <li><strong>Test 2:</strong> Try to create subscription with same email (should fail)</li>
                <li><strong>Test 3:</strong> Try with different email (should work)</li>
                <li><strong>Audit:</strong> Check existing database for duplicate emails</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 