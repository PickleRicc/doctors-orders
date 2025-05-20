/**
 * Template Routes
 * Routes for template management
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all templates
router.get('/', templateController.getTemplates);

// Get a template by ID
router.get('/:id', templateController.getTemplateById);

// Create a new template
router.post('/', templateController.createTemplate);

// Update a template
router.put('/:id', templateController.updateTemplate);

// Delete a template
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
