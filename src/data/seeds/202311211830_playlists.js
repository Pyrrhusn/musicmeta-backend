const { tables } = require('..');
const { mockData } = require('../mock_data');

module.exports = {
  seed: async (knex) => {
    await knex(tables.playlist).delete();
    await knex(tables.playlist).insert([...mockData.PLAYLISTS]);
  }
}
