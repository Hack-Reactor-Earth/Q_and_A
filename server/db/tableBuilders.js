const client = require('./index');
const queries = require('./queries');

/** ****************************************************************************
  *                      Helper functions to build new tables
  ***************************************************************************** */
const options = { prepare: true, fetchSize: 100, autoPage: true };
const populateNewAnswersTable = async () => {
  try {
    let hundreds = 0;
    await client.eachRow(queries.allAnswers, [], {
      prepare: true, autoPage: true, fetchSize: 100,
    }, async (n, answer) => {
      if (n === 99) {
        hundreds++;
      }
      console.log({ answerHundreds: hundreds });
      try {
        const photos = await client.execute(
          queries.answerPhotos, [answer.id], options,
        );
        // Insert all answer data into answersWithPhotos table with photos array
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
    let hundreds = 0;
    await client.eachRow(queries.allQuestions, [],
      options, async (n, question) => {
        if (n === 99) {
          hundreds++;
        }
        console.log({ questionHundreds: hundreds });
        try {
          const answers = await client.execute(
            queries.questionAnswers, [question.id], options,
          );
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
          await client.execute(queries.updateCounter, ['questions'], options);
          await client.execute(
            queries.insertProdIdByQid, [question.id, question.product_id], options,
          );
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
