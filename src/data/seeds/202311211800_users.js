const { tables } = require('..');
const { mockData } = require('../mock_data');

module.exports = {
  seed: async (knex) => {
    await knex(tables.user).delete();
    await knex(tables.user).insert([...mockData.USERS]);
  }
}
