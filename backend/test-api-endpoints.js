// test-api-endpoints.js
// This script tests the API endpoints for transcription and SOAP note generation
require('dotenv').config();
const gcpService = require('./services/gcpService');
const fetch = require('node-fetch'); // Node.js doesn't have fetch by default

// Sample medical transcription for testing
const sampleTranscription = `
Patient Jane Doe is a 35-year-old female presenting with complaints of lower back pain for the past week.
She describes the pain as dull and constant, rated 6 out of 10 in intensity.
The pain is worse with prolonged sitting and somewhat relieved by lying down.
Patient reports no recent injury but mentions she started a new exercise routine two weeks ago.
No radiation of pain to the legs, no numbness or tingling reported.

Medical history includes anxiety, treated with sertraline 50mg daily.
No known drug allergies. Last physical was 6 months ago with normal findings.

On examination, vital signs are normal. BP 120/75, pulse 72, temperature 98.4°F.
Tenderness noted in the lumbar region. Range of motion limited by pain.
No neurological deficits. Straight leg raise test negative bilaterally.

Assessment suggests mechanical low back pain related to new exercise routine.
Will recommend rest for 48 hours, followed by gentle stretching exercises.
Prescribed ibuprofen 600mg every 6 hours as needed for pain.
Patient advised to apply heat therapy and return if symptoms worsen or don't improve within a week.
`;

// Base URL for API
const API_BASE_URL = 'http://localhost:3000/api';

// Test function for direct GCP service call
async function testGcpServiceDirectly() {
  try {
    console.log('\n=== Testing GCP Service Directly ===');
    console.log('Generating SOAP note from sample transcription...');
    
    const soapNote = await gcpService.generateSoapNote(sampleTranscription, {
      template: 'soap',
      patientInfo: {
        name: 'Jane Doe',
        age: '35',
        gender: 'female'
      }
    });
    
    console.log('\n✅ Direct GCP Service Call Successful!');
    console.log('\nGenerated SOAP Note:');
    console.log(JSON.stringify(soapNote, null, 2));
    
    return soapNote;
  } catch (error) {
    console.error('\n❌ Error with direct GCP service call:', error);
    return null;
  }
}

// Test function for API endpoint
async function testApiEndpoint() {
  try {
    console.log('\n=== Testing API Endpoint ===');
    console.log('Calling /api/transcription/soap endpoint...');
    
    // For testing purposes, we'll use a mock token
    const mockToken = 'test-token';
    
    const response = await fetch(`${API_BASE_URL}/transcription/soap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        transcript: sampleTranscription,
        options: {
          template: 'soap',
          patientInfo: {
            name: 'Jane Doe',
            age: '35',
            gender: 'female'
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ API Endpoint Call Successful!');
    console.log('\nAPI Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('\n❌ Error with API endpoint call:');
    console.error('Error message:', error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('=== API Endpoint Integration Test ===');
  
  // First test the GCP service directly
  const directResult = await testGcpServiceDirectly();
  
  // Then test the API endpoint
  if (directResult) {
    console.log('\nDirect GCP service call successful, now testing API endpoint...');
    const apiResult = await testApiEndpoint();
    
    console.log('\n=== Test Summary ===');
    console.log(`Direct GCP Service: ${directResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`API Endpoint: ${apiResult ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (directResult && apiResult) {
      console.log('\n✅ All tests passed! The backend API is functioning correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the error messages above.');
    }
  } else {
    console.log('\n❌ Direct GCP service call failed. Skipping API endpoint test.');
  }
}

// Run the tests
runTests();
