const { tables } = require('..');
const { mockData } = require('../mock_data');

module.exports = {
  seed: async (knex) => {
    await knex(tables.userGenrePreference).delete();
    await knex(tables.userGenrePreference).insert([...mockData.USER_GENRE_PREFERENCES]);
  }
}
