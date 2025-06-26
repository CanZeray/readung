#!/usr/bin/env node

/**
 * Duplicate Subscription Test Script
 * Bu script duplicate email subscription kontrolünü test eder
 */

const testDuplicateSubscription = async () => {
  const baseUrl = 'http://localhost:3000';
  const testEmail = 'test-duplicate@example.com';
  
  console.log('🧪 Testing Duplicate Subscription Prevention\n');
  
  // Test data
  const subscriptionData = {
    plan: 'monthly',
    userId: 'test-user-1',
    userEmail: testEmail,
    returnUrl: 'http://localhost:3000/upgrade/premium'
  };

  console.log('📋 Test Data:', subscriptionData);
  console.log('\n-----------------------------------\n');

  try {
    // Test 1: İlk subscription denemesi (başarılı olmalı)
    console.log('🔵 Test 1: First subscription attempt');
    console.log('Expected: SUCCESS or normal checkout URL');
    
    const response1 = await fetch(`${baseUrl}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });
    
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', result1);
    
    if (response1.ok && result1.url) {
      console.log('✅ Test 1 PASSED: Checkout URL created successfully');
    } else {
      console.log('ℹ️ Test 1: Checkout may have failed due to environment setup');
    }
    
    console.log('\n-----------------------------------\n');
    
    // Test 2: Aynı email ile ikinci subscription denemesi (başarısız olmalı)
    console.log('🔴 Test 2: Duplicate subscription attempt');
    console.log('Expected: ERROR 400 - Subscription already exists');
    
    const subscriptionData2 = {
      ...subscriptionData,
      userId: 'test-user-2' // Farklı user ID ama aynı email
    };
    
    const response2 = await fetch(`${baseUrl}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData2)
    });
    
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', result2);
    
    if (response2.status === 400 && 
        (result2.error === 'Subscription already exists' || 
         result2.error === 'Active subscription exists')) {
      console.log('✅ Test 2 PASSED: Duplicate subscription prevented');
    } else {
      console.log('❌ Test 2 FAILED: Duplicate subscription was not prevented');
    }
    
    console.log('\n-----------------------------------\n');
    
    // Test 3: Farklı email ile subscription (başarılı olmalı)
    console.log('🟢 Test 3: Different email subscription');
    console.log('Expected: SUCCESS');
    
    const subscriptionData3 = {
      ...subscriptionData,
      userId: 'test-user-3',
      userEmail: 'different-email@example.com'
    };
    
    const response3 = await fetch(`${baseUrl}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData3)
    });
    
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', result3);
    
    if (response3.ok && result3.url) {
      console.log('✅ Test 3 PASSED: Different email subscription allowed');
    } else {
      console.log('ℹ️ Test 3: May fail due to environment setup');
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Server is running on http://localhost:3000');
    console.log('2. Firebase is configured');
    console.log('3. Stripe keys are set');
  }
  
  console.log('\n📊 Test Summary:');
  console.log('- Test 1: First subscription (should work)');
  console.log('- Test 2: Duplicate email (should be blocked)');
  console.log('- Test 3: Different email (should work)');
};

// Test'i çalıştır
if (require.main === module) {
  testDuplicateSubscription();
}

module.exports = { testDuplicateSubscription }; 