const { tables } = require('..');

module.exports = {
  up: async (knex) => {
    await knex.schema.createTable(tables.songGenre, (table) => {
      table.integer('songId').unsigned().notNullable();
      table.foreign('songId', 'fk_genre_song_id').references(`${tables.song}.songId`).onDelete('CASCADE');
      table.integer('genreId').unsigned().notNullable();
      table.foreign('genreId', 'fk_genre_id_song').references(`${tables.genre}.genreId`).onDelete('CASCADE');
      table.primary(['songId', 'genreId'], 'pk_song_genre_ids');
    });
  },
  down: (knex) => {
    return knex.schema.dropTableIfExits(tables.songGenre);
  }
}
