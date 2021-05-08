const db = require('../db/index');

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */

const questionsByProductId = `
SELECT question_id, question_body, question_date, asker_name, question_helpfulness, reported, answers
FROM questions
WHERE product_id = ?
AND reported = ?`;

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

const getQuestion = `
SELECT * FROM questions
WHERE question_id = ?`;

const markHelpful = `
UPDATE questions
SET question_helpfulness = ?
WHERE question_id = ?
AND product_id = ?
AND question_date = ?
AND reported = false
`;

/** ****************************************************************************
  *                      Models
  ***************************************************************************** */

const markQuestionAsHelpful = async (question_id) => {
  try {
    const question = await db.execute(getQuestion, [question_id], { prepare: true });
    const newCount = 1
     + parseInt(question.rows[0].question_helpfulness);
    console.log(newCount);
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

const getQuestionsByProductId = async (id, count, page) => {
  try {
    let pageCount = parseInt(page);
    const questions = await db.execute(
      questionsByProductId, [id, false], { prepare: true, fetchSize: count * page, autoPage: true },
    );
    let start = 0;
    let stop = count;
    const pages = [];
    let curPage = [];
    while (pageCount > 0) {
      curPage.push(questions.rows.slice(start, stop));
      start += parseInt(count);
      stop = parseInt(count) + stop;
      pages.push(curPage[0]);
      curPage = [];
      pageCount--;
    }
    const result = {
      product_id: id,
      results: pages,
    };
    return result;
  } catch (err) {
    console.log(err);
  }
};

const createQuestionByProductId = async (question) => {
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
};
