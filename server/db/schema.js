const client = require('./index');
const queries = require('./queries');

const runSchema = async () => {
  try {
    await client.execute(queries.dropKeySpace, []);
    await client.execute(queries.createKeySpace, []);
    await client.execute(queries.createQuestionsTable, []);
    await client.execute(queries.createAnswersTable, []);
    await client.execute(queries.createAnswersPhotosTable, []);
    await client.execute(queries.createPhotoType, []);
    await client.execute(queries.createAnswerType, []);
    await client.execute(queries.createAnswersWithPhotosTable, []);
    await client.execute(queries.createReportedAnswersTable, []);
    await client.execute(queries.createQuestionsWithAnswersTable, []);
    await client.execute(queries.createReportedQuestionsTable, []);
    await client.execute(queries.createQuestionsIdIndex, []);
    await client.execute(queries.createAnswersIdIndex, []);
    await client.execute(queries.createCountersTable, []);
    await client.execute(queries.initializePhotoCounter, []);
  } catch (err) {
    console.log(err);
  }
};

runSchema();
