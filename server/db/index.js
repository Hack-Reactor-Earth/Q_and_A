const cassandra = require('cassandra-driver');

const { distance } = cassandra.types;

const client = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  pooling: {
    coreConnectionsPerHost: {
      [distance.local]: 8,
      [distance.remote]: 8,
    },
    maxRequestsPerConnection: {
      [distance.local]: 8,
      [distance.remote]: 8,
    },
  },
  keyspace: 'q_and_a',
});

client.connect(() => [
  console.log('app: cassandra connected'),
]);

const dropKeySpace = 'DROP KEYSPACE IF EXISTS q_and_a';

const createKeySpace = 'CREATE KEYSPACE IF NOT EXISTS q_and_a WITH REPLICATION = {\'class\':\'SimpleStrategy\', \'replication_factor\':3}';

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
    );`;
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
    );`;
const createAnswersPhotosTable = `CREATE TABLE IF NOT EXISTS answers_photos (
    id int,
    answer_id int,
    url text,
    PRIMARY KEY(answer_id, id)
    );`;

/** ****************************************************************************
  *                      Defined user types
  ***************************************************************************** */
const createPhotoType = `CREATE TYPE IF NOT EXISTS  photo (
    id int,
    answer_id int,
    url text
);`;

const createAnswerType = `CREATE TYPE IF NOT EXISTS  answer (
    id int,
    body text,
    date date,
    answerer_name text,
    reported boolean,
    helpfulness int,
    photos list<frozen<photo>>
  );`;

const createAnswerObjectType = `CREATE TYPE IF NOT EXISTS answerObject (
  id frozen<answer>
);`;

/** ****************************************************************************
  *                      Tables to merge and nest data
  ***************************************************************************** */
const createAnswersWithPhotosTable = `CREATE TABLE IF NOT EXISTS
answersWithPhotos (
    answer_id int,
    question_id int,
    body text,
    date date,
    answerer_name text,
    answerer_email text,
    reported boolean,
    helpfulness int,
    photos list<frozen<photo>>,
    PRIMARY KEY(question_id, answer_id, date, helpfulness)
);`;

const createQuestionsWithAnswersTable = `CREATE TABLE IF NOT EXISTS questionsWithAnswers (
    question_id int,
    product_id int,
    question_body text,
    question_date date,
    asker_name text,
    asker_email text,
    reported boolean,
    question_helpfulness int,
    answers map<int, frozen<answer>>,
    PRIMARY KEY(product_id, question_id, question_date, question_helpfulness)
    );`;

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */
// * read
const allAnswers = 'SELECT * FROM answers';
const allQuestions = 'SELECT * FROM questions';
const answerPhotos = 'SELECT * FROM answers_photos WHERE answer_id = ?';
const questionAnswers = 'SELECT * FROM answersWithPhotos WHERE question_id = ?';
const getAllAnswersWithPhotos = 'SELECT * FROM answersWithPhotos';
const getAllQuestionsWithAnswers = 'SELECT * FROM questionsWithAnswers';
// * write
const insertAnswer = `INSERT INTO answersWithPhotos(
    answer_id,
    question_id,
    body,
    date,
    answerer_name,
    answerer_email,
    reported,
    helpfulness,
    photos
   )
   VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const insertQuestion = `INSERT INTO questionsWithAnswers(
    question_id,
    product_id,
    question_body,
    question_date,
    asker_name,
    asker_email,
    reported,
    question_helpfulness,
    answers
    )
Values(?, ?, ?, ?, ?, ?, ?, ?, ?)`;

/** ****************************************************************************
  *                      Helper functions to build new tables
  ***************************************************************************** */
const populateAPmix = async () => {
  try {
    let hundreds = 0;
    await client.eachRow(allAnswers, [], {
      prepare: true, autoPage: true, fetchSize: 100,
    }, async (n, answer) => {
      if (n === 99) {
        hundreds++;
      }
      console.log({ answerHundreds: hundreds });
      try {
        const photos = await client.execute(
          answerPhotos, [answer.id], { prepare: true, autoPage: true, fetchSize: 100 },
        );
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
          photos.rows,
        ], { prepare: true, autoPage: true });
      } catch (err) {
        console.log(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
};
const populateQAmix = async () => {
  try {
    let hundreds = 0;
    await client.eachRow(allQuestions, [],
      { prepare: true, autoPage: true, fetchSize: 100 }, async (n, question) => {
        if (n === 99) {
          hundreds++;
        }
        console.log({ answerHundreds: hundreds });
        try {
          const answers = await client.execute(
            questionAnswers, [question.id], { prepare: true, fetchSize: 100, autoPage: true },
          );
          const answersObj = {};
          // create the object of answers for each insert
          answers.rows.forEach(async (a) => {
            answersObj[a.answer_id] = {
              id: a.answer_id,
              body: a.body,
              date: a.date.date,
              answerer_name: a.answerer_name,
              helpfulness: a.helpfulness,
              photos: a.photos,
            };
          });
          await client.execute(insertQuestion, [
            question.id,
            question.product_id,
            question.body,
            question.date_written.date,
            question.asker_name,
            question.asker_email,
            question.reported,
            question.helpful,
            answersObj,
          ], { prepare: true, autoPage: true });
        } catch (err) {
          console.log(err);
        }
      });
  } catch (err) {
    console.log(err);
  }
};

/** ****************************************************************************
  *                      Helpers to build the schema
  ***************************************************************************** */
// eslint-disable-next-line no-unused-vars
const runSchema = async () => {
  try {
    await client.execute(dropKeySpace, []);
    await client.execute(createKeySpace, []);
    await client.execute(createQuestionsTable, []);
    await client.execute(createAnswersTable, []);
    await client.execute(createAnswersPhotosTable, []);
    await client.execute(createPhotoType, []);
    await client.execute(createAnswerType, []);
    await client.execute(createAnswerObjectType, []);
    await client.execute(createAnswersWithPhotosTable, []);
    await client.execute(createQuestionsWithAnswersTable, []);
  } catch (err) {
    console.log(err);
  }
};

// eslint-disable-next-line no-unused-vars
const buildCombinedTables = async () => {
  await populateAPmix();
  await populateQAmix();
};

/** ****************************************************************************
  *                      Run helpers
  ***************************************************************************** */
// runSchema();
// buildCombinedTables();

module.exports = { client, getAllAnswersWithPhotos, getAllQuestionsWithAnswers };
