const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Notes routes
 * All routes require JWT authentication
 */

// GET /api/notes
// Get all notes for the authenticated user
router.get('/', authMiddleware.validateJwt, notesController.getNotes);

// GET /api/notes/:id
// Get a single note by ID
router.get('/:id', authMiddleware.validateJwt, notesController.getNoteById);

// POST /api/notes
// Create a new note
router.post('/', authMiddleware.validateJwt, notesController.createNote);

// PUT /api/notes/:id
// Update a note
router.put('/:id', authMiddleware.validateJwt, notesController.updateNote);

// DELETE /api/notes/:id
// Delete a note
router.delete('/:id', authMiddleware.validateJwt, notesController.deleteNote);

module.exports = router;
