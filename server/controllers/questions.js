const express = require('express');
const router = express.Router();
const questions = require('../models/questions.js');

router.get('/', async (req, res, next) => {
  await questions.getAllQuestions();
  res.status(200).json({message: 'hello from questions'});
})

module.exports = router;