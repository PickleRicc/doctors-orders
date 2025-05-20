/**
 * Notes Controller
 * Handles saving and retrieving medical notes
 */

// Import the GCP database service
const gcpDatabaseService = require('../services/gcpDatabaseService');

class NotesController {
  /**
   * Create a new note
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createNote(req, res) {
    try {
      // Validate request
      if (!req.body.title || !req.body.transcript) {
        return res.status(400).json({
          data: null,
          error: 'Title and transcript are required'
        });
      }

      // Extract patient info or create a new patient if needed
      let patientId = null;
      if (req.body.patient) {
        // Check if patient exists or create a new one
        const patientResult = await gcpDatabaseService.findOrCreatePatient({
          userId: req.userId,
          name: req.body.patient.name,
          dob: req.body.patient.dob,
          gender: req.body.patient.gender,
          mrn: req.body.patient.mrn
        });
        patientId = patientResult.id;
      }

      // Create note in the database
      const note = await gcpDatabaseService.createNote({
        userId: req.userId, // From auth middleware
        patientId: patientId,
        title: req.body.title,
        transcript: req.body.transcript,
        templateId: req.body.template?.id,
        recordingTime: req.body.recordingTime,
        soapData: req.body.soapData,
        metadata: {
          source: 'dictation',
          timestamp: req.body.timestamp || new Date().toISOString()
        }
      });
      
      // Return the created note
      return res.status(201).json({
        data: note,
        error: null
      });
    } catch (error) {
      console.error('Error creating note:', error);
      return res.status(500).json({
        data: null,
        error: `Failed to create note: ${error.message}`
      });
    }
  }

  /**
   * Get all notes for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getNotes(req, res) {
    try {
      // Get query parameters for filtering and pagination
      const { limit = 20, offset = 0, patientId } = req.query;
      
      // Query the database for user's notes
      const userNotes = await gcpDatabaseService.getNotesByUserId(req.userId, {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        patientId
      });
      
      return res.status(200).json({
        data: userNotes,
        error: null
      });
    } catch (error) {
      console.error('Error getting notes:', error);
      return res.status(500).json({
        data: null,
        error: `Failed to get notes: ${error.message}`
      });
    }
  }

  /**
   * Get a single note by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getNoteById(req, res) {
    try {
      const noteId = req.params.id;
      
      // Query the database for the specific note
      const note = await gcpDatabaseService.getNoteById(noteId, req.userId);
      
      if (!note) {
        return res.status(404).json({
          data: null,
          error: 'Note not found'
        });
      }
      
      return res.status(200).json({
        data: note,
        error: null
      });
    } catch (error) {
      console.error('Error getting note:', error);
      return res.status(500).json({
        data: null,
        error: `Failed to get note: ${error.message}`
      });
    }
  }

  /**
   * Update a note
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateNote(req, res) {
    try {
      const noteId = req.params.id;
      
      // Extract the fields to update
      const updateData = {};
      
      // Only include fields that are allowed to be updated
      if (req.body.title) updateData.title = req.body.title;
      if (req.body.transcript) updateData.transcript = req.body.transcript;
      if (req.body.soapData) updateData.soapData = req.body.soapData;
      if (req.body.patientId) updateData.patientId = req.body.patientId;
      
      // Update the note in the database
      const updatedNote = await gcpDatabaseService.updateNote(noteId, req.userId, updateData);
      
      if (!updatedNote) {
        return res.status(404).json({
          data: null,
          error: 'Note not found'
        });
      }
      
      return res.status(200).json({
        data: updatedNote,
        error: null
      });
    } catch (error) {
      console.error('Error updating note:', error);
      return res.status(500).json({
        data: null,
        error: `Failed to update note: ${error.message}`
      });
    }
  }

  /**
   * Delete a note
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteNote(req, res) {
    try {
      const noteId = req.params.id;
      
      // Delete the note from the database
      const result = await gcpDatabaseService.deleteNote(noteId, req.userId);
      
      if (!result) {
        return res.status(404).json({
          data: null,
          error: 'Note not found'
        });
      }
      
      return res.status(200).json({
        data: { id: noteId, deleted: true },
        error: null
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      return res.status(500).json({
        data: null,
        error: `Failed to delete note: ${error.message}`
      });
    }
  }
}

module.exports = new NotesController();
