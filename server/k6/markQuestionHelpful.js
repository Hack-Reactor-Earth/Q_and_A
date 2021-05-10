// eslint-disable-next-line import/no-unresolved
import { sleep } from 'k6';
// eslint-disable-next-line import/no-unresolved
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '12s', target: 500 },
    { duration: '12s', target: 500 },
    { duration: '12s', target: 1000 },
    { duration: '12s', target: 1000 },
    { duration: '12s', target: 0 },
  ],
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
      },
    },
  },
};

export default function main() {
  http.put('http://localhost:5000/qa/questions/5/helpful');

  // Automatically added sleep
  sleep(1);
}
