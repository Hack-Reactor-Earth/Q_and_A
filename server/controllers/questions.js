const express = require('express');

const router = express.Router();
const questions = require('../models/questions.js');
const answers = require('../models/answers.js');

/** ****************************************************************************
  *                      Get questions by product id GET
  ***************************************************************************** */
router.get('/', async (req, res) => {
  // eslint-disable-next-line no-unused-vars
  try {
    const { product_id } = req.query;
    const page = req.query.page || 1;
    const count = req.query.count || 5;
    const pages = await questions.getQuestionsByProductId(product_id, count, page);
    res.status(200).json(pages);
  } catch (err) {
    res.status(500).json({ message: `Error processing request ${err}` });
    console.log(err);
  }
});

/** ****************************************************************************
  *                      Get answers by question id
  ***************************************************************************** */
router.get('/:question_id/answers', async (req, res) => {
  const { question_id } = req.params;
  const page = req.query.page || 1;
  const count = req.query.count || 5;
  try {
    const pages = await answers.getAnswersByQuestionId(question_id, page, count);
    res.status(200).json(pages);
  } catch (err) {
    res.status(500).json({ message: `Error processing request ${err}` });
    console.log(err);
  }
});

/** ****************************************************************************
  *                      Add a question POST
  ***************************************************************************** */

router.post('/', async (req, res) => {
  const {
    body, name, email, product_id,
  } = req.body;
  const question = {
    body, name, email, product_id,
  };
  try {
    const data = await questions.createQuestionByProductId(question);
    console.log(data);
    if (data) {
      res.sendStatus(201);
    } else {
      res.status(400).json({ message: 'Unable to add question' });
    }
  } catch (err) {
    res.status(500).json({ message: `Error processing request ${err}` });
    console.log(err);
  }
});

/** ****************************************************************************
  *                      Mark question as helpful PUT
  ***************************************************************************** */

/** ****************************************************************************
  *                      Report question PUT
  ***************************************************************************** */

module.exports = router;
