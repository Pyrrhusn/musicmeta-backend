const { tables } = require('..');
const { mockData } = require('../mock_data');

module.exports = {
  seed: async (knex) => {
    await knex(tables.userSongRating).delete();
    await knex(tables.userSongRating).insert([...mockData.USER_SONGS_RATING]);
  }
}
