const { tables } = require('..');

module.exports = {
  up: async (knex) => {
    await knex.schema.createTable(tables.userSongRating, (table) => {
      table.integer('userId').unsigned().notNullable();
      table.foreign('userId', 'fk_rating_user_id').references(`${tables.user}.userId`).onDelete('CASCADE');
      table.integer('songId').unsigned().notNullable();
      table.foreign('songId', 'fk_song_id_rating').references(`${tables.song}.songId`).onDelete('CASCADE');
      table.integer('rating').unsigned().notNullable();
      table.primary(['userId', 'songId'], 'pk_user_song_ids');
    });
  },
  down: (knex) => {
    return knex.schema.dropTableIfExists(tables.userSongRating);
  }
}
