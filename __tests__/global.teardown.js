const { shutdownData, tables } = require('../src/data');
const { Model } = require('objection');

module.exports = async () => {
  const knex = Model.knex();

  // Remove any leftover data
  await knex.table(tables.user).delete();
  await knex.table(tables.playlist).delete();
  await knex.table(tables.song).delete();
  await knex.table(tables.genre).delete();
  await knex.table(tables.playlistSong).delete();
  await knex.table(tables.songGenre).delete();
  await knex.table(tables.userGenrePreference).delete();
  await knex.table(tables.userSongRating).delete();

  // Close database connection
  await shutdownData();
};
