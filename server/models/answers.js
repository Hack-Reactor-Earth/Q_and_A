const db = require('../db/index');

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */

const answersByQuestionId = `
SELECT answer_id, body, date, answerer_name, helpfulness, photos FROM answersWithPhotos
WHERE question_id = ? AND reported = ? ALLOW FILTERING`;

/** ****************************************************************************
  *                      Models
  ***************************************************************************** */

const getAnswersByQuestionId = async (id, page, count) => {
  try {
    let pageCount = parseInt(page);
    const answers = await db.client.execute(
      answersByQuestionId, [id, false], { prepare: true, fetchSize: count * page, autoPage: true },
    );
    let start = 0;
    let stop = count;
    const pages = [];
    let curPage = [];
    while (pageCount > 0) {
      curPage.push(answers.rows.slice(start, stop));
      start += parseInt(count);
      stop = parseInt(count) + stop;
      pages.push(curPage[0]);
      curPage = [];
      pageCount--;
    }
    const result = {
      question: id,
      page,
      count,
      results: pages,
    };
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getAnswersByQuestionId,
};
