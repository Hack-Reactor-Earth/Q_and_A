const supertest = require('supertest');
const server = require('../app');
const db = require('../db/index');
const queries = require('../db/queries');

const contentType = 'application/json; charset=utf-8';
const options = { prepare: true, fetchSize: 100, autoPage: true };

describe('answers router tests', () => {
  it(`PUT /qa/answers/:answer_id/helpful,
  (can mark an answer as helpful)`, async () => {
    const response = await supertest(server)
      .put('/qa/answers/46/helpful');
    expect(response.statusCode).toBe(204);
    expect(response.headers['content-type']).toBe(undefined);
  });
  it(`PUT /qa/answers/:answer_id/helpful,
  (can NOT mark an answer as helpful if answerId does not exist)`, async () => {
    const response = await supertest(server)
      .put('/qa/answers/460/helpful');
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toBe(contentType);
    expect(response.body.message).toBe('Error updating');
  });
  it(`PUT /qa/answers/:answer_id/report,
  (can NOT mark a report an answer answerId does not exist)`, async () => {
    const response = await supertest(server)
      .put('/qa/answers/460/report');
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toBe(contentType);
    expect(response.body.message).toBe('Error updating');
  });

  const answerToReportId = '12401368';
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
    expect(response.headers['content-type']).toBe(undefined);
  });
});
