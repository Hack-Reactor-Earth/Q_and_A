// import db etc.
const db = require('../db/index');

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */

const questionsByProductId = `
SELECT question_id, question_body, question_date, asker_name, question_helpfulness, reported, answers FROM questionsWithAnswers
WHERE product_id = ? AND reported = ? ALLOW FILTERING`;

/** ****************************************************************************
  *                      Models
  ***************************************************************************** */

const getQuestionsByProductId = async (id, count, page) => {
  try {
    let pageCount = parseInt(page);
    const questions = await db.client.execute(
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

module.exports = {
  getQuestionsByProductId,
};
