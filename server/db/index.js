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

const dropKeySpace = `
  DROP KEYSPACE IF EXISTS q_and_a`;

const createKeySpace = `
  CREATE KEYSPACE IF NOT EXISTS q_and_a
  WITH REPLICATION = {'class':'SimpleStrategy', 'replication_factor':3}`;

/** ****************************************************************************
  *                      Initial tables to load csv data into
  ***************************************************************************** */
const createQuestionsTable = `
  CREATE TABLE IF NOT EXISTS old_questions (
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
const createAnswersTable = `
  CREATE TABLE IF NOT EXISTS old_answers (
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
const createAnswersPhotosTable = `
  CREATE TABLE IF NOT EXISTS answers_photos (
  id int,
  answer_id int,
  url text,
  PRIMARY KEY(answer_id, id)
  );`;

/** ****************************************************************************
  *                      Defined user types
  ***************************************************************************** */
const createPhotoType = `
  CREATE TYPE IF NOT EXISTS  photo (
  id int,
  answer_id int,
  url text
  );`;

const createAnswerType = `
  CREATE TYPE IF NOT EXISTS  answer (
  id int,
  body text,
  date date,
  answerer_name text,
  reported boolean,
  helpfulness int,
  photos list<frozen<photo>>
  );`;

/** ****************************************************************************
  *                      Tables to merge and nest data
  ***************************************************************************** */
const createAnswersWithPhotosTable = `
  CREATE TABLE IF NOT EXISTS
  answers (
  answer_id int,
  question_id int,
  body text,
  date date,
  answerer_name text,
  answerer_email text,
  reported boolean,
  helpfulness int,
  photos list<frozen<photo>>,
  PRIMARY KEY((question_id, reported), answer_id, date, helpfulness)
  );`;

const createQuestionsWithAnswersTable = `
  CREATE TABLE IF NOT EXISTS questions (
  question_id int,
  product_id int,
  question_body text,
  question_date date,
  asker_name text,
  asker_email text,
  reported boolean,
  question_helpfulness int,
  answers map<int, frozen<answer>>,
  PRIMARY KEY((product_id, reported), question_id, question_date, question_helpfulness)
  );`;

const createQuestionsIdIndex = `
  CREATE INDEX question_idx
  ON questions (question_id)
  `;

/** ****************************************************************************
  *                      Helper tables
  ***************************************************************************** */
const createCountersTable = `
  CREATE TABLE IF NOT EXISTS id_counters (
  table_name text,
  last_id counter,
  PRIMARY KEY(table_name)
);`;

const createProductByQuestionsIdTable = `
  CREATE TABLE IF NOT EXISTS questions_product_ids (
  question_id int,
  product_id int,
  PRIMARY KEY(question_id)
);`;

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */
// * read
const allAnswers = `
  SELECT * FROM old_answers`;

const allQuestions = `
  SELECT * FROM old_questions`;

const answerPhotos = `
  SELECT * FROM answers_photos
  WHERE answer_id = ?`;

const questionAnswers = `
  SELECT * FROM answers
  WHERE question_id = ? AND reported = false`;

// * write
const insertAnswer = `
  INSERT INTO answers(
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

const insertQuestion = `
  INSERT INTO questions(
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

const insertProdIdByQid = `
  INSERT INTO questions_product_ids (
  question_id,
  product_id
)
Values(?, ?)`;

const updateCounter = `
  UPDATE id_counters
  SET last_id = last_id + 1
  WHERE table_name = ?`;

/** ****************************************************************************
  *                      Helper functions to build new tables
  ***************************************************************************** */
const options = { prepare: true, fetchSize: 100, autoPage: true };
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
          answerPhotos, [answer.id], options,
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
        ], options);
        await client.execute(updateCounter, ['answers'], options);
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
      options, async (n, question) => {
        if (n === 99) {
          hundreds++;
        }
        console.log({ questionHundreds: hundreds });
        try {
          const answers = await client.execute(
            questionAnswers, [question.id], options,
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
          ], options);
          await client.execute(updateCounter, ['questions'], options);
          await client.execute(insertProdIdByQid, [question.id, question.product_id], options);
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
    await client.execute(createAnswersWithPhotosTable, []);
    await client.execute(createQuestionsWithAnswersTable, []);
    await client.execute(createQuestionsIdIndex, []);
    await client.execute(createCountersTable, []);
    await client.execute(createProductByQuestionsIdTable, []);
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

module.exports = client;
