const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Education Routes
router.get('/education', profileController.getAllEducation);
router.post('/education', profileController.createEducation);
router.get('/education/:id', profileController.getEducationById);
router.put('/education/:id', profileController.updateEducation);
router.delete('/education/:id', profileController.deleteEducation);

// Skills Routes
router.get('/skills', profileController.getAllSkills);
router.post('/skills', profileController.createSkill);
router.delete('/skills/:id', profileController.deleteSkill);

// Certifications Routes
router.get('/certifications', profileController.getAllCertifications);
router.post('/certifications', profileController.createCertification);
router.get('/certifications/:id', profileController.getCertificationById);
router.put('/certifications/:id', profileController.updateCertification);
router.delete('/certifications/:id', profileController.deleteCertification);

// Languages Routes
router.get('/languages', profileController.getAllLanguages);
router.post('/languages', profileController.createLanguage);
router.get('/languages/:id', profileController.getLanguageById);
router.put('/languages/:id', profileController.updateLanguage);
router.delete('/languages/:id', profileController.deleteLanguage);

module.exports = router;
