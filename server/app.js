const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const db = require('./db/index')
// routers
const questions = require('./controllers/questions');
const answers = require('./controllers/answers');
const photos = require('./controllers/photos');

const port = 5000;

const app = express();

app.use(express.json());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

  /** ****************************************************************************
  *                      Use routes
  ***************************************************************************** */

app.use('/api/questions', questions);
app.use('/api/answers', answers);
app.use('/api/photos', photos);

app.get('/', async (req, res) => {
  try {
    const answers = await db.client.execute(db.getAllAnswersWithPhotos, [])
  res.status(200).json(answers.rows)
  } catch(err) {
    console.log(err)
  }
})

app.listen(port, () => {
  console.log(`listening on port ${port}`);
})

module.exports = app;