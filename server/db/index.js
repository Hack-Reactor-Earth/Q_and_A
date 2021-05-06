const cassandra = require('cassandra-driver')

const client = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
});

client.connect(() => [
  console.log('app: cassandra connected')
])

const dropDB = `DROP KEYSPACE IF EXISTS q_and_a`

const createDB = `CREATE KEYSPACE IF NOT EXISTS q_and_a WITH REPLICATION = {'class':'SimpleStrategy', 'replication_factor':3}`

const createQuestionsTable = `CREATE TABLE IF NOT EXISTS q_and_a.questions (
    id int,
    product_id int,
    body text,
    date_written date,
    asker_name text,
    asker_email text,
    reported boolean,
    helpful int,
    PRIMARY KEY(id, product_id, date_written)
    );`
const createAnswersTable = `CREATE TABLE IF NOT EXISTS q_and_a.answers (
    id int,
    question_id int,
    body text,
    date_written date,
    answerer_name text,
    answerer_email text,
    reported boolean,
    helpful int,
    PRIMARY KEY(question_id, id, date_written)
    );`
const createAnswersPhotosTable = `CREATE TABLE IF NOT EXISTS q_and_a.answers_photos (
    id int,
    answer_id int,
    url text,
    PRIMARY KEY(answer_id, id)
    );`

const createPhotoType = `CREATE TYPE q_and_a.photo (
    id int,
    answer_id int,
    url text
);`

const createAnswerType = `CREATE TYPE q_and_a.answer (
    id int,
    question_id int,
    body text,
    date_written date,
    answerer_name text,
    answerer_email text,
    reported boolean,
    helpful int
  );`

const createAnswersWithPhotos = `CREATE TABLE IF NOT EXISTS q_and_a.
answersWithPhotos (
    id int,
    question_id int,
    body text,
    date_written date,
    answerer_name text,
    answerer_email text,
    reported boolean,
    helpful int,
    photos list<frozen<photo>>,
    PRIMARY KEY(question_id, id, date_written, helpful)
);`

const createQuestionsAndAnswersTable = `CREATE TABLE IF NOT EXISTS q_and_a.questionsAndAnswers (
    id int,
    product_id int,
    body text,
    date_written date,
    asker_name text,
    asker_email text,
    reported boolean,
    helpful int,
    answers frozen<answer>,
    PRIMARY KEY(product_id, id, date_written, helpful)
    );`

const allAnswers = `SELECT * FROM q_and_a.answers`
const answerPhotos = `SELECT * FROM q_and_a.answers_photos WHERE answer_id = ?`
const insertAnswer = `INSERT INTO q_and_a.answersWithPhotos(
    id,
    question_id,
    body,
    date_written,
    answerer_name,
    answerer_email,
    reported,
    helpful,
    photos
   )
   VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
const insertPhoto = `INSERT INTO q_and_a.answersWithPhotos(
  id,
  question_id,
  date_written,
  helpful,
  photos
)
VALUES(?, ?, ?, ?, ?)`

const getAllAnswersWithPhotos = `SELECT * FROM q_and_a.answersWithPhotos`

const populateAPmix = async () => {
  try {
  const answers = await client.execute(allAnswers, []);

    Promise.all(
    // loop over each answer and for each answer
      answers.rows.map(async (answer) => {
    // Insert all answer data into answersWithPhotos table|
      const photos = await client.execute(answerPhotos, [answer.id], {prepare: true})
      await client.execute(insertAnswer, [
        answer.id,
        answer.question_id,
        answer.body,
        answer.date_written,
        answer.answerer_name,
        answer.answerer_email,
        answer.reported,
        answer.helpful,
        photos.rows
        ], {prepare: true})

      // get all photos for each answer
      // if the answer has photos insert all the data of that photo into the photos list in the answersWithPhotos table

      // photos.rows.length > 0 && photos.rows.map(async (photo) => {
      //   try {
      //     await client.execute(insertPhoto, [
      //     answer.id,
      //     answer.question_id,
      //     answer.date_written,
      //     answer.helpful,
      //     {
      //       id: photo.id,
      //       answer_id: photo.answer_id,
      //       url: photo.url
      //     }
      //   ], {prepare: true})
      //   } catch (err) {
      //     console.log(err)
      //   }
      // })
    })
    )
  } catch (err) {
    console.log(err)
  }

}

const getAllQuestions = `Describe atelier_products`

const runSchema = async () => {
  try {
  // await client.execute(dropDB, [])
  // await client.execute(createDB, []);
  // await client.execute(createQuestionsTable, []);
  // await client.execute(createAnswersTable, []);
  // await client.execute(createAnswersPhotosTable, []);
  // await client.execute(createPhotoType, []);
  // await client.execute(createAnswerType, []);
  // await client.execute(createAnswersWithPhotos, []);
  // await client.execute(createQuestionsAndAnswersTable, []);
  populateAPmix();

  // const data = await client.execute(getAllAnswersWithPhotos, []);
  // console.log('query', data.rows)
  } catch (err) {
    console.log(err)
  }
}
runSchema();


module.exports = {client, getAllAnswersWithPhotos}