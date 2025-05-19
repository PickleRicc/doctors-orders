const express = require('express');
const router = express.Router();
const transcriptionController = require('../controllers/transcriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Transcription routes
 * All routes require JWT authentication
 */

// POST /api/transcription/audio
// Transcribe audio and return text
router.post('/audio', authMiddleware.validateJwt, transcriptionController.transcribeAudio);

// POST /api/transcription/soap
// Generate SOAP note from transcript
router.post('/soap', authMiddleware.validateJwt, transcriptionController.generateSoapNote);

// POST /api/transcription/complete
// Transcribe audio and generate SOAP note in one request
router.post('/complete', authMiddleware.validateJwt, transcriptionController.transcribeAndGenerateSoap);

module.exports = router;
