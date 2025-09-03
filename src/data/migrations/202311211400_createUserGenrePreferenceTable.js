const { tables } = require('..');

module.exports = {
  up: async (knex) => {
    await knex.schema.createTable(tables.userGenrePreference, (table) => {
      table.integer('userId').unsigned().notNullable();
      table.foreign('userId', 'fk_user_id').references(`${tables.user}.userId`).onDelete('CASCADE');
      table.integer('genreId').unsigned().notNullable();
      table.foreign('genreId', 'fk_genre_id').references(`${tables.genre}.genreId`).onDelete('CASCADE');
      table.primary(['userId', 'genreId'], 'pk_user_genre_ids');
    });
  },
  down: (knex) => {
    return knex.schema.dropTableIfExits(tables.userGenrePreference);
  }
}
