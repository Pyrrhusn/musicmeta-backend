const config = require('config');
const { Model } = require('objection');
const Knex = require('knex');
const { join } = require('path');
const { getLogger } = require('../core/logging');
const { generateMockData } = require('./mock_data');

const NODE_ENV = config.get('env');
const isDevelopment = NODE_ENV === 'development';

const DATABASE_CLIENT = config.get('database.client');
const DATABASE_NAME = config.get('database.name');
const DATABASE_HOST = config.get('database.host');
const DATABASE_PORT = config.get('database.port');
const DATABASE_USERNAME = config.get('database.username');
const DATABASE_PASSWORD = config.get('database.password');
let knex;

async function initializeData() {
  const logger = getLogger();
  logger.info('Initialization connection to the database');

  const knexConfiguration = {
    client: DATABASE_CLIENT,
    connection: {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      user: DATABASE_USERNAME,
      password: DATABASE_PASSWORD,
      insecureAuth: isDevelopment
    },
    debug: isDevelopment,
    migrations: {
      tableName: 'knex_meta',
      directory: join('src', 'data', 'migrations'),
    },
    seeds: {
      directory: join('src', 'data', 'seeds'),
    }
  }

  knex = Knex(knexConfiguration);
  Model.knex(knex);
  knex = Model.knex();

  try {
    await knex.raw('SELECT 1+1 AS result');
    await knex.raw(`CREATE DATABASE IF NOT EXISTS ${DATABASE_NAME}`);
    await knex.destroy();

    knexConfiguration.connection.database = DATABASE_NAME;
    knex = Knex(knexConfiguration);
    Model.knex(knex);
    knex = Model.knex();
    await knex.raw('SELECT 1+1 AS result');
  } catch (error) {
    logger.error(error.message, { error });
    throw new Error('Could not initialize the data layer');
  }

  try {
    await knex.migrate.latest();
  } catch (error) {
    logger.error('Error while migrating the database', {
      error,
    });

    // No point in starting the server when migrations failed
    throw new Error('Migrations failed, check the logs');
  }

  if (isDevelopment) {
    try {
      await generateMockData();
      await knex.seed.run();
    } catch (error) {
      logger.error('Error while seeding database', {
        error
      });
    }
  }

  logger.info('Succesfully connected to the database');
}

async function shutdownData() {
  const logger = getLogger();
  logger.info('Shutting down database connection');

  await knex.destroy();
  knex = null;

  logger.info('Database connection closed');
}

const tables = Object.freeze({
  user: 'users',
  playlist: 'playlists',
  song: 'songs',
  genre: 'genres',
  userGenrePreference: 'user_genre_preferences',
  userSongRating: 'user_songs_rating',
  playlistSong: 'playlist_songs',
  songGenre: 'song_genres'
});

module.exports = {
  tables,
  initializeData,
  shutdownData
}
