/**
 * Notes Controller
 * Handles saving and retrieving medical notes
 */

// This would typically connect to a database service
// For now, we'll use a simple in-memory store
const notesStore = [];

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

      // Create note object
      const note = {
        id: Date.now().toString(), // Simple ID generation
        userId: req.userId, // From auth middleware
        title: req.body.title,
        patient: req.body.patient,
        template: req.body.template,
        transcript: req.body.transcript,
        recordingTime: req.body.recordingTime,
        soapData: req.body.soapData,
        timestamp: req.body.timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // In a real implementation, we would save to a database
      // For now, just store in memory
      notesStore.push(note);
      
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
      // In a real implementation, we would query the database
      // For now, just filter the in-memory store
      const userNotes = notesStore.filter(note => note.userId === req.userId);
      
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
      
      // In a real implementation, we would query the database
      // For now, just find in the in-memory store
      const note = notesStore.find(note => note.id === noteId && note.userId === req.userId);
      
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
      
      // Find the note index
      const noteIndex = notesStore.findIndex(note => note.id === noteId && note.userId === req.userId);
      
      if (noteIndex === -1) {
        return res.status(404).json({
          data: null,
          error: 'Note not found'
        });
      }
      
      // Update the note
      const updatedNote = {
        ...notesStore[noteIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      // Save the updated note
      notesStore[noteIndex] = updatedNote;
      
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
      
      // Find the note index
      const noteIndex = notesStore.findIndex(note => note.id === noteId && note.userId === req.userId);
      
      if (noteIndex === -1) {
        return res.status(404).json({
          data: null,
          error: 'Note not found'
        });
      }
      
      // Remove the note
      notesStore.splice(noteIndex, 1);
      
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
