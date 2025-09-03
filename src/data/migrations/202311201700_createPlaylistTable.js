const { tables } = require('..');

module.exports = {
  up: async (knex) => {
    await knex.schema.createTable(tables.playlist, async (table) => {
      table.increments('playlistId');
      table.integer('ownerId').unsigned().notNullable();
      table.foreign('ownerId', 'fk_playlist_owner').references(`${tables.user}.userId`).onDelete('CASCADE');
      table.string('name').notNullable();
      table.unique(['ownerId', 'name'], 'idx_playlist_name_and_owner_unique');
      table.date('creationDate'); // .defaultTo(await knex.raw('select CURDATE();'));
    });
  },
  down: (knex) => {
    return knex.schema.dropTableIfExists(tables.playlist);
  }
}
