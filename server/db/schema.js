const cassandra = require('cassandra-driver')

const client = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
});

client.connect(() => [
  console.log('app: cassandra connected')
])

module.exports = client