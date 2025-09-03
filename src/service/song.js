const Song = require('../models/Song');
const genreService = require('./genre');
const ServiceError = require('../core/serviceError');
const handleDBError = require('./_handleDBError');

// get all songs
const getAll = async () => {
  const songs = await Song.query().withGraphFetched('[owner as artist]')
    .modifyGraph('[owner as artist]', builder => { builder.select('users.username') }).withGraphFetched('genres');
  return songs;
}

// get a song + genres + to user added playlists + user given rating
const getById = async (songId, userId, idCheck = false) => {
  const song = idCheck ? await Song.query().findById(songId) : await Song.query().findById(songId).withGraphFetched('[owner as artist]').modifyGraph('[owner as artist]', builder => { builder.select('users.username', 'users.about') })
    .withGraphFetched('[genres]')
    .withGraphFetched('[playlists]').modifyGraph('[playlists]', builder => { builder.where('playlists.ownerId', userId) })
    .withGraphFetched('[usersRating]').modifyGraph('[usersRating]', builder => { builder.where('user_songs_rating.userId', userId).select('rating') });

  if (!song) {
    throw ServiceError.notFound(`No song with id ${songId} exists`, { songId });
  }

  return song;
}

// create a song
const create = async ({ artistId, title, length, releaseDate, artLocation }) => {
  try {
    const songCreated = await Song.query().insertAndFetch({ artistId, title, length, releaseDate, artLocation });
    return songCreated;
  } catch (error) {
    throw handleDBError(error);
  }
}

// update a song
const updateById = async (songId, userId, { title, releaseDate }) => {
  const { artistId } = await getById(songId, null, true);

  if (!artistId || artistId !== userId) {
    throw ServiceError.notFound(`No song with id ${songId} exists`, { songId });
  }

  try {
    const songUpdated = await Song.query().updateAndFetchById(songId, { title, releaseDate });
    return songUpdated;
  } catch (error) {
    throw handleDBError(error);
  }
}

// delete a song
const deleteById = async (songId, userId) => {
  const { artistId } = await getById(songId, null, true);

  if (!artistId || artistId !== userId) {
    throw ServiceError.notFound(`No song with id ${songId} exists`, { songId });
  }

  try {
    const songDeleted = await Song.query().deleteById(songId);
    if (songDeleted !== 1) {
      throw ServiceError.notFound(`No song with id ${songId} exists`, { songId });
    }
  } catch (error) {
    throw handleDBError(error);
  }
}

// get all genres of a song
// const getAllGenreById = async (songId) => {
//   await getById(songId);

//   try {
//     const genres = await Song.relatedQuery('genres').for(songId);
//     return genres;
//   } catch (error) {
//     throw handleDBError(error);
//   }
// }

// add a genre to a song
const addGenreById = async (songId, userId, { genreId }) => {
  const { artistId } = await getById(songId, null, true);
  await genreService.getSongsByGenreId(genreId, true);

  if (!artistId || artistId !== userId) {
    throw ServiceError.notFound(`No song with id ${songId} exists`, { songId });
  }

  try {
    await Song.relatedQuery('genres').for(songId).relate({ genreId });
    const genreAdded = Song.relatedQuery('genres').for(songId).findById(genreId);
    return genreAdded;
  } catch (error) {
    throw handleDBError(error);
  }
}

// delete a genre from a song
const deleteGenreById = async (songId, genreId, userId) => {
  const { artistId } = await getById(songId, null, true);

  if (!artistId || artistId !== userId) {
    throw ServiceError.notFound(`No song with id ${songId} exists`, { songId });
  }

  try {
    const genreDeleted = await Song.relatedQuery('genres').for(songId).findById(genreId).delete();
    if (genreDeleted !== 1) {
      throw ServiceError.notFound(`No song with id ${songId} exists or no genre with id ${genreId} exists`, { songId, genreId });
    }
  } catch (error) {
    throw handleDBError(error);
  }
}

module.exports = { getAll, getById, create, updateById, deleteById, addGenreById, deleteGenreById }
