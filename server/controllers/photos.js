const express = require('express');
const router = express.Router();
const photos = require('../models/photos.js');

router.get('/', async (req, res, next) => {
    await photos.getAllPhotos();
  res.status(200).json({message: 'hello from photos'});
})

module.exports = router;