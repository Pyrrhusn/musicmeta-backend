const Playlist = require('../models/Playlist');
const songService = require('./song');
const ServiceError = require('../core/serviceError');
const handleDBError = require('./_handleDBError');

const getAll = async (userId) => {
  // const playlists = await Playlist.query().where('ownerId', userId).withGraphFetched('[songs]').resultSize();
  const playlists = await Playlist.query()
    .where('ownerId', userId)
    .select('playlists.*')
    .select(
      Playlist.relatedQuery('songs')
        .count()
        .as('songCount')
    );
    
  return playlists;
}

// get a playlist by its id
const getSongsByPlaylistId = async (playlistId, userId, idCheck = false) => {
  const playlist = idCheck ? await Playlist.query().findById(playlistId) : await Playlist.query().findById(playlistId).withGraphFetched('[songs.[owner as artist, genres]]')
    .modifyGraph('[songs.[owner as artist]]', builder => { builder.select('users.username', 'users.about') })
    .withGraphFetched('[songs.[usersRating]]')
    .modifyGraph('[songs.[usersRating]]', builder => { builder.where('user_songs_rating.userId', userId).select('rating') });

  if (!playlist || playlist.ownerId !== userId) {
    throw ServiceError.notFound(`No playlist with id ${playlistId} exists`, { playlistId });
  }

  return playlist;
}

// get all songs in a playlist by its id
// const getAllSongById = async (playlistId, userId) => {
//   await getSongsByPlaylistId(playlistId, userId);

//   try {
//     const songs = await Playlist.relatedQuery('songs').for(playlistId);
//     return songs;
//   } catch (error) {
//     throw handleDBError(error);
//   }
// }

const create = async ({ ownerId, name, creationDate }) => {
  try {
    const playlistCreated = await Playlist.query().insertAndFetch({ ownerId, name, creationDate });
    return playlistCreated;
  } catch (error) {
    throw handleDBError(error);
  }
}

const updateById = async (playlistId, userId, { name }) => {
  await getSongsByPlaylistId(playlistId, userId, true);

  try {
    const playlistUpdated = await Playlist.query().updateAndFetchById(playlistId, { name });
    return playlistUpdated;
  } catch (error) {
    throw handleDBError(error);
  }
}

const deleteById = async (playlistId, userId) => {
  await getSongsByPlaylistId(playlistId, userId, true);

  try {
    const playlistDeleted = await Playlist.query().deleteById(playlistId);
    if (playlistDeleted !== 1) {
      throw ServiceError.notFound(`No playlist with id ${playlistId} exists`, { playlistId });
    }
  } catch (error) {
    throw handleDBError(error);
  }
}

const addSongById = async (playlistId, userId, songId, addedOnDate) => {
  await getSongsByPlaylistId(playlistId, userId, true);
  await songService.getById(songId, null, true);

  try {
    await Playlist.relatedQuery('songs').for(playlistId).relate({
      songId,
      addedOnDate,
    });
    const addedSong = await Playlist.relatedQuery('songs').for(playlistId).findById(songId);
    return addedSong;
  } catch (error) {
    throw handleDBError(error);
  }
}

const deleteSongById = async (playlistId, songId, userId) => {
  await getSongsByPlaylistId(playlistId, userId, true);

  try {
    const songDeleted = await Playlist.relatedQuery('songs')
      .for(playlistId)
      .unrelate()
      .where('songs.songId', songId);

    if (songDeleted !== 1) {
      throw ServiceError.notFound(`No playlist with id ${playlistId} exists or no song with id ${songId} could be found in the playlist`, { playlistId, songId });
    }
  } catch (error) {
    throw handleDBError(error);
  }
}

module.exports = { getAll, getSongsByPlaylistId, addSongById, create, updateById, deleteById, deleteSongById }
