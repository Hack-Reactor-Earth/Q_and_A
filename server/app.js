const express = require('express');
require('dotenv').config();
const logger = require('morgan');
const bodyParser = require('body-parser');
// eslint-disable-next-line no-unused-vars
const db = require('./db/index');
// routers
const questions = require('./controllers/questions');
const answers = require('./controllers/answers');

const port = 5000;

const app = express();

app.use(express.json());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/** ****************************************************************************
  *                      Use routes
  ***************************************************************************** */

app.use('/qa/questions', questions);
app.use('/qa/answers', answers);

app.get('/', async (req, res) => {
  try {
    res.status(200).json({ message: 'Hello from Q&A service' });
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

module.exports = app;
