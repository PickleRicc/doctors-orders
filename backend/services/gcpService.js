const { Storage } = require('@google-cloud/storage');
const speech = require('@google-cloud/speech');
const { LanguageServiceClient } = require('@google-cloud/language');
const { VertexAI } = require('@google-cloud/vertexai');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * GCP Service for handling Speech-to-Text and Natural Language API
 * This service handles authentication and provides methods for interacting with GCP services
 */
class GcpService {
  constructor() {
    // Initialize clients based on environment
    // In production, these will use Application Default Credentials
    // In development, they'll use credentials from a JSON file
    this.speechClient = new speech.SpeechClient();
    this.languageClient = new LanguageServiceClient();
    this.storage = new Storage();
    
    // Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID || 'ptapp2025-459122', // Use your project ID
      location: process.env.GCP_LOCATION || 'us-central1', // Default region
    });
    
    // Initialize with null - we'll try different models until one works
    this.generativeModel = null;
    
    // List of models to try in order of preference
    this.geminiModels = [
      "gemini-2.0-flash-001"  // We know this works from our test
    ];
    
    // Default generation config
    this.generationConfig = {
      temperature: 0.2,        // Lower temperature for more consistent results
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    };
    
    // Configure temporary storage for audio files
    this.tempDir = path.join(os.tmpdir(), 'doctors-orders-audio');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Transcribe audio using Google Speech-to-Text
   * @param {Buffer|string} audioContent - Audio buffer or base64 encoded string
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audioContent, options = {}) {
    try {
      const request = {
        audio: {
          content: Buffer.isBuffer(audioContent) ? audioContent.toString('base64') : audioContent,
        },
        config: {
          encoding: options.encoding || 'LINEAR16',
          sampleRateHertz: options.sampleRateHertz || 16000,
          languageCode: options.languageCode || 'en-US',
          model: options.model || 'medical_conversation',
          enableAutomaticPunctuation: true,
          enableSpokenPunctuation: true,
          useEnhanced: true,
        },
      };

      const [response] = await this.speechClient.recognize(request);
      return {
        transcript: response.results
          .map(result => result.alternatives[0].transcript)
          .join('\n'),
        confidence: response.results[0]?.alternatives[0]?.confidence || 0,
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Process text with Google Natural Language API to extract medical entities
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Analyzed entities and categories
   */
  async analyzeText(text) {
    try {
      const document = {
        content: text,
        type: 'PLAIN_TEXT',
      };

      // Analyze entities in the text
      const [entityResult] = await this.languageClient.analyzeEntities({ document });
      
      // Analyze the overall document sentiment
      const [sentimentResult] = await this.languageClient.analyzeSentiment({ document });
      
      // Categorize the text
      const [classificationResult] = await this.languageClient.classifyText({ document });

      // Extract medical entities (symptoms, conditions, medications)
      const medicalEntities = entityResult.entities.filter(entity => 
        ['HEALTH_CONDITION', 'MEDICINE', 'CONSUMER_GOOD'].includes(entity.type)
      );

      return {
        entities: entityResult.entities,
        medicalEntities,
        sentiment: sentimentResult.documentSentiment,
        categories: classificationResult.categories,
        language: entityResult.language,
      };
    } catch (error) {
      console.error('Error analyzing text:', error);
      throw new Error(`Text analysis failed: ${error.message}`);
    }
  }

  /**
   * Get a working Gemini model
   * @returns {Promise<Object>} A working Gemini model
   */
  async getGeminiModel() {
    // If we already have a working model, return it
    if (this.generativeModel) {
      return this.generativeModel;
    }
    
    // Try each model in sequence until one works
    for (const modelName of this.geminiModels) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = this.vertexAI.getGenerativeModel({
          model: modelName,
          generationConfig: this.generationConfig,
        });
        
        // Test the model with a simple prompt
        const request = {
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Hello' }],
            },
          ],
        };
        
        await model.generateContent(request);
        
        // If we get here, the model works
        console.log(`Successfully connected to Gemini model: ${modelName}`);
        this.generativeModel = model;
        return model;
      } catch (error) {
        console.warn(`Failed to use Gemini model ${modelName}: ${error.message}`);
        // Continue to the next model
      }
    }
    
    // If we get here, none of the models worked
    console.error('Could not connect to any Gemini model');
    return null;
  }

  /**
   * Generate SOAP note from transcription using Vertex AI
   * @param {string} transcription - Transcribed text
   * @param {Object} options - Optional parameters (template, patient info, etc.)
   * @returns {Promise<Object>} Structured SOAP note
   */
  async generateSoapNote(transcription, options = {}) {
    try {
      console.log('Starting SOAP note generation with options:', JSON.stringify(options));
      
      // First, analyze the text with Natural Language API to extract entities
      console.log('Analyzing text with Natural Language API...');
      let analysis;
      try {
        analysis = await this.analyzeText(transcription);
        console.log('Text analysis successful');
      } catch (analysisError) {
        console.error('Error in text analysis step:', analysisError);
        throw new Error(`Text analysis failed: ${analysisError.message}`);
      }
      
      // Try to get a working Gemini model
      console.log('Getting Gemini model...');
      let model;
      try {
        model = await this.getGeminiModel();
        console.log('Successfully got Gemini model');
      } catch (modelError) {
        console.error('Error getting Gemini model:', modelError);
        throw new Error(`Failed to get Gemini model: ${modelError.message}`);
      }
      
      // If no model is available, fall back to basic analysis
      if (!model) {
        console.error('No Gemini model available after successful call');
        throw new Error('No Gemini model available');
      }
      
      // Create a prompt for Gemini to generate a SOAP note
      console.log('Creating prompt for Gemini...');
      const prompt = this.createSoapPrompt(transcription, analysis, options);
      
      // Call Gemini model to generate SOAP note using the updated API approach
      console.log('Calling Gemini model with prompt...');
      let result;
      try {
        const request = {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
        };
        
        result = await model.generateContent(request);
        console.log('Gemini model returned response successfully');
      } catch (geminiError) {
        console.error('Error calling Gemini API:', geminiError);
        throw new Error(`Gemini API call failed: ${geminiError.message}`);
      }
      
      const response = result.response;
      
      // Parse the response to extract structured SOAP note
      console.log('Parsing Gemini response...');
      let soapNote;
      try {
        soapNote = this.parseSoapResponse(
          response.candidates[0].content.parts[0].text, 
          transcription, 
          analysis
        );
        console.log('Successfully parsed SOAP response');
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
      }
      
      console.log('SOAP note generation complete with generatedBy:', soapNote.generatedBy);
      return soapNote;
    } catch (error) {
      console.error('Error generating SOAP note:', error);
      
      // Fallback to basic analysis if Vertex AI fails
      console.log('Falling back to basic analysis for SOAP note generation');
      let analysis;
      try {
        analysis = await this.analyzeText(transcription);
      } catch (fallbackError) {
        console.error('Even fallback analysis failed:', fallbackError);
        // Create an empty analysis object if everything fails
        analysis = {
          entities: [],
          medicalEntities: [],
          sentiment: {},
          categories: [{ name: 'Health', confidence: 0.5 }],
          language: 'en'
        };
      }
      
      // Create a basic SOAP structure
      return {
        subjective: transcription.substring(0, 300) + '...',
        objective: this.extractObjective(analysis),
        assessment: this.extractAssessment(analysis),
        plan: this.extractPlan(analysis),
        rawAnalysis: analysis,
        generatedBy: 'fallback',
      };
    }
  }
  
  /**
   * Create a prompt for Gemini to generate a SOAP note
   * @param {string} transcription - Transcribed text
   * @param {Object} analysis - Text analysis results
   * @param {Object} options - Optional parameters
   * @returns {string} Prompt for Gemini
   */
  createSoapPrompt(transcription, analysis, options = {}) {
    const { template = 'soap', patientInfo = {} } = options;
    
    // Extract patient info if available - ensure patientInfo is an object
    const safePatientInfo = patientInfo || {};
    const patientName = safePatientInfo.name || 'the patient';
    const patientAge = safePatientInfo.age || '';
    const patientGender = safePatientInfo.gender || '';
    const patientDob = safePatientInfo.dob || '';
    
    // Create patient context string
    const patientContext = patientName !== 'the patient' 
      ? `Patient: ${patientName}${patientAge ? `, Age: ${patientAge}` : ''}${patientGender ? `, Gender: ${patientGender}` : ''}${patientDob ? `, DOB: ${patientDob}` : ''}`
      : '';
    
    // Create a prompt based on the template
    let prompt = '';
    
    if (template === 'soap') {
      prompt = `
You are a medical professional assistant. Generate a comprehensive SOAP note based on the following medical dictation transcript.
${patientContext ? `\nPatient Information: ${patientContext}` : ''}

Medical Dictation Transcript:
"""
${transcription}
"""

Entities detected in the transcript:
${analysis.medicalEntities.map(entity => `- ${entity.name}: ${entity.type}`).join('\n')}

Please create a well-structured SOAP note with the following sections:
1. Subjective: Patient's history, complaints, and symptoms as described in their own words.
2. Objective: Physical examination findings, vital signs, and test results.
3. Assessment: Diagnosis or clinical impression based on subjective and objective data.
4. Plan: Treatment plan, medications, follow-up instructions, and referrals.

Format your response as a JSON object with the following structure:
{
  "subjective": "Detailed subjective information...",
  "objective": "Detailed objective information...",
  "assessment": "Detailed assessment...",
  "plan": "Detailed plan..."
}

Only include information that is explicitly stated or can be reasonably inferred from the transcript. Do not invent information. If certain sections lack sufficient information, note this in your response.
`;
    } else if (template === 'followup') {
      prompt = `
You are a medical professional assistant. Generate a concise follow-up note based on the following medical dictation transcript.
${patientContext ? `\nPatient Information: ${patientContext}` : ''}

Medical Dictation Transcript:
"""
${transcription}
"""

Entities detected in the transcript:
${analysis.medicalEntities.map(entity => `- ${entity.name}: ${entity.type}`).join('\n')}

Please create a well-structured follow-up note with the following sections:
1. Reason for Visit: Why the patient came in for follow-up.
2. Progress: How the patient has progressed since the last visit.
3. Current Status: Current symptoms, medication effectiveness, and any new issues.
4. Plan: Adjustments to treatment, medications, and next steps.

Format your response as a JSON object with the following structure:
{
  "reasonForVisit": "Detailed reason...",
  "progress": "Detailed progress information...",
  "currentStatus": "Detailed current status...",
  "plan": "Detailed plan..."
}

Only include information that is explicitly stated or can be reasonably inferred from the transcript. Do not invent information. If certain sections lack sufficient information, note this in your response.
`;
    } else {
      // Default to a general medical note
      prompt = `
You are a medical professional assistant. Generate a detailed medical note based on the following dictation transcript.
${patientContext ? `\nPatient Information: ${patientContext}` : ''}

Medical Dictation Transcript:
"""
${transcription}
"""

Entities detected in the transcript:
${analysis.medicalEntities.map(entity => `- ${entity.name}: ${entity.type}`).join('\n')}

Please create a well-structured medical note that captures all relevant clinical information from the transcript.

Format your response as a JSON object with the following structure:
{
  "summary": "Brief summary of the encounter...",
  "details": "Detailed clinical information...",
  "conclusions": "Clinical impressions and next steps..."
}

Only include information that is explicitly stated or can be reasonably inferred from the transcript. Do not invent information. If certain sections lack sufficient information, note this in your response.
`;
    }
    
    return prompt;
  }
  
  /**
   * Parse the response from Gemini to extract structured SOAP note
   * @param {string} responseText - Response text from Gemini
   * @param {string} transcription - Original transcription
   * @param {Object} analysis - Text analysis results
   * @returns {Object} Structured SOAP note
   */
  parseSoapResponse(responseText, transcription, analysis) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsedResponse = JSON.parse(jsonStr);
        
        // Add metadata to the response
        return {
          ...parsedResponse,
          rawTranscription: transcription,
          entities: analysis.medicalEntities,
          generatedBy: 'gemini',
          timestamp: new Date().toISOString()
        };
      } else {
        // If no JSON found, use the full text as a fallback
        console.warn('Could not extract JSON from Gemini response, using text fallback');
        
        // Try to identify sections in the text response
        const sections = this.extractSectionsFromText(responseText);
        
        return {
          ...sections,
          rawTranscription: transcription,
          entities: analysis.medicalEntities,
          generatedBy: 'gemini-text',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      
      // Fallback to basic structure
      return {
        subjective: transcription.substring(0, 300) + '...',
        objective: this.extractObjective(analysis),
        assessment: this.extractAssessment(analysis),
        plan: this.extractPlan(analysis),
        rawTranscription: transcription,
        entities: analysis.medicalEntities,
        generatedBy: 'fallback',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Extract sections from text response when JSON parsing fails
   * @param {string} text - Response text
   * @returns {Object} Extracted sections
   */
  extractSectionsFromText(text) {
    const sections = {};
    
    // Try to find SOAP sections
    const subjectiveMatch = text.match(/Subjective:?\s*([\s\S]*?)(?=Objective:|Assessment:|Plan:|$)/i);
    const objectiveMatch = text.match(/Objective:?\s*([\s\S]*?)(?=Subjective:|Assessment:|Plan:|$)/i);
    const assessmentMatch = text.match(/Assessment:?\s*([\s\S]*?)(?=Subjective:|Objective:|Plan:|$)/i);
    const planMatch = text.match(/Plan:?\s*([\s\S]*?)(?=Subjective:|Objective:|Assessment:|$)/i);
    
    if (subjectiveMatch) sections.subjective = subjectiveMatch[1].trim();
    if (objectiveMatch) sections.objective = objectiveMatch[1].trim();
    if (assessmentMatch) sections.assessment = assessmentMatch[1].trim();
    if (planMatch) sections.plan = planMatch[1].trim();
    
    // If no sections found, use the whole text as a note
    if (Object.keys(sections).length === 0) {
      sections.note = text.trim();
    }
    
    return sections;
  }

  /**
   * Save audio file temporarily for processing
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} fileExtension - File extension (e.g., 'wav', 'mp3')
   * @returns {Promise<string>} Path to saved file
   */
  async saveAudioFile(audioBuffer, fileExtension = 'wav') {
    const filename = `${uuidv4()}.${fileExtension}`;
    const filepath = path.join(this.tempDir, filename);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filepath, audioBuffer, (err) => {
        if (err) reject(err);
        else resolve(filepath);
      });
    });
  }

  /**
   * Clean up temporary audio files
   * @param {string} filepath - Path to file
   */
  cleanupAudioFile(filepath) {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  // Helper methods for SOAP note generation
  extractObjective(analysis) {
    // Extract objective findings from analysis
    const conditions = analysis.medicalEntities
      .filter(entity => entity.type === 'HEALTH_CONDITION')
      .map(entity => entity.name);
    
    return `Potential conditions identified: ${conditions.join(', ') || 'None identified'}`;
  }

  extractAssessment(analysis) {
    // Extract assessment from analysis
    return 'Assessment based on transcription analysis.'; // Placeholder
  }

  extractPlan(analysis) {
    // Extract plan from analysis
    const medications = analysis.medicalEntities
      .filter(entity => entity.type === 'MEDICINE' || entity.type === 'CONSUMER_GOOD')
      .map(entity => entity.name);
    
    return `Potential medications mentioned: ${medications.join(', ') || 'None identified'}`;
  }
}

module.exports = new GcpService();
