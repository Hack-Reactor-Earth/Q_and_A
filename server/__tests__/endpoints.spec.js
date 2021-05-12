const supertest = require('supertest');
const server = require('../app');
const db = require('../db/index');
const queries = require('../db/queries');

const options = { prepare: true, fetchSize: 100, autoPage: true };
const contentType = 'application/json; charset=utf-8';

describe('answers router tests', () => {
  it(`PUT /qa/answers/:answer_id/helpful,
  (can mark an answer as helpful)`, async () => {
    const response = await supertest(server)
      .put('/qa/answers/46/helpful');
    expect(response.statusCode).toBe(204);
  });
  it(`PUT /qa/answers/:answer_id/helpful,
  (can NOT mark an answer as helpful if answerId does not exist)`, async () => {
    const response = await supertest(server)
      .put('/qa/answers/460/helpful');
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Error updating');
  });
  it(`PUT /qa/answers/:answer_id/report,
  (can NOT mark a report an answer answerId does not exist)`, async () => {
    const response = await supertest(server)
      .put('/qa/answers/460/report');
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Error updating');
  });

  it(`PUT /qa/answers/:answer_id/report,
  (can mark an answer as reported)`, async () => {
    // first create a new answer so we can then report it
    await db.execute(queries.insertAnswer, [
      500000000,
      1,
      'supertest body',
      new Date(),
      'supertest name',
      'supertest email',
      false,
      0,
      ['supertestImg 1'],
    ], options);

    const response = await supertest(server)
      .put('/qa/answers/500000000/report');
    expect(response.statusCode).toBe(204);
  });
});

describe('questions router tests', () => {
  it(`GET /qa/questions/,
  (can get all questions by product id)`, async () => {
    const response = await supertest(server)
      .get('/qa/questions?product_id=1&count=5&page=2');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(contentType);
    expect(response.body.product_id).toBe('1');
  });
  it(`GET /qa/questions/,
  (can NOT get all questions when given an invalid id)`, async () => {
    const response = await supertest(server)
      .get('/qa/questions?product_id=0&count=5&page=2');
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toBe(contentType);
    expect(response.body.message).toBe('Error retrieving questions');
  });

  it(`GET /qa/questions/:question_id/answers,
  (can get all answers by question id)`, async () => {
    const response = await supertest(server)
      .get('/qa/questions/1/answers?page=5&count=10');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(contentType);
    expect(response.body.question).toBe('1');
  });
  it(`GET /qa/questions/:question_id/answers,
  (can NOT get all answers when given an invalid question)`, async () => {
    const response = await supertest(server)
      .get('/qa/questions/0/answers?page=5&count=10');
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toBe(contentType);
    expect(response.body.message).toBe('Error retrieving answers');
  });

  it(`POST /qa/questions/,
  (can create a new question)`, async () => {
    const question = {
      body: 'supertest body',
      name: 'supertest name',
      email: 'supertest email',
      product_id: 1,
    };
    const response = await supertest(server)
      .post('/qa/questions').send(question);
    expect(response.statusCode).toBe(201);
  });

  it(`POST /qa/questions/,
  (can NOT create a new question without a valid product id)`, async () => {
    const question = {
      body: 'supertest body',
      name: 'supertest name',
      email: 'supertest email',
      product_id: 0,
    };
    const response = await supertest(server)
      .post('/qa/questions').send(question);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Unable to add question');
  });

  it(`POST /qa/questions/question_id/answers,
  (can create a new answer with question id)`, async () => {
    const question = {
      body: 'supertest body',
      name: 'supertest name',
      email: 'supertest email',
      photos: [],
    };
    const response = await supertest(server)
      .post('/qa/questions/1/answers').send(question);
    expect(response.statusCode).toBe(201);
  });

  it(`POST /qa/questions/question_id/answers,
  (can NOT create a new answer without a valid question id)`, async () => {
    const question = {
      body: 'supertest body',
      name: 'supertest name',
      email: 'supertest email',
      photos: [],
    };
    const response = await supertest(server)
      .post('/qa/questions/0/answers').send(question);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Unable to add answer');
  });

  it(`PUT /qa/questions/:question_id/helpful,
  (can mark a question as helpful)`, async () => {
    const response = await supertest(server)
      .put('/qa/questions/5/helpful');
    expect(response.statusCode).toBe(204);
  });

  it(`PUT /qa/questions/:question_id/helpful,
  (can NOT mark a question as helpful if question does not exist)`, async () => {
    const response = await supertest(server)
      .put('/qa/answers/0/helpful');
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Error updating');
  });

  it(`PUT /qa/questions/4432709/report,
  (can NOT report a question if question id does not exist)`, async () => {
    const response = await supertest(server)
      .put('/qa/questions/0/report');
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Error updating');
  });

  it(`PUT /qa/questions/4432709/report,
  (can mark an answer as reported)`, async () => {
    // first create a new answer so we can then report it
    await db.execute(queries.insertQuestion, [
      500000000,
      1,
      'supertest body',
      new Date(),
      'supertest name',
      'supertest email',
      false,
      0,
      null,
    ], options);

    const response = await supertest(server)
      .put('/qa/questions/500000000/report');
    expect(response.statusCode).toBe(204);
  });
});
