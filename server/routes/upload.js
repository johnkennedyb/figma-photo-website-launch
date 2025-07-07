const express = require('express');
const router = express.Router();

// @route   POST api/upload
// @desc    Placeholder for file upload
// @access  Private
router.post('/', (req, res) => {
  res.status(501).json({ msg: 'Upload functionality not yet implemented.' });
});

module.exports = router;
