const { tables } = require('..');

module.exports = {
  up: async (knex) => {
    await knex.schema.createTable(tables.song, (table) => {
      table.increments('songId');
      table.integer('artistId').unsigned().notNullable();
      table.foreign('artistId', 'fk_song_artist').references(`${tables.user}.userId`).onDelete('CASCADE');
      table.string('title').notNullable();
      table.unique(['artistId', 'title'], 'idx_song_title_and_artist_unique');
      table.time('length').notNullable();
      table.date('releaseDate').notNullable();
      table.text('artLocation', 'longtext');
    });
  },
  down: (knex) => {
    return knex.schema.dropTableIfExists(tables.song);
  }
}
