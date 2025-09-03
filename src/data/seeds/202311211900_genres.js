const { tables } = require('..');
const { mockData } = require('../mock_data');

module.exports = {
  seed: async (knex) => {
    await knex(tables.genre).delete();
    await knex(tables.genre).insert([...mockData.GENRES]);
  }
}
