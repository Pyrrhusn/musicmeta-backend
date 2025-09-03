const { tables } = require('..');

module.exports = {
  up: async (knex) => {
    await knex.schema.createTable(tables.playlistSong, (table) => {
      table.integer('playlistId').unsigned().notNullable();
      table.foreign('playlistId', 'fk_song_playlist_id').references(`${tables.playlist}.playlistId`).onDelete('CASCADE');
      table.integer('songId').unsigned().notNullable();
      table.foreign('songId', 'fk_song_id_playlist').references(`${tables.song}.songId`).onDelete('CASCADE');
      table.date('addedOnDate').notNullable();
      table.primary(['playlistId', 'songId'], 'pk_playlist_song_ids');
    });
  },
  down: (knex) => {
    return knex.schema.dropTableIfExits(tables.playlistSong);
  }
}
