const { tables } = require('..');
const { mockData } = require('../mock_data');

module.exports = {
  seed: async (knex) => {
    await knex(tables.playlistSong).delete();
    await knex(tables.playlistSong).insert([...mockData.PLAYLIST_SONG]);
  }
}
