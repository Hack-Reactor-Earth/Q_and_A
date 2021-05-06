const express = require('express');
const router = express.Router();
const questions = require('../models/questions.js');

router.get('/', async (req, res, next) => {
  try {
  await questions.getAllQuestions();
  res.status(200).json({message: 'hello from questions'});
  } catch (err) {
    console.log(err)
  }
})

module.exports = router;