const { tables } = require('..');

module.exports = {
  up: async (knex) => {
    await knex.schema.createTable(tables.genre, (table) => {
      table.increments('genreId');
      table.string('genreName').notNullable();
      table.unique('genreName', 'idx_genre_name_unique');
    });
  },
  down: (knex) => {
    return knex.schema.dropTableIfExists(tables.genre);
  }
}
