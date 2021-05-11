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
  id bigint,
  answer_id bigint,
  url text
  );`;

const createAnswerType = `
  CREATE TYPE IF NOT EXISTS  answer (
  id bigint,
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
  answer_id bigint,
  question_id bigint,
  body text,
  date date,
  answerer_name text,
  answerer_email text,
  reported boolean,
  helpfulness int,
  photos list<frozen<photo>>,
  PRIMARY KEY(question_id, answer_id, date)
  );`;

const createReportedAnswersTable = `
  CREATE TABLE IF NOT EXISTS
  reported_answers (
  answer_id bigint,
  question_id bigint,
  body text,
  date date,
  answerer_name text,
  answerer_email text,
  reported boolean,
  helpfulness int,
  photos list<frozen<photo>>,
  PRIMARY KEY(question_id, answer_id, date)
  );
`;

const createAnswersIdIndex = `
  CREATE INDEX IF NOT EXISTS answer_idx
  ON answers (answer_id)
  `;

const createQuestionsWithAnswersTable = `
  CREATE TABLE IF NOT EXISTS questions (
  question_id bigint,
  product_id bigint,
  question_body text,
  question_date date,
  asker_name text,
  asker_email text,
  reported boolean,
  question_helpfulness int,
  answers map<int, frozen<answer>>,
  PRIMARY KEY(product_id, question_id, question_date)
  );`;

const createReportedQuestionsTable = `
  CREATE TABLE IF NOT EXISTS reported_questions (
  question_id bigint,
  product_id bigint,
  question_body text,
  question_date date,
  asker_name text,
  asker_email text,
  reported boolean,
  question_helpfulness int,
  answers map<int, frozen<answer>>,
  PRIMARY KEY(product_id, question_id, question_date)
  );`;

const createQuestionsIdIndex = `
  CREATE INDEX IF NOT EXISTS question_idx
  ON questions (question_id)
  `;

/** ****************************************************************************
  *                      Helper counter table
  ***************************************************************************** */
const createCountersTable = `
  CREATE TABLE IF NOT EXISTS id_counters (
  table_name text,
  last_id counter,
  PRIMARY KEY(table_name)
);`;

const initializePhotoCounter = `
  UPDATE id_counters
  SET last_id = last_id + 1
  WHERE table_name = 'photos'
`;

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
  WHERE question_id = ?`;

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

const updateCounter = `
  UPDATE id_counters
  SET last_id = last_id + 1
  WHERE table_name = ?`;

module.exports = {
  initializePhotoCounter,
  updateCounter,
  insertQuestion,
  insertAnswer,
  questionAnswers,
  answerPhotos,
  allQuestions,
  allAnswers,
  createCountersTable,
  createQuestionsIdIndex,
  createReportedQuestionsTable,
  createQuestionsWithAnswersTable,
  createAnswersIdIndex,
  createReportedAnswersTable,
  createAnswersWithPhotosTable,
  createAnswerType,
  createPhotoType,
  createAnswersPhotosTable,
  createAnswersTable,
  createQuestionsTable,
  createKeySpace,
  dropKeySpace,
};
