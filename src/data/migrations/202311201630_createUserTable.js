const { tables } = require('..');

module.exports = {
  up: async (knex) => {
    await knex.schema.createTable(tables.user, (table) => {
      table.increments('userId');
      table.string('username').notNullable();
      table.unique('username', 'idx_username_unique');
      table.string('email').notNullable();
      table.unique('email', 'idx_user_email_unique');
      table.string('password_hash').notNullable();
      table.jsonb('roles').notNullable();
      table.date('birthDate');
      table.boolean('isArtist').notNullable();
      table.text('about');
      table.string('pictureLocation');
    });
  },
  down: (knex) => {
    return knex.schema.dropTableIfExits(tables.user);
  }
}
