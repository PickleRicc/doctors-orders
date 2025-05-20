/**
 * GCP Database Service
 * Handles connections and operations with GCP Cloud SQL for PHI data
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class GcpDatabaseService {
  constructor() {
    // Log connection details for debugging
    console.log('Initializing GCP Database Service with:');
    console.log(`Host: ${process.env.GCP_DB_HOST}`);
    console.log(`Port: ${process.env.GCP_DB_PORT || 5432}`);
    console.log(`Database: ${process.env.GCP_DB_NAME}`);
    console.log(`User: ${process.env.GCP_DB_USER}`);
    
    // Initialize connection pool
    this.pool = new Pool({
      user: process.env.GCP_DB_USER,
      host: process.env.GCP_DB_HOST,
      database: process.env.GCP_DB_NAME,
      password: process.env.GCP_DB_PASSWORD,
      port: process.env.GCP_DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 5000, // How long to wait for a connection (increased for debugging)
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      // Don't exit process during development
      if (process.env.NODE_ENV === 'production') {
        process.exit(-1);
      }
    });

    console.log('GCP Database Service initialized');
  }

  /**
   * Get a client from the connection pool
   * @returns {Promise<Object>} Database client
   */
  async getClient() {
    return await this.pool.connect();
  }

  /**
   * Execute a query with parameters
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Error executing query', { text, error });
      throw error;
    }
  }

  /**
   * Execute a query within a transaction
   * @param {Function} callback - Function that executes queries within the transaction
   * @returns {Promise<any>} Result of the transaction
   */
  async withTransaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ===== Note Operations =====

  /**
   * Create a new note
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} Created note
   */
  async createNote(noteData) {
    const {
      userId,
      patientId,
      title,
      soapData,
      rawTranscript,
      templateId,
      recordingTime
    } = noteData;

    const id = uuidv4();
    const query = `
      INSERT INTO notes (
        id, user_id, patient_id, title, soap_data, raw_transcript, 
        template_id, recording_time, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      userId,
      patientId || null,
      title,
      soapData,
      rawTranscript,
      templateId || null,
      recordingTime || 0
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get notes for a user with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, sortBy, sortOrder, searchTerm, patientId)
   * @returns {Promise<Object>} Notes and count
   */
  async getNotes(userId, options = {}) {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      patientId = null,
      searchTerm = null
    } = options;

    // Build the WHERE clause
    let whereClause = 'n.user_id = $1 AND n.is_deleted = FALSE';
    const queryParams = [userId];
    let paramIndex = 2;

    if (patientId) {
      whereClause += ` AND n.patient_id = $${paramIndex}`;
      queryParams.push(patientId);
      paramIndex++;
    }

    if (searchTerm) {
      whereClause += ` AND (n.title ILIKE $${paramIndex} OR n.soap_data::text ILIKE $${paramIndex})`;
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notes n
      WHERE ${whereClause}
    `;

    // Data query
    const dataQuery = `
      SELECT n.*, p.first_name, p.last_name
      FROM notes n
      LEFT JOIN patients p ON n.patient_id = p.id
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Execute both queries
    const [countResult, dataResult] = await Promise.all([
      this.query(countQuery, queryParams.slice(0, paramIndex - 1)),
      this.query(dataQuery, queryParams)
    ]);

    return {
      notes: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      limit,
      offset
    };
  }

  /**
   * Get a note by ID
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Note data
   */
  async getNoteById(noteId, userId) {
    const query = `
      SELECT n.*, p.first_name, p.last_name
      FROM notes n
      LEFT JOIN patients p ON n.patient_id = p.id
      WHERE n.id = $1 AND n.user_id = $2 AND n.is_deleted = FALSE
    `;

    const result = await this.query(query, [noteId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Note not found');
    }

    return result.rows[0];
  }

  /**
   * Update a note
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated note
   */
  async updateNote(noteId, userId, updateData) {
    // First, get the current version of the note
    const currentNote = await this.getNoteById(noteId, userId);
    
    // Save the current version to note_versions
    await this.createNoteVersion(currentNote, userId);
    
    // Build the update query
    const allowedFields = ['title', 'soap_data', 'patient_id', 'template_id'];
    const updates = [];
    const values = [noteId, userId];
    let paramIndex = 3;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key.toLowerCase()} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updates.length === 0) {
      return currentNote; // Nothing to update
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    const query = `
      UPDATE notes
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Note not found or update failed');
    }
    
    return result.rows[0];
  }

  /**
   * Create a version of a note
   * @param {Object} note - Note data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created version
   */
  async createNoteVersion(note, userId) {
    // Get the current version number
    const versionQuery = `
      SELECT MAX(version_number) as max_version
      FROM note_versions
      WHERE note_id = $1
    `;
    
    const versionResult = await this.query(versionQuery, [note.id]);
    const versionNumber = (versionResult.rows[0].max_version || 0) + 1;
    
    // Create the new version
    const query = `
      INSERT INTO note_versions (
        id, note_id, soap_data, version_number, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const values = [
      uuidv4(),
      note.id,
      note.soap_data,
      versionNumber,
      userId
    ];
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get versions of a note
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Array>} Note versions
   */
  async getNoteVersions(noteId, userId) {
    // First verify the user owns the note
    await this.getNoteById(noteId, userId);
    
    const query = `
      SELECT *
      FROM note_versions
      WHERE note_id = $1
      ORDER BY version_number DESC
    `;
    
    const result = await this.query(query, [noteId]);
    return result.rows;
  }

  /**
   * Soft delete a note
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Delete result
   */
  async deleteNote(noteId, userId) {
    const query = `
      UPDATE notes
      SET is_deleted = TRUE, deleted_at = NOW()
      WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
      RETURNING id
    `;
    
    const result = await this.query(query, [noteId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Note not found or already deleted');
    }
    
    return { id: result.rows[0].id, deleted: true };
  }

  // ===== Patient Operations =====

  /**
   * Create a new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>} Created patient
   */
  async createPatient(patientData) {
    const {
      userId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      mrn,
      contactPhone,
      contactEmail,
      address,
      insuranceInfo,
      allergies,
      medications,
      medicalHistory
    } = patientData;

    const id = uuidv4();
    const query = `
      INSERT INTO patients (
        id, user_id, first_name, last_name, date_of_birth, gender, 
        mrn, contact_phone, contact_email, address, insurance_info, 
        allergies, medications, medical_history, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      userId,
      firstName,
      lastName,
      dateOfBirth || null,
      gender || null,
      mrn || null,
      contactPhone || null,
      contactEmail || null,
      address || null,
      insuranceInfo || null,
      allergies || null,
      medications || null,
      medicalHistory || null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get patients for a user with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, sortBy, sortOrder, searchTerm)
   * @returns {Promise<Object>} Patients and count
   */
  async getPatients(userId, options = {}) {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'last_name',
      sortOrder = 'ASC',
      searchTerm = null
    } = options;

    // Build the WHERE clause
    let whereClause = 'user_id = $1 AND is_deleted = FALSE';
    const queryParams = [userId];
    let paramIndex = 2;

    if (searchTerm) {
      whereClause += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR mrn ILIKE $${paramIndex})`;
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients
      WHERE ${whereClause}
    `;

    // Data query
    const dataQuery = `
      SELECT *
      FROM patients
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Execute both queries
    const [countResult, dataResult] = await Promise.all([
      this.query(countQuery, queryParams.slice(0, paramIndex - 1)),
      this.query(dataQuery, queryParams)
    ]);

    return {
      patients: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      limit,
      offset
    };
  }

  /**
   * Get a patient by ID
   * @param {string} patientId - Patient ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Patient data
   */
  async getPatientById(patientId, userId) {
    const query = `
      SELECT *
      FROM patients
      WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
    `;

    const result = await this.query(query, [patientId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Patient not found');
    }

    return result.rows[0];
  }

  /**
   * Update a patient
   * @param {string} patientId - Patient ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated patient
   */
  async updatePatient(patientId, userId, updateData) {
    // Build the update query
    const allowedFields = [
      'first_name', 'last_name', 'date_of_birth', 'gender', 'mrn',
      'contact_phone', 'contact_email', 'address', 'insurance_info',
      'allergies', 'medications', 'medical_history'
    ];
    
    const updates = [];
    const values = [patientId, userId];
    let paramIndex = 3;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updates.length === 0) {
      // Nothing to update, get current patient
      return await this.getPatientById(patientId, userId);
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    const query = `
      UPDATE patients
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Patient not found or update failed');
    }
    
    return result.rows[0];
  }

  /**
   * Soft delete a patient
   * @param {string} patientId - Patient ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Delete result
   */
  async deletePatient(patientId, userId) {
    const query = `
      UPDATE patients
      SET is_deleted = TRUE, updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE
      RETURNING id
    `;
    
    const result = await this.query(query, [patientId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Patient not found or already deleted');
    }
    
    return { id: result.rows[0].id, deleted: true };
  }

  // ===== Template Operations =====

  /**
   * Get all templates (system and user-specific)
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Templates
   */
  async getTemplates(userId, options = {}) {
    const {
      specialty = null,
      includeSystem = true,
      activeOnly = true
    } = options;

    // Build the WHERE clause
    let whereClause = '(user_id = $1 OR is_system_template = TRUE)';
    const queryParams = [userId];
    let paramIndex = 2;

    if (specialty) {
      whereClause += ` AND specialty = $${paramIndex}`;
      queryParams.push(specialty);
      paramIndex++;
    }

    if (activeOnly) {
      whereClause += ' AND is_active = TRUE';
    }

    const query = `
      SELECT *
      FROM templates
      WHERE ${whereClause}
      ORDER BY is_system_template DESC, name ASC
    `;

    const result = await this.query(query, queryParams);
    return result.rows;
  }

  /**
   * Get a template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Template data
   */
  async getTemplateById(templateId) {
    const query = `
      SELECT *
      FROM templates
      WHERE id = $1 AND is_active = TRUE
    `;

    const result = await this.query(query, [templateId]);
    
    if (result.rows.length === 0) {
      throw new Error('Template not found');
    }

    return result.rows[0];
  }

  /**
   * Create a custom template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(templateData) {
    const {
      userId,
      name,
      description,
      specialty,
      promptTemplate
    } = templateData;

    const id = uuidv4();
    const query = `
      INSERT INTO templates (
        id, user_id, name, description, specialty, prompt_template,
        is_system_template, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      userId,
      name,
      description || null,
      specialty,
      promptTemplate
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a template
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(templateId, userId, updateData) {
    // First check if this is a system template or belongs to user
    const checkQuery = `
      SELECT is_system_template, user_id
      FROM templates
      WHERE id = $1
    `;
    
    const checkResult = await this.query(checkQuery, [templateId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Template not found');
    }
    
    const template = checkResult.rows[0];
    
    // Users can only update their own templates
    if (template.is_system_template || template.user_id !== userId) {
      throw new Error('Cannot update system template or template owned by another user');
    }
    
    // Build the update query
    const allowedFields = [
      'name', 'description', 'specialty', 'prompt_template', 'is_active'
    ];
    
    const updates = [];
    const values = [templateId, userId];
    let paramIndex = 3;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updates.length === 0) {
      // Nothing to update, get current template
      return await this.getTemplateById(templateId);
    }
    
    // Add updated_at timestamp and increment version
    updates.push(`updated_at = NOW(), version = version + 1`);
    
    const query = `
      UPDATE templates
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Template not found or update failed');
    }
    
    return result.rows[0];
  }

  /**
   * Delete a template (or deactivate system template)
   * @param {string} templateId - Template ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Delete result
   */
  async deleteTemplate(templateId, userId) {
    // First check if this is a system template or belongs to user
    const checkQuery = `
      SELECT is_system_template, user_id
      FROM templates
      WHERE id = $1
    `;
    
    const checkResult = await this.query(checkQuery, [templateId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Template not found');
    }
    
    const template = checkResult.rows[0];
    
    // Users can only delete their own templates
    if (template.is_system_template || template.user_id !== userId) {
      throw new Error('Cannot delete system template or template owned by another user');
    }
    
    const query = `
      DELETE FROM templates
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await this.query(query, [templateId, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('Template not found or delete failed');
    }
    
    return { id: result.rows[0].id, deleted: true };
  }
}

module.exports = new GcpDatabaseService();
