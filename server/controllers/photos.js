const express = require('express');
const router = express.Router();
const photos = require('../models/photos.js');

router.get('/', async (req, res, next) => {
  try {
    await photos.getAllPhotos();
    res.status(200).json({message: 'hello from photos'});
  } catch (err) {
    console.log(err);
  }
})

module.exports = router;