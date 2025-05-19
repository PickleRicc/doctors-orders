// test-vertex-ai.js
// This script tests the Vertex AI integration for SOAP note generation
require('dotenv').config();
const gcpService = require('./services/gcpService');

console.log('Starting Vertex AI Gemini test for SOAP note generation...');
console.log('Using credentials from:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Sample medical transcription for testing
const sampleTranscription = `
Patient John Smith is a 45-year-old male presenting with complaints of persistent headache for the past three days. 
He describes the pain as throbbing and localized to the right temple. Pain is rated 7 out of 10. 
The headache is worse in the morning and is accompanied by mild nausea but no vomiting. 
Patient reports increased stress at work recently and has been sleeping poorly. 
He has tried taking over-the-counter ibuprofen with minimal relief.

Medical history includes hypertension, controlled with lisinopril 10mg daily. 
No known drug allergies. Last blood pressure check was two weeks ago, reading 138/85.

On examination, vital signs are within normal limits. BP 135/82, pulse 76, temperature 98.6°F. 
No neurological deficits noted. No sinus tenderness. Pupils equal and reactive to light.

Assessment suggests tension headache, possibly exacerbated by stress and poor sleep hygiene. 
Will prescribe sumatriptan 50mg for acute relief and recommend stress management techniques. 
Advised to keep a headache diary and follow up in two weeks if symptoms persist.
`;

// Test function for SOAP note generation
async function testSoapNoteGeneration() {
  try {
    console.log('\n=== Testing SOAP Note Generation with Vertex AI ===');
    console.log('Processing sample transcription...');
    
    // Generate SOAP note using Vertex AI
    const soapNote = await gcpService.generateSoapNote(sampleTranscription, {
      template: 'soap',
      patientInfo: {
        name: 'John Smith',
        age: '45',
        gender: 'male'
      }
    });
    
    console.log('\n✅ SOAP Note Generation Successful!');
    console.log('\nGenerated SOAP Note:');
    console.log(JSON.stringify(soapNote, null, 2));
    
    return true;
  } catch (error) {
    console.error('\n❌ Error generating SOAP note:', error);
    return false;
  }
}

// Test function for follow-up note generation
async function testFollowUpNoteGeneration() {
  try {
    console.log('\n=== Testing Follow-Up Note Generation with Vertex AI ===');
    
    // Sample follow-up transcription
    const followUpTranscription = `
    Following up with John Smith regarding his tension headaches. Patient reports improvement after starting sumatriptan.
    Headache frequency has decreased from daily to twice weekly. Pain intensity now rated as 3/10 when present.
    Has been practicing stress management techniques and improving sleep hygiene as recommended.
    Blood pressure today is 130/80. Will continue current management and follow up in three months.
    `;
    
    // Generate follow-up note using Vertex AI
    const followUpNote = await gcpService.generateSoapNote(followUpTranscription, {
      template: 'followup',
      patientInfo: {
        name: 'John Smith',
        age: '45',
        gender: 'male'
      }
    });
    
    console.log('\n✅ Follow-Up Note Generation Successful!');
    console.log('\nGenerated Follow-Up Note:');
    console.log(JSON.stringify(followUpNote, null, 2));
    
    return true;
  } catch (error) {
    console.error('\n❌ Error generating follow-up note:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== Vertex AI Integration Test ===');
  console.log('Testing Vertex AI for medical note generation...\n');
  
  let soapSuccess = false;
  let followUpSuccess = false;
  
  try {
    // Test SOAP note generation
    soapSuccess = await testSoapNoteGeneration();
    
    // Test follow-up note generation
    followUpSuccess = await testFollowUpNoteGeneration();
    
    console.log('\n=== Test Summary ===');
    console.log(`SOAP Note Generation: ${soapSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Follow-Up Note Generation: ${followUpSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (soapSuccess && followUpSuccess) {
      console.log('\n✅ All Vertex AI tests passed! Your setup is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the error messages above.');
    }
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();
