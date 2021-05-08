const db = require('../db/index');

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */

const answersByQuestionId = `
SELECT answer_id, body, date, answerer_name, helpfulness, photos
FROM answers
WHERE question_id = ?`;

const getLastAnswerId = `
SELECT last_id FROM id_counters
WHERE table_name = 'answers'
`;
const addAnswerId = `
UPDATE id_counters
SET last_id = last_id + 1
WHERE table_name = 'answers'`;

const getLastPhotoId = `
SELECT last_id FROM id_counters
WHERE table_name = 'photos'
`;
const addPhotoId = `
UPDATE id_counters
SET last_id = last_id + 1
WHERE table_name = 'photos'`;

const createPhoto = `
INSERT INTO answers_photos(
  id,
  answer_id,
  url
)
VALUES(?, ?, ?)`;

const createAnswer = `
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

const getAnswersPhotos = `
SELECT * FROM answers_photos
WHERE answer_id = ?`;

const getQuestionAnswers = `
SELECT * FROM answers
WHERE question_id = ?`;

const getQuestion = `
SELECT * FROM questions
WHERE question_id = ?`;

const updateQuestion = `
UPDATE questions
SET answers = ?
WHERE question_id = ?
AND product_id = ?
AND question_date = ?
`;

const getAnswer = `
SELECT * FROM answers
WHERE answer_id = ?;
`;

const markHelpful = `
UPDATE answers
SET helpfulness = ?
WHERE answer_id = ?
AND question_id = ?
AND date = ?
`;

// const updateQuestion = ``

/** ****************************************************************************
  *                      Models
  ***************************************************************************** */

const markAnswerAsHelpful = async (answer_id) => {
  try {
    const answer = await db.execute(getAnswer, [answer_id], { prepare: true });
    const newCount = 1
     + parseInt(answer.rows[0].helpfulness);
    await db.execute(markHelpful, [
      newCount,
      answer_id,
      answer.rows[0].question_id,
      answer.rows[0].date,
    ], { prepare: true });
    // update the question
    const answers = await db.execute(
      getQuestionAnswers, [answer.rows[0].question_id], { prepare: true },
    );
    // return data;
    const answersObj = {};
    // create the object of answers
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
    const question = await db.execute(getQuestion, [answer.rows[0].question_id], { prepare: true });
    const result = await db.execute(updateQuestion, [
      answersObj,
      answer.rows[0].question_id,
      question.rows[0].product_id,
      question.rows[0].question_date,
    ], { prepare: true });

    return result;
  } catch (err) {
    console.log(err);
  }
};

const getAnswersByQuestionId = async (id, page, count) => {
  try {
    let pageCount = parseInt(page);
    const answers = await db.execute(
      answersByQuestionId, [id], { prepare: true, fetchSize: count * page, autoPage: true },
    );
    // split the answers up by page and count from request
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

const insertImages = async (images, answerId) => {
  const pId = await db.execute(getLastPhotoId, [], { prepare: true });
  const photoId = parseInt(pId.rows[0].last_id);
  const img1 = images[0];
  const img2 = images[1];
  const img3 = images[2];
  const img4 = images[3];
  const img5 = images[4];
  try {
    img1 && await db.execute(createPhoto, [
      photoId,
      answerId,
      img1,
    ], { prepare: true });
    img2 && await db.execute(createPhoto, [
      photoId + 1,
      answerId,
      img2,
    ], { prepare: true });
    img3 && await db.execute(createPhoto, [
      photoId + 2,
      answerId,
      img3,
    ], { prepare: true });
    img4 && await db.execute(createPhoto, [
      photoId + 3,
      answerId,
      img4,
    ], { prepare: true });
    img5 && await db.execute(createPhoto, [
      photoId + 4,
      answerId,
      img5,
    ], { prepare: true });
    img1 && await db.execute(addPhotoId, [], { prepare: true });
    img2 && await db.execute(addPhotoId, [], { prepare: true });
    img3 && await db.execute(addPhotoId, [], { prepare: true });
    img4 && await db.execute(addPhotoId, [], { prepare: true });
    img5 && await db.execute(addPhotoId, [], { prepare: true });
  } catch (err) {
    console.log(err);
  }
};
const createAnswerByProductId = async (answer) => {
  try {
    // get the product id
    const question = await db.execute(getQuestion, [answer.question_id], { prepare: true });

    // get the next available answerId
    const id = await db.execute(getLastAnswerId, [], { prepare: true });
    const answerId = id.rows[0].last_id;
    // store the images if there are any
    await insertImages(answer.photos, answerId);
    const photos = await db.execute(getAnswersPhotos, [answerId], { prepare: true });
    // store the answer
    await db.execute(createAnswer, [
      answerId,
      answer.question_id,
      answer.body,
      new Date(),
      answer.name,
      answer.email,
      false,
      0,
      photos.rows,
    ], { prepare: true });
    await db.execute(addAnswerId, [], { prepare: true });
    // update the question
    const answers = await db.execute(getQuestionAnswers, [answer.question_id], { prepare: true });
    // return data;
    const answersObj = {};
    // create the object of answers
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
    const result = await db.execute(updateQuestion, [
      answersObj,
      answer.question_id,
      question.rows[0].product_id,
      question.rows[0].question_date,
    ], { prepare: true });
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getAnswersByQuestionId,
  createAnswerByProductId,
  markAnswerAsHelpful,
};
