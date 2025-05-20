/**
 * Template Controller
 * Handles template management operations
 */

const gcpDatabaseService = require('../services/gcpDatabaseService');

class TemplateController {
  /**
   * Get all templates (system and user-specific)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTemplates(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      const { specialty, includeSystem = true } = req.query;
      
      const options = {
        specialty: specialty || null,
        includeSystem: includeSystem === 'true' || includeSystem === true,
        activeOnly: true
      };
      
      const templates = await gcpDatabaseService.getTemplates(userId, options);
      
      return res.status(200).json({
        data: templates,
        error: null
      });
    } catch (error) {
      console.error('Error getting templates:', error);
      return res.status(500).json({
        data: null,
        error: `Failed to get templates: ${error.message}`
      });
    }
  }

  /**
   * Get a template by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTemplateById(req, res) {
    try {
      const templateId = req.params.id;
      
      const template = await gcpDatabaseService.getTemplateById(templateId);
      
      return res.status(200).json({
        data: template,
        error: null
      });
    } catch (error) {
      console.error('Error getting template:', error);
      return res.status(404).json({
        data: null,
        error: `Template not found: ${error.message}`
      });
    }
  }

  /**
   * Create a custom template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTemplate(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      
      // Validate request
      if (!req.body.name || !req.body.specialty || !req.body.promptTemplate) {
        return res.status(400).json({
          data: null,
          error: 'Name, specialty, and promptTemplate are required'
        });
      }
      
      const templateData = {
        userId,
        name: req.body.name,
        description: req.body.description,
        specialty: req.body.specialty,
        promptTemplate: req.body.promptTemplate
      };
      
      const template = await gcpDatabaseService.createTemplate(templateData);
      
      return res.status(201).json({
        data: template,
        error: null
      });
    } catch (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({
        data: null,
        error: `Failed to create template: ${error.message}`
      });
    }
  }

  /**
   * Update a template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateTemplate(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      const templateId = req.params.id;
      
      // Validate request
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          data: null,
          error: 'No update data provided'
        });
      }
      
      const updateData = {};
      
      // Only allow specific fields to be updated
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.specialty) updateData.specialty = req.body.specialty;
      if (req.body.promptTemplate) updateData.prompt_template = req.body.promptTemplate;
      if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;
      
      const template = await gcpDatabaseService.updateTemplate(templateId, userId, updateData);
      
      return res.status(200).json({
        data: template,
        error: null
      });
    } catch (error) {
      console.error('Error updating template:', error);
      
      // Determine the appropriate status code
      const statusCode = error.message.includes('Cannot update system template') ? 403 : 
                         error.message.includes('not found') ? 404 : 500;
      
      return res.status(statusCode).json({
        data: null,
        error: `Failed to update template: ${error.message}`
      });
    }
  }

  /**
   * Delete a template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteTemplate(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      const templateId = req.params.id;
      
      const result = await gcpDatabaseService.deleteTemplate(templateId, userId);
      
      return res.status(200).json({
        data: result,
        error: null
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      
      // Determine the appropriate status code
      const statusCode = error.message.includes('Cannot delete system template') ? 403 : 
                         error.message.includes('not found') ? 404 : 500;
      
      return res.status(statusCode).json({
        data: null,
        error: `Failed to delete template: ${error.message}`
      });
    }
  }
}

module.exports = new TemplateController();
