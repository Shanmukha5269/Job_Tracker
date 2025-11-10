const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Contact routes
router.post('/', contactController.createContact);
router.get('/', contactController.getAllContacts);
router.get('/jobseeker', contactController.getContactsForJobSeeker); 
router.get('/company/:companyId', contactController.getContactsByCompany);
router.get('/:id', contactController.getContactById);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
