const client = require('./index');
const queries = require('./queries');

/** ****************************************************************************
  *                      Helper functions to build new tables
  ***************************************************************************** */
const options = { prepare: true, fetchSize: 100, autoPage: true };
const populateNewAnswersTable = async () => {
  try {
    // get all answers from the old answers table
    await client.eachRow(queries.allAnswers, [], {
      prepare: true, autoPage: true, fetchSize: 100,
    }, async (n, answer) => {
      // for each answer ...
      try {
        // get all photos by that answer id
        const photos = await client.execute(
          queries.answerPhotos, [answer.id], options,
        );
        // Insert all answer data into the new answer table with photos array
        await client.execute(queries.insertAnswer, [
          answer.id,
          answer.question_id,
          answer.body,
          answer.date_written,
          answer.answerer_name,
          answer.answerer_email,
          answer.reported,
          answer.helpful,
          photos.rows,
        ], options);
        // update the answer id_counter each time
        await client.execute(queries.updateCounter, ['answers'], options);
      } catch (err) {
        console.log(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

const populateNewQuestionsTable = async () => {
  try {
    // get all questions from the old questions table
    await client.eachRow(queries.allQuestions, [],
      options, async (n, question) => {
        // for each question...
        try {
          // get all answers by that question id
          const answers = await client.execute(
            queries.questionAnswers, [question.id], options,
          );
          // create an answer object that will have its id as its key and its data as its value
          const answersObj = {};
          // create the object of answers for each insert
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
          console.log(answersObj);
          // insert all question data into the new question table
          // with the answer object for each question
          await client.execute(queries.insertQuestion, [
            question.id,
            question.product_id,
            question.body,
            question.date_written.date,
            question.asker_name,
            question.asker_email,
            question.reported,
            question.helpful,
            answersObj,
          ], options);
          // update the question id_counter each time
          await client.execute(queries.updateCounter, ['questions'], options);
        } catch (err) {
          console.log(err);
        }
      });
  } catch (err) {
    console.log(err);
  }
};

populateNewAnswersTable();
populateNewQuestionsTable();
