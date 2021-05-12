const express = require('express');
const NodeCache = require('node-cache');

const router = express.Router();
const questions = require('../models/questions.js');
const answers = require('../models/answers.js');

const cache = new NodeCache({ maxKeys: 100 });
/** ****************************************************************************
  *                      Get questions by product id GET
  ***************************************************************************** */
router.get('/', async (req, res) => {
  const cacheKey = req.url;
  if (cache.has(cacheKey)) {
    res.status(200).send(cache.get(cacheKey));
  } else {
    try {
      const { product_id } = req.query;
      const page = req.query.page || 1;
      const count = req.query.count || 5;
      const pages = await questions.getQuestionsByProductId(product_id, count, page);
      if (pages.results.length > 0) {
        res.status(200).json(pages);
      } else {
        res.status(400).json({ message: 'Error retrieving questions' });
      }
    } catch (err) {
      res.status(500).json({ message: `Error processing request ${err}` });
      console.log(err);
    }
  }
});

/** ****************************************************************************
  *                      Get answers by question id
  ***************************************************************************** */
router.get('/:question_id/answers', async (req, res) => {
  const cacheKey = req.url;
  if (cache.has(cacheKey)) {
    res.status(200).send(cache.get(cacheKey));
  } else {
    const { question_id } = req.params;
    const page = req.query.page || 1;
    const count = req.query.count || 5;
    try {
      const pages = await answers.getAnswersByQuestionId(question_id, page, count);
      console.log(pages.results.length);
      if (pages.results.length > 0) {
        res.status(200).json(pages);
      } else {
        res.status(400).json({ message: 'Error retrieving answers' });
      }
    } catch (err) {
      res.status(500).json({ message: `Error processing request ${err}` });
      console.log(err);
    }
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
  *                      Add an answer POST
  ***************************************************************************** */

router.post('/:question_id/answers', async (req, res) => {
  const {
    body, name, email, photos,
  } = req.body;
  const { question_id } = req.params;
  const answer = {
    body, name, email, photos, question_id,
  };
  try {
    const data = await answers.createAnswerByProductId(answer);
    if (data) {
      res.sendStatus(201);
    } else {
      res.status(400).json({ message: 'Unable to add answer' });
    }
  } catch (err) {
    res.status(500).json({ message: `Error processing request ${err}` });
    console.log(err);
  }
});

/** ****************************************************************************
  *                      Mark question as helpful PUT
  ***************************************************************************** */

router.put('/:question_id/helpful', async (req, res) => {
  const { question_id } = req.params;
  try {
    const update = await questions.markQuestionAsHelpful(question_id);
    if (update) {
      res.sendStatus(204);
    } else {
      res.status(400).json({ message: 'Error updating' });
    }
  } catch (err) {
    res.status(500).json({ message: `Error processing request ${err}` });
    console.log(err);
  }
});

/** ****************************************************************************
  *                      Report question PUT
  ***************************************************************************** */

router.put('/:question_id/report', async (req, res) => {
  const { question_id } = req.params;
  try {
    const update = await questions.reportQuestion(question_id);
    if (update) {
      res.sendStatus(204);
    } else {
      res.status(400).json({ message: 'Error updating' });
    }
  } catch (err) {
    res.status(500).json({ message: `Error processing request ${err}` });
    console.log(err);
  }
});

module.exports = router;
