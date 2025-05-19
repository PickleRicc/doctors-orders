const gcpService = require('../services/gcpService');

/**
 * Controller for handling transcription and SOAP note generation
 */
class TranscriptionController {
  /**
   * Transcribe audio and return the text
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async transcribeAudio(req, res) {
    try {
      // Validate request
      if (!req.body.audio) {
        return res.status(400).json({
          data: null,
          error: 'Audio data is required'
        });
      }

      // Get audio data from request
      const audioData = req.body.audio;
      const options = req.body.options || {};
      
      // Base64 string or Buffer handling
      let audioContent;
      if (typeof audioData === 'string') {
        // Handle base64 string
        audioContent = audioData.replace(/^data:audio\/\w+;base64,/, '');
      } else if (req.file) {
        // Handle file upload if using multer
        audioContent = req.file.buffer;
      } else {
        return res.status(400).json({
          data: null,
          error: 'Invalid audio format'
        });
      }

      // Transcribe the audio
      const result = await gcpService.transcribeAudio(audioContent, options);
      
      return res.status(200).json({
        data: result,
        error: null
      });
    } catch (error) {
      console.error('Transcription error:', error);
      return res.status(500).json({
        data: null,
        error: `Transcription failed: ${error.message}`
      });
    }
  }

  /**
   * Generate a SOAP note from transcribed text
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateSoapNote(req, res) {
    try {
      // Validate request
      if (!req.body.transcript) {
        return res.status(400).json({
          data: null,
          error: 'Transcript is required'
        });
      }

      // Generate SOAP note
      const soapNote = await gcpService.generateSoapNote(req.body.transcript);
      
      return res.status(200).json({
        data: soapNote,
        error: null
      });
    } catch (error) {
      console.error('SOAP note generation error:', error);
      return res.status(500).json({
        data: null,
        error: `SOAP note generation failed: ${error.message}`
      });
    }
  }

  /**
   * Transcribe audio and generate SOAP note in one request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async transcribeAndGenerateSoap(req, res) {
    try {
      // Validate request
      if (!req.body.audio) {
        return res.status(400).json({
          data: null,
          error: 'Audio data is required'
        });
      }

      // Get audio data from request
      const audioData = req.body.audio;
      const options = req.body.options || {};
      
      // Base64 string or Buffer handling
      let audioContent;
      if (typeof audioData === 'string') {
        // Handle base64 string
        audioContent = audioData.replace(/^data:audio\/\w+;base64,/, '');
      } else if (req.file) {
        // Handle file upload if using multer
        audioContent = req.file.buffer;
      } else {
        return res.status(400).json({
          data: null,
          error: 'Invalid audio format'
        });
      }

      // Transcribe the audio
      const transcriptionResult = await gcpService.transcribeAudio(audioContent, options);
      
      // Generate SOAP note from transcription
      const soapNote = await gcpService.generateSoapNote(transcriptionResult.transcript);
      
      return res.status(200).json({
        data: {
          transcription: transcriptionResult,
          soapNote: soapNote
        },
        error: null
      });
    } catch (error) {
      console.error('Transcription and SOAP note generation error:', error);
      return res.status(500).json({
        data: null,
        error: `Processing failed: ${error.message}`
      });
    }
  }
}

module.exports = new TranscriptionController();
