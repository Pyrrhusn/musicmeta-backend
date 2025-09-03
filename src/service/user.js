const User = require('../models/User');
const songService = require('./song');
const genreService = require('./genre');
const ServiceError = require('../core/serviceError');
const handleDBError = require('./_handleDBError');
const { hashPassword, verifyPassword } = require('../core/password');
const Role = require('../core/roles');
const { getLogger } = require('../core/logging');
const { generateJWT, verifyJWT } = require('../core/jwt');

const checkAndParseSession = async (authHeader) => {
  if (!authHeader) {
    throw ServiceError.unauthorized('You need to be signed in');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw ServiceError.unauthorized('Invalid authentication token');
  }

  const authToken = authHeader.substring(7);
  try {
    const { roles, userId, isArtist } = await verifyJWT(authToken);
    if (isArtist) roles.push(Role.ARTIST);

    return {
      userId,
      roles,
      authToken,
    };
  } catch (error) {
    getLogger().error(error.message, { error });
    throw new Error(error.message);
  }
};

const checkRole = (requireRoles, roles) => {
  const hasPermission = requireRoles.some(r => roles.includes(r));

  if (!hasPermission) {
    throw ServiceError.forbidden(
      'You are not allowed to view this part of the application'
    );
  }
};

const makeExposedUser = ({ userId, username, email, roles, birthDate, isArtist, about, pictureLocation }) => ({
  userId,
  username,
  email,
  roles,
  birthDate,
  isArtist,
  about,
  pictureLocation
});

const makeLoginData = async (user) => {
  const token = await generateJWT(user);
  return {
    user: makeExposedUser(user),
    token,
  };
};

const login = async (email, password) => {
  const user = await User.query().findOne('email', email);
  if (!user) {
    // DO NOT expose we don't know the user
    throw ServiceError.unauthorized(
      'The given email and password do not match'
    );
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    // DO NOT expose we know the user but an invalid password was given
    throw ServiceError.unauthorized(
      'The given email and password do not match'
    );
  }

  return await makeLoginData(user);
};

const getAll = async () => {
  const users = await User.query().orderBy('username', 'ASC');
  return users.map(makeExposedUser);
}

const getById = async (userId) => {
  const user = await User.query().findById(userId);

  if (!user) {
    throw ServiceError.notFound(`No user with id ${userId} exists`, { userId });
  }

  return makeExposedUser(user);
}

const create = async ({ username, password, email, birthDate, isArtist, about, pictureLocation }) => {
  try {
    const password_hash = await hashPassword(password);
    const userCreated = await User.query().insertAndFetch({ username, email, password_hash, roles: JSON.stringify([Role.USER]), birthDate, isArtist, about, pictureLocation });
    return await makeLoginData(userCreated);
  } catch (error) {
    throw handleDBError(error);
  }
}

const updateById = async (userId, { username, birthDate, about }) => {
  try {
    const userUpdated = await User.query().updateAndFetchById(userId, { username, birthDate, about });
    return makeExposedUser(userUpdated);
  } catch (error) {
    throw handleDBError(error);
  }
}

const deleteById = async (userId) => {
  try {
    const userDeleted = await User.query().deleteById(userId);
    if (userDeleted !== 1) {
      throw ServiceError.notFound(`No user with id ${userId} exists`, { userId });
    }
  } catch (error) {
    throw handleDBError(error);
  }
}

// get all playlists created by a user
const getAllPlaylistByUserId = async (userId) => {
  await getById(userId);

  try {
    const playlists = await User.relatedQuery('playlists').for(userId);
    return playlists;
  } catch (error) {
    throw handleDBError(error);
  }
}

// get all songs ratings
const getAllSongsRatingById = async (userId) => {
  await getById(userId);

  try {
    const songsRating = await User.relatedQuery('songsRating').for(userId).withGraphFetched('owner as artist').modifyGraph('owner as artist', builder => { builder.select('users.username') });
    return songsRating;
  } catch (error) {
    throw handleDBError(error);
  }
}

// get a song's rating
// const getSongRatingById = async (userId, songId) => {
//   await getById(userId);
//   await songService.getById(songId);

//   try {
//     const songRating = await User.relatedQuery('songsRating').for(userId).findById(songId);
//     return songRating;
//   } catch (error) {
//     throw handleDBError(error);
//   }
// }

// add a rating to a song
const addSongRatingById = async (userId, { songId, rating }) => {
  await getById(userId);
  await songService.getById(songId, null, true);

  try {
    await User.relatedQuery('songsRating').for(userId).relate({ songId, rating });
    const songRatingAdded = await User.relatedQuery('songsRating').for(userId).findById(songId);
    return songRatingAdded;
  } catch (error) {
    throw handleDBError(error);
  }
}

// update rating of a song
const updateSongRatingById = async (userId, songId, { rating }) => {
  await getById(userId);
  await songService.getById(songId, null, true);

  try {
    await User.relatedQuery('songsRating').for(userId).findById(songId).patch({ rating }).findById(songId);
    const songRatingUpdated = await User.relatedQuery('songsRating').for(userId).findById(songId);
    return songRatingUpdated;
  } catch (error) {
    throw handleDBError(error);
  }
}

// delete rating of a song
const deleteSongRatingById = async (userId, songId) => {
  try {
    const songRatingDeleted = await User.relatedQuery('songsRating').for(userId).findById(songId).delete();
    if (songRatingDeleted !== 1) {
      throw ServiceError.notFound(`No user with id ${userId} exists or no song with id ${songId} has a rating`, { userId, songId });
    }
  } catch (error) {
    throw handleDBError(error);
  }
}

// get all songs with user as the artist
const getAllSongsById = async (userId) => {
  const { username, birthDate, isArtist, about, pictureLocation } =
    await getById(userId);

  try {
    if (!isArtist) {
      throw ServiceError.notFound(`No artist with id ${userId} exists`, {
        userId,
      });
    }
    const songs = await User.relatedQuery("songs")
      .for(userId)
      .withGraphFetched("genres");
    return {
      artist: { userId, username, birthDate, isArtist, about, pictureLocation },
      totalSongs: songs.length,
      songs,
    };
  } catch (error) {
    throw handleDBError(error);
  }
};

// get user genres preferences
const getAllGenrePreferencesById = async (userId) => {
  await getById(userId);

  try {
    const genrePreferences = await User.relatedQuery('genrePreferences').for(userId);
    return genrePreferences;
  } catch (error) {
    throw handleDBError(error);
  }
}

// add a genre to user genre preferences
const addGenrePreferenceById = async (userId, { genreId }) => {
  await getById(userId);
  await genreService.getSongsByGenreId(genreId, true);

  try {
    await User.relatedQuery('genrePreferences').for(userId).relate({ genreId });
    const genrePreferenceAdded = await User.relatedQuery('genrePreferences').for(userId).findById(genreId);
    return genrePreferenceAdded;
  } catch (error) {
    throw handleDBError(error);
  }
}

// delete a genre from user genre preferences
const deleteGenrePreferenceById = async (userId, genreId) => {
  try {
    const genrePreferenceDeleted = await User.relatedQuery('genrePreferences').for(userId).findById(genreId).delete();
    if (genrePreferenceDeleted !== 1) {
      throw ServiceError.notFound(`No user with id ${userId} exists or no genre with id ${genreId} in preferences`, { userId, genreId });
    }
  } catch (error) {
    throw handleDBError(error);
  }
}

module.exports = {
  checkAndParseSession, checkRole, login, getAll, getById, create, updateById, deleteById, getAllPlaylistByUserId, getAllSongsRatingById,
  addSongRatingById, updateSongRatingById, deleteSongRatingById, getAllSongsById, getAllGenrePreferencesById,
  addGenrePreferenceById, deleteGenrePreferenceById
}
