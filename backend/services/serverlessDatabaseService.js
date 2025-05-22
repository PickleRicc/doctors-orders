/**
 * Serverless Database Service for Google Cloud SQL
 * 
 * This service provides database operations optimized for serverless environments
 * like Vercel. It uses direct SSL connections to Cloud SQL in production and
 * falls back to proxy connections in development.
 * 
 * It implements the same interface as gcpDatabaseService.js but with a more
 * robust connection approach for production environments.
 */

const { query, isDatabaseHealthy } = require('../../app/api/database/connectionManager');

/**
 * Gets notes for a user with pagination and filtering
 * @param {string} userId - User ID to get notes for
 * @param {Object} options - Query options (limit, offset, patientId, sortBy, sortOrder)
 * @returns {Promise<Object>} Notes and pagination info
 */
async function getNotes(userId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    patientId = null,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = options;

  // Build the WHERE clause
  const whereConditions = ['n.user_id = $1'];
  const queryParams = [userId];
  let paramIndex = 2;

  if (patientId) {
    whereConditions.push(`n.patient_id = $${paramIndex}`);
    queryParams.push(patientId);
    paramIndex++;
  }

  // Build the query with proper table aliases to avoid ambiguous column references
  const countQuery = `
    SELECT COUNT(*) as total
    FROM notes n
    JOIN patients p ON n.patient_id = p.id
    WHERE ${whereConditions.join(' AND ')}
  `;

  const notesQuery = `
    SELECT 
      n.id, 
      n.title, 
      n.content, 
      n.raw_transcript, 
      n.soap_data, 
      n.created_at, 
      n.updated_at,
      p.id as patient_id, 
      p.first_name, 
      p.last_name, 
      p.mrn
    FROM notes n
    JOIN patients p ON n.patient_id = p.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY n.${sortBy} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  // Add limit and offset to params
  queryParams.push(limit, offset);

  try {
    // Execute both queries in parallel
    const [countResult, notesResult] = await Promise.all([
      query(countQuery, queryParams.slice(0, paramIndex - 1)),
      query(notesQuery, queryParams)
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    const notes = notesResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      raw_transcript: row.raw_transcript,
      soap_data: row.soap_data,
      created_at: row.created_at,
      updated_at: row.updated_at,
      patient: {
        id: row.patient_id,
        first_name: row.first_name,
        last_name: row.last_name,
        mrn: row.mrn
      }
    }));

    return {
      notes,
      total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error getting notes:', error);
    throw new Error(`Failed to get notes: ${error.message}`);
  }
}

/**
 * Gets a single note by ID
 * @param {string} noteId - ID of the note to get
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} Note data
 */
async function getNote(noteId, userId) {
  const queryText = `
    SELECT 
      n.id, 
      n.title, 
      n.content, 
      n.raw_transcript, 
      n.soap_data, 
      n.created_at, 
      n.updated_at,
      p.id as patient_id, 
      p.first_name, 
      p.last_name, 
      p.mrn
    FROM notes n
    JOIN patients p ON n.patient_id = p.id
    WHERE n.id = $1 AND n.user_id = $2
  `;

  try {
    const result = await query(queryText, [noteId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Note not found');
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      raw_transcript: row.raw_transcript,
      soap_data: row.soap_data,
      created_at: row.created_at,
      updated_at: row.updated_at,
      patient: {
        id: row.patient_id,
        first_name: row.first_name,
        last_name: row.last_name,
        mrn: row.mrn
      }
    };
  } catch (error) {
    console.error('Error getting note:', error);
    throw new Error(`Failed to get note: ${error.message}`);
  }
}

/**
 * Creates a new note
 * @param {Object} noteData - Note data to create
 * @returns {Promise<Object>} Created note
 */
async function createNote(noteData) {
  const {
    user_id,
    patient_id,
    title,
    content,
    raw_transcript,
    soap_data,
    created_at = new Date().toISOString()
  } = noteData;

  const queryText = `
    INSERT INTO notes (
      user_id, patient_id, title, content, raw_transcript, soap_data, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $7
    ) RETURNING id, title, content, raw_transcript, soap_data, created_at, updated_at
  `;

  const values = [
    user_id,
    patient_id,
    title || 'Untitled Note',
    content,
    raw_transcript || null,
    soap_data || null,
    created_at
  ];

  try {
    const result = await query(queryText, values);
    const note = result.rows[0];
    
    // Get patient information
    const patientQuery = `
      SELECT id, first_name, last_name, mrn
      FROM patients
      WHERE id = $1
    `;
    
    const patientResult = await query(patientQuery, [patient_id]);
    const patient = patientResult.rows[0];
    
    return {
      ...note,
      patient
    };
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error(`Failed to create note: ${error.message}`);
  }
}

/**
 * Updates an existing note
 * @param {string} noteId - ID of the note to update
 * @param {Object} noteData - Updated note data
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Object>} Updated note
 */
async function updateNote(noteId, noteData, userId) {
  // First check if the note exists and belongs to the user
  const checkQuery = `
    SELECT id FROM notes WHERE id = $1 AND user_id = $2
  `;
  
  const checkResult = await query(checkQuery, [noteId, userId]);
  
  if (checkResult.rows.length === 0) {
    throw new Error('Note not found or unauthorized');
  }
  
  // Build the update query dynamically based on provided fields
  const updates = [];
  const values = [noteId, userId];
  let paramIndex = 3;
  
  // Add each field that was provided
  const updateableFields = ['title', 'content', 'raw_transcript', 'soap_data', 'patient_id'];
  
  updateableFields.forEach(field => {
    if (noteData[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(noteData[field]);
      paramIndex++;
    }
  });
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = $${paramIndex}`);
  values.push(new Date().toISOString());
  
  // If no fields to update, just return the existing note
  if (updates.length === 1) { // Only updated_at
    return getNote(noteId, userId);
  }
  
  const updateQuery = `
    UPDATE notes
    SET ${updates.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;
  
  try {
    await query(updateQuery, values);
    return getNote(noteId, userId);
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error(`Failed to update note: ${error.message}`);
  }
}

/**
 * Deletes a note
 * @param {string} noteId - ID of the note to delete
 * @param {string} userId - User ID for authorization
 * @returns {Promise<boolean>} Success indicator
 */
async function deleteNote(noteId, userId) {
  const queryText = `
    DELETE FROM notes
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;
  
  try {
    const result = await query(queryText, [noteId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Note not found or unauthorized');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}

/**
 * Finds or creates a patient
 * @param {Object} patientData - Patient data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Patient object
 */
async function findOrCreatePatient(patientData, userId) {
  const { mrn, name, first_name, last_name } = patientData;
  
  // Parse name if provided as a single field
  let firstName = first_name;
  let lastName = last_name;
  
  if (!firstName && !lastName && name) {
    const nameParts = name.split(' ');
    firstName = nameParts[0];
    lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
  
  // Try to find by MRN first if provided
  if (mrn) {
    const mrnQuery = `
      SELECT id, first_name, last_name, mrn
      FROM patients
      WHERE mrn = $1 AND user_id = $2
    `;
    
    const mrnResult = await query(mrnQuery, [mrn, userId]);
    
    if (mrnResult.rows.length > 0) {
      return mrnResult.rows[0];
    }
  }
  
  // Try to find by name
  if (firstName && lastName) {
    const nameQuery = `
      SELECT id, first_name, last_name, mrn
      FROM patients
      WHERE first_name = $1 AND last_name = $2 AND user_id = $3
    `;
    
    const nameResult = await query(nameQuery, [firstName, lastName, userId]);
    
    if (nameResult.rows.length > 0) {
      return nameResult.rows[0];
    }
  }
  
  // Create a new patient
  const createQuery = `
    INSERT INTO patients (user_id, first_name, last_name, mrn, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, first_name, last_name, mrn
  `;
  
  const createResult = await query(createQuery, [
    userId,
    firstName || '',
    lastName || '',
    mrn || null,
    new Date().toISOString()
  ]);
  
  return createResult.rows[0];
}

/**
 * Gets all templates for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of templates
 */
async function getTemplates(userId) {
  const queryText = `
    SELECT id, name, specialty, template_data, created_at, updated_at
    FROM templates
    WHERE user_id = $1 OR is_public = true
    ORDER BY name ASC
  `;
  
  try {
    const result = await query(queryText, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting templates:', error);
    throw new Error(`Failed to get templates: ${error.message}`);
  }
}

/**
 * Checks if the database connection is healthy
 * @returns {Promise<boolean>} Whether the database is connected
 */
async function checkDatabaseHealth() {
  return isDatabaseHealthy();
}

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  findOrCreatePatient,
  getTemplates,
  checkDatabaseHealth
};
