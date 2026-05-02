const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');

router.get('/', partnerController.getPartners);
router.post('/', partnerController.createPartner);
router.delete('/:id', partnerController.deletePartner);

module.exports = router;