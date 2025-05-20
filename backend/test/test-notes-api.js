/**
 * Test script for the Notes API with GCP Database
 * 
 * This script tests the connection between the Notes API and the GCP Cloud SQL database
 * Run with: node backend/test/test-notes-api.js
 */

require('dotenv').config();
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api';
const TEST_NOTE = {
  title: 'Test Note from GCP Integration',
  transcript: 'This is a test transcript for the GCP database integration.',
  patient: {
    name: 'Test Patient',
    dob: '1990-01-01',
    gender: 'Other'
  },
  soapData: {
    subjective: 'Patient reports test symptoms',
    objective: 'Test examination findings',
    assessment: 'Test diagnosis',
    plan: 'Test treatment plan'
  },
  recordingTime: 30,
  timestamp: new Date().toISOString()
};

// Mock JWT token for development
const DEV_TOKEN = 'dev-token';

/**
 * Test the Notes API
 */
async function testNotesApi() {
  try {
    console.log('Testing Notes API with GCP Database...');
    console.log('---------------------------------------');

    // 1. Create a new note
    console.log('1. Creating a new note...');
    const createResponse = await axios.post(`${API_URL}/notes`, TEST_NOTE, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEV_TOKEN}`
      }
    });

    if (createResponse.status !== 200) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const createdNote = createResponse.data.data;
    console.log('✅ Note created successfully!');
    console.log('Note ID:', createdNote.id);
    console.log('---------------------------------------');

    // 2. Get the created note
    console.log(`2. Getting note with ID: ${createdNote.id}...`);
    const getResponse = await axios.get(`${API_URL}/notes/${createdNote.id}`, {
      headers: {
        'Authorization': `Bearer ${DEV_TOKEN}`
      }
    });

    if (getResponse.status !== 200) {
      throw new Error(`Failed to get note: ${getResponse.status}`);
    }

    const retrievedNote = getResponse.data.data;
    console.log('✅ Note retrieved successfully!');
    console.log('Title:', retrievedNote.title);
    console.log('---------------------------------------');

    // 3. Update the note
    console.log(`3. Updating note with ID: ${createdNote.id}...`);
    const updateResponse = await axios.put(`${API_URL}/notes/${createdNote.id}`, {
      title: 'Updated Test Note',
      soapData: {
        ...TEST_NOTE.soapData,
        assessment: 'Updated test diagnosis'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEV_TOKEN}`
      }
    });

    if (updateResponse.status !== 200) {
      throw new Error(`Failed to update note: ${updateResponse.status}`);
    }

    const updatedNote = updateResponse.data.data;
    console.log('✅ Note updated successfully!');
    console.log('New Title:', updatedNote.title);
    console.log('---------------------------------------');

    // 4. Get all notes
    console.log('4. Getting all notes...');
    const getAllResponse = await axios.get(`${API_URL}/notes`, {
      headers: {
        'Authorization': `Bearer ${DEV_TOKEN}`
      }
    });

    if (getAllResponse.status !== 200) {
      throw new Error(`Failed to get all notes: ${getAllResponse.status}`);
    }

    const allNotes = getAllResponse.data.data;
    console.log('✅ Retrieved all notes successfully!');
    console.log('Total Notes:', allNotes.length);
    console.log('---------------------------------------');

    // 5. Delete the note (uncomment to test deletion)
    /*
    console.log(`5. Deleting note with ID: ${createdNote.id}...`);
    const deleteResponse = await axios.delete(`${API_URL}/notes/${createdNote.id}`, {
      headers: {
        'Authorization': `Bearer ${DEV_TOKEN}`
      }
    });

    if (deleteResponse.status !== 200) {
      throw new Error(`Failed to delete note: ${deleteResponse.status}`);
    }

    console.log('✅ Note deleted successfully!');
    console.log('---------------------------------------');
    */

    console.log('All tests completed successfully! 🎉');
    console.log('GCP Database integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else {
      console.error('Error details:', error);
    }
  }
}

// Run the tests
testNotesApi();
