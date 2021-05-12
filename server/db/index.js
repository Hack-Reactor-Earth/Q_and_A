const cassandra = require('cassandra-driver');

const { distance } = cassandra.types;

const client = new cassandra.Client({
  contactPoints: [process.env.DB_LOCATION],
  credentials: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  localDataCenter: 'datacenter1',
  pooling: {
    coreConnectionsPerHost: {
      [distance.local]: 8,
      [distance.remote]: 8,
    },
    maxRequestsPerConnection: {
      [distance.local]: 8,
      [distance.remote]: 8,
    },
  },
  keyspace: 'q_and_a',
});

client.connect(() => [
  console.log('app: cassandra connected'),
]);

module.exports = client;
