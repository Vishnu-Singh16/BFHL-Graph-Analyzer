const express = require('express');
const router = express.Router();
const { handlePost } = require('../controllers/bfhlController');

router.post('/bfhl', handlePost);

module.exports = router;
