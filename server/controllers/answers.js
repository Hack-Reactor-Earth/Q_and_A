const express = require('express');
const router = express.Router();
const answers = require('../models/answers.js');

router.get('/', async (req, res, next) => {
  try {
  await answers.getAllAnswers();
  res.status(200).json({message: 'hello from answers'});
  } catch (err) {
    console.log(err);
  }
})

module.exports = router;