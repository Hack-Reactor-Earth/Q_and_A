const db = require('../db/index');

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */

const questionsByProductId = `
SELECT question_id, question_body, question_date, asker_name, question_helpfulness, reported, answers
FROM questions
WHERE product_id = ?`;

const getLastQuestionId = `
SELECT last_id FROM id_counters
WHERE table_name = 'questions'
`;

const addQuestionId = `
UPDATE id_counters
SET last_id = last_id + 1
WHERE table_name = 'questions'`;

const createQuestion = `
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

const createReport = `
INSERT INTO reported_questions(
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

const deleteReported = `
DELETE FROM questions
WHERE question_id = ?
AND product_id = ?
AND question_date = ?
`;

const getQuestion = `
SELECT * FROM questions
WHERE question_id = ?`;

const markHelpful = `
UPDATE questions
SET question_helpfulness = ?
WHERE question_id = ?
AND product_id = ?
AND question_date = ?
`;

/** ****************************************************************************
  *                      Models
  ***************************************************************************** */

const reportQuestion = async (question_id) => {
  try {
    const question = await db.execute(getQuestion, [question_id], { prepare: true });
    const q = question.rows[0];
    const result = await db.execute(createReport, [
      q.question_id,
      q.product_id,
      q.question_body,
      q.question_date,
      q.asker_name,
      q.asker_email,
      true,
      q.question_helpfulness,
      q.answers,
    ], { prepare: true });
    let deleteResult;
    if (result) {
      deleteResult = await db.execute(deleteReported, [
        question_id,
        q.product_id,
        q.question_date,
      ], { prepare: true });
    }
    return deleteResult;
  } catch (err) {
    console.log(err);
  }
};

const markQuestionAsHelpful = async (question_id) => {
  try {
    const question = await db.execute(getQuestion, [question_id], { prepare: true });
    const newCount = 1
     + parseInt(question.rows[0].question_helpfulness);
    const result = await db.execute(markHelpful, [
      newCount,
      question_id,
      question.rows[0].product_id,
      question.rows[0].question_date,
    ], { prepare: true });
    return result;
  } catch (err) {
    console.log(err);
  }
};

const getQuestionsByProductId = async (id, count) => {
  try {
    // let pageCount = parseInt(page);
    const questions = await db.execute(
      questionsByProductId, [id], { prepare: true, fetchSize: count, autoPage: true },
    );
    // let start = 0;
    // let stop = count;
    // const pages = [];
    // let curPage = [];
    // while (pageCount > 0) {
    //   curPage.push(questions.rows.slice(start, stop));
    //   start += parseInt(count);
    //   stop = parseInt(count) + stop;
    //   pages.push(curPage[0]);
    //   curPage = [];
    //   pageCount--;
    // }
    const result = {
      product_id: id,
      results: questions.rows,
    };
    return result;
  } catch (err) {
    console.log(err);
  }
};

const createQuestionByProductId = async (question) => {
  const validQuestion = await db.execute(getQuestion, [question.product_id], { prepare: true });
  if (validQuestion.rowLength === 0) {
    return null;
  }
  const id = await db.execute(getLastQuestionId, [], { prepare: true });
  const questionId = id.rows[0].last_id;
  const data = await db.execute(createQuestion, [
    questionId,
    question.product_id,
    question.body,
    new Date(),
    question.name,
    question.email,
    false,
    0,
    null,
  ], { prepare: true });
  await db.execute(addQuestionId, [], { prepare: true });
  return data;
};

module.exports = {
  getQuestionsByProductId,
  createQuestionByProductId,
  markQuestionAsHelpful,
  reportQuestion,
};
