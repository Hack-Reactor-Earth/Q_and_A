const db = require('../db/index');

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */

const questionsByProductId = `
SELECT question_id, question_body, question_date, asker_name, question_helpfulness, reported, answers FROM questionsWithAnswers
WHERE product_id = ? AND reported = ? ALLOW FILTERING`;

const getLastQuestionId = `
SELECT MAX(question_id) from question_ids
`;

const addQuestionId = `INSERT INTO question_ids(
  question_id
)
VALUES(?)`;

const createQuestion = `INSERT INTO questionsWithAnswers(
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
  *                      Models
  ***************************************************************************** */

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
  const questionId = id.rows[0]['system.max(question_id)'];
  console.log(questionId);
  const data = await db.execute(createQuestion, [
    questionId + 1,
    question.product_id,
    question.body,
    new Date(),
    question.name,
    question.email,
    false,
    0,
    null,
  ], { prepare: true });
  await db.execute(addQuestionId, [questionId + 1], {prepare: true});
  return data;
};

module.exports = {
  getQuestionsByProductId,
  createQuestionByProductId,
};
