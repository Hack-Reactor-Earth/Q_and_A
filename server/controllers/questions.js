const express = require('express');
const router = express.Router();
const questions = require('../models/questions.js');

  /** ****************************************************************************
  *                      Get questions by product id GET
  ***************************************************************************** */
router.get('/', async (req, res, next) => {
  try {
  await questions.getAllQuestions();
  res.status(200).json({message: 'hello from questions'});
  } catch (err) {
    console.log(err)
  }
})

  /** ****************************************************************************
  *                      Mark question as helpful PUT
  ***************************************************************************** */


  /** ****************************************************************************
  *                      Report question PUT
  ***************************************************************************** */


  /** ****************************************************************************
  *                      Add a question POST
  ***************************************************************************** */

module.exports = router;
