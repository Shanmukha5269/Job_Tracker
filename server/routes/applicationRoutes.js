const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.post('/', applicationController.createApplication);
router.get('/user/:userId', applicationController.getApplicationsByUser);
router.get('/:id', applicationController.getApplicationById);
router.put('/:id', applicationController.updateApplication);
router.delete('/:id', applicationController.deleteApplication);
router.post('/:id/contacts', applicationController.linkContactToApplication);

module.exports = router;
