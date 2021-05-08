const db = require('../db/index');

/** ****************************************************************************
  *                      Queries
  ***************************************************************************** */

const answersByQuestionId = `
SELECT answer_id, body, date, answerer_name, helpfulness, photos FROM answersWithPhotos
WHERE question_id = ? AND reported = ? ALLOW FILTERING`;

const getLastAnswerId = `
SELECT MAX(answer_id) FROM answer_ids
`;
const addAnswerId = `INSERT INTO answer_ids(
answer_id
)
VALUES(?)`;
const getLastPhotoId = `
SELECT MAX(photo_id) FROM photo_ids
`;
const addPhotoId = `INSERT INTO photo_ids(
photo_id
)
VALUES(?)`;
const createPhoto = `INSERT INTO answers_photos(
  id,
  answer_id,
  url
)
VALUES(?, ?, ?)`;
const createAnswer = `INSERT INTO answersWithPhotos(
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

const getAnswersPhotos = 'SELECT * FROM answers_photos WHERE answer_id = ?';
const getQuestionAnswers = 'SELECT * FROM answersWithPhotos WHERE question_id = ?';
const getQuestion = `
SELECT * FROM questionsWithAnswers WHERE question_id = ? ALLOW FILTERING`;
const updateQuestion = `
UPDATE questionsWithAnswers
SET answers = ? WHERE
question_id = ?
and product_id = ?
and question_date = ?
and question_helpfulness = ?
`;

// const updateQuestion = ``

/** ****************************************************************************
  *                      Models
  ***************************************************************************** */

const getAnswersByQuestionId = async (id, page, count) => {
  try {
    let pageCount = parseInt(page);
    const answers = await db.execute(
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

const insertImages = async (images, answerId) => {
  const pId = await db.execute(getLastPhotoId, [], { prepare: true });
  const photoId = pId.rows[0]['system.max(photo_id)'];
  const img1 = images[0];
  const img2 = images[1];
  const img3 = images[2];
  const img4 = images[3];
  const img5 = images[4];
  try {
    img1 && await db.execute(createPhoto, [
      photoId + 1,
      answerId,
      img1,
    ], { prepare: true });
    img2 && await db.execute(createPhoto, [
      photoId + 2,
      answerId,
      img2,
    ], { prepare: true });
    img3 && await db.execute(createPhoto, [
      photoId + 3,
      answerId,
      img3,
    ], { prepare: true });
    img4 && await db.execute(createPhoto, [
      photoId + 4,
      answerId,
      img4,
    ], { prepare: true });
    img5 && await db.execute(createPhoto, [
      photoId + 5,
      answerId,
      img5,
    ], { prepare: true });
    img1 && await db.execute(addPhotoId, [photoId + 1], { prepare: true });
    img2 && await db.execute(addPhotoId, [photoId + 2], { prepare: true });
    img3 && await db.execute(addPhotoId, [photoId + 3], { prepare: true });
    img4 && await db.execute(addPhotoId, [photoId + 4], { prepare: true });
    img5 && await db.execute(addPhotoId, [photoId + 5], { prepare: true });
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
    const answerId = id.rows[0]['system.max(answer_id)'];
    // store the images if there are any
    await insertImages(answer.photos, answerId);
    const photos = await db.execute(getAnswersPhotos, [answerId], { prepare: true });
    // store the answer
    await db.execute(createAnswer, [
      answerId + 1,
      answer.question_id,
      answer.body,
      new Date(),
      answer.name,
      answer.email,
      false,
      0,
      photos.rows,
    ], { prepare: true });
    await db.execute(addAnswerId, [answerId + 1], { prepare: true });
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
      question.rows[0].question_helpfulness,
    ], { prepare: true });
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getAnswersByQuestionId,
  createAnswerByProductId,
};
