const cassandra = require('cassandra-driver')

const client = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
});

client.connect(() => [
  console.log('app: cassandra connected')
])

const dropDB = `DROP KEYSPACE IF EXISTS q_and_a`

const createDB = `CREATE KEYSPACE q_and_a WITH REPLICATION = {'class':'SimpleStrategy', 'replication_factor':3}`

const createQuestionsTable = `CREATE TABLE q_and_a.questions (
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
const createAnswersTable = `CREATE TABLE q_and_a.answers (
    id int,
    question_id int,
    body text,
    date_written date,
    answerer_name text,
    answerer_email text,
    reported boolean,
    helpful int,
    PRIMARY KEY(id, question_id, date_written)
    );`
const createAnswersPhotosTable = `CREATE TABLE q_and_a.answers_photos (
    id int,
    answer_id int,
    url text,
    PRIMARY KEY(id, answer_id)
    );`

const queries = [
  {
    query: `INSERT INTO q_and_a.questions(
      id,
      product_id,
      body,
      date_written,
      asker_name,
      asker_email,
      reported,
      helpful
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      1,
      1,
      "What fabric is the top made of?",
      "2018-01-04",
      "yankeelover",
      "first.last@gmail.com",
      0,
      1
    ],
  },
  {
    query: `INSERT INTO q_and_a.answers(
    id,
    question_id,
    body,
    date_written,
    answerer_name,
    answerer_email,
    reported,
    helpful
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      1,
      1,
      "Its the best! Seriously magic fabric",
      "2018-01-04",
      "metslover",
      "first.last@gmail.com",
      0,
      7
    ],
  },
  {
    query: `INSERT INTO q_and_a.answers_photos(
    id,
    answer_id,
    url
    )
    VALUES (?, ?, ?)`,
    params: [
      1,
      1,
      "https://images.unsplash.com/photo-1530519729491-aea5b51d1ee1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1651&q=80"
    ],
  }
]

const getAllQuestions = `SELECT * FROM q_and_a.questions`

const runSchema = async () => {
  try {
  await client.execute(dropDB, []);
  await client.execute(createDB, []);
  await client.execute(createQuestionsTable, []);
  await client.execute(createAnswersTable, []);
  await client.execute(createAnswersPhotosTable, []);
  await client.batch(queries, {prepare: true});
  const data = await client.execute(getAllQuestions, []);
  console.log(data.rows)
  } catch (err) {
    console.log(err)
  }
}

runSchema();



module.exports = client