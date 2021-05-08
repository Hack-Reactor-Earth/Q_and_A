const express = require('express');

const router = express.Router();
const answers = require('../models/answers.js');

/** ****************************************************************************
  *                      Mark answer as helpful PUT
  ***************************************************************************** */

router.put('/:answer_id/helpful', async (req, res) => {
  const { answer_id } = req.params;
  try {
    const update = await answers.markAnswerAsHelpful(answer_id);
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
  *                      Report answer PUT
  ***************************************************************************** */

router.put('/:answer_id/report', async (req, res) => {
  const { answer_id } = req.params;
  try {
    const update = await answers.reportAnswer(answer_id);
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
