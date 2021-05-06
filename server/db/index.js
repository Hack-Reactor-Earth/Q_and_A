const cassandra = require('cassandra-driver')

const client = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'q_and_a',
});

client.connect(() => [
  console.log('app: cassandra connected')
])

// const dropKeySpace = `DROP KEYSPACE IF EXISTS q_and_a`

const createKeySpace = `CREATE KEYSPACE IF NOT EXISTS q_and_a WITH REPLICATION = {'class':'SimpleStrategy', 'replication_factor':3}`

  /** ****************************************************************************
  *                      Initial tables to load csv data into
  ***************************************************************************** */
const createQuestionsTable = `CREATE TABLE IF NOT EXISTS questions (
    id int,
    product_id int,
    body text,
    date_written date,
    asker_name text,
    asker_email text,
    reported boolean,
    helpful int,
    PRIMARY KEY(id, product_id, date_written)
    );`
const createAnswersTable = `CREATE TABLE IF NOT EXISTS answers (
    id int,
    question_id int,
    body text,
    date_written date,
    answerer_name text,
    answerer_email text,
    reported boolean,
    helpful int,
    PRIMARY KEY(question_id, id, date_written)
    );`
const createAnswersPhotosTable = `CREATE TABLE IF NOT EXISTS answers_photos (
    id int,
    answer_id int,
    url text,
    PRIMARY KEY(answer_id, id)
    );`

  /** ****************************************************************************
  *                      Defined user types
  ***************************************************************************** */
const createPhotoType = `CREATE TYPE IF NOT EXISTS  photo (
    id int,
    answer_id int,
    url text
);`

const createAnswerType = `CREATE TYPE IF NOT EXISTS  answer (
    id int,
    question_id int,
    body text,
    date_written date,
    answerer_name text,
    answerer_email text,
    reported boolean,
    helpful int,
    photos list<frozen<photo>>
  );`

  /** ****************************************************************************
  *                      Tables to merge and nest data
  ***************************************************************************** */
const createAnswersWithPhotosTable = `CREATE TABLE IF NOT EXISTS
answersWithPhotos (
    id int,
    question_id int,
    body text,
    date_written date,
    answerer_name text,
    answerer_email text,
    reported boolean,
    helpful int,
    photos list<frozen<photo>>,
    PRIMARY KEY(question_id, id, date_written, helpful)
);`

const createQuestionsWithAnswersTable = `CREATE TABLE IF NOT EXISTS questionsWithAnswers (
    id int,
    product_id int,
    body text,
    date_written date,
    asker_name text,
    asker_email text,
    reported boolean,
    helpful int,
    answers list<frozen<answer>>,
    PRIMARY KEY(product_id, id, date_written, helpful)
    );`

  /** ****************************************************************************
  *                      Queries
  ***************************************************************************** */
// * read
const allAnswers = `SELECT * FROM answers`
const allQuestions = `SELECT * FROM questions`
const answerPhotos = `SELECT * FROM answers_photos WHERE answer_id = ?`
const questionAnswers = `SELECT * FROM answersWithPhotos WHERE question_id = ?`
const getAllAnswersWithPhotos = `SELECT * FROM answersWithPhotos`
const getAllQuestionsWithAnswers = `SELECT * FROM questionsWithAnswers`
// * write
const insertAnswer = `INSERT INTO answersWithPhotos(
    id,
    question_id,
    body,
    date_written,
    answerer_name,
    answerer_email,
    reported,
    helpful,
    photos
   )
   VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`

const insertQuestion = `INSERT INTO questionsWithAnswers(
    id,
    product_id,
    body,
    date_written,
    asker_name,
    asker_email,
    reported,
    helpful,
    answers
    )
Values(?, ?, ?, ?, ?, ?, ?, ?, ?)`

const insertPhoto = `INSERT INTO answersWithPhotos(
  id,
  question_id,
  date_written,
  helpful,
  photos
)
VALUES(?, ?, ?, ?, ?)`


  /** ****************************************************************************
  *                      Helper functions to build new tables
  ***************************************************************************** */
const populateAPmix = async () => {
  try {
  const answers = await client.execute(allAnswers, []);

    Promise.all(
    // loop over each answer and for each answer
      answers.rows.map(async (answer) => {
      // get all photos for current answer
      const photos = await client.execute(answerPhotos, [answer.id], {prepare: true})
      // Insert all answer data into answersWithPhotos table with photos array
      await client.execute(insertAnswer, [
        answer.id,
        answer.question_id,
        answer.body,
        answer.date_written,
        answer.answerer_name,
        answer.answerer_email,
        answer.reported,
        answer.helpful,
        photos.rows
        ], {prepare: true})
    })
    )
  } catch (err) {
    console.log(err)
  }
}
const populateQAmix = async () => {
  try {
  const questions = await client.execute(allQuestions, []);
  console.log(questions.rows)
    Promise.all(
    // loop over each question and for each question
      questions.rows.map(async (question) => {
      // get all answers with photos for current answer
      const answers = await client.execute(questionAnswers, [question.id], {prepare: true})
      console.log(answers.rows)
      // Insert all answer data into questionsWithAnswers table with photos array
      await client.execute(insertQuestion, [
        question.id,
        question.product_id,
        question.body,
        question.date_written,
        question.asker_name,
        question.asker_email,
        question.reported,
        question.helpful,
        answers.rows
        ], {prepare: true})
    })
    )
  } catch (err) {
    console.log(err)
  }
}

  /** ****************************************************************************
  *                      Helpers to build the schema
  ***************************************************************************** */
const runSchema = async () => {
  try {
  // await client.execute(dropKeySpace, [])
  await client.execute(createKeySpace, []);
  await client.execute(createQuestionsTable, []);
  await client.execute(createAnswersTable, []);
  await client.execute(createAnswersPhotosTable, []);
  await client.execute(createPhotoType, []);
  await client.execute(createAnswerType, []);
  await client.execute(createAnswersWithPhotosTable, []);
  await client.execute(createQuestionsWithAnswersTable, []);
  } catch (err) {
    console.log(err)
  }
}

const buildCombinedTables = () => {
populateAPmix();
populateQAmix();
}


  /** ****************************************************************************
  *                      Run helpers
  ***************************************************************************** */
// runSchema();
buildCombinedTables();


module.exports = {client, getAllAnswersWithPhotos, getAllQuestionsWithAnswers}