const Genre = require("../models/Genre");
const ServiceError = require("../core/serviceError");
const handleDBError = require("./_handleDBError");

const getAll = async () => {
  const genres = await Genre.query().orderBy("genreName", "ASC");
  return genres;
};

const getSongsByGenreId = async (genreId, idCheck = false) => {
  const genreAndSongs = idCheck
    ? await Genre.query().findById(genreId)
    : await Genre.query()
        .findById(genreId)
        .withGraphFetched("songs.[owner as artist]")
        .modifyGraph("songs.[owner as artist]", (builder) => {
          builder.select("users.username");
        });

  if (!genreAndSongs) {
    throw ServiceError.notFound(`No genre with id ${genreId} exists`, {
      genreId,
    });
  }

  return genreAndSongs;
};

const create = async ({ genreName }) => {
  try {
    const genreCreated = await Genre.query().insertAndFetch({ genreName });
    return genreCreated;
  } catch (error) {
    throw handleDBError(error);
  }
};

const updateById = async (genreId, { genreName }) => {
  try {
    const genreUpdated = await Genre.query().updateAndFetchById(genreId, {
      genreName,
    });
    return genreUpdated;
  } catch (error) {
    throw handleDBError(error);
  }
};

const deleteById = async (genreId) => {
  try {
    const genreDeleted = await Genre.query().deleteById(genreId);
    if (genreDeleted !== 1) {
      throw ServiceError.notFound(`No genre with id ${genreId} exists`, {
        genreId,
      });
    }
  } catch (error) {
    throw handleDBError(error);
  }
};

// get all songs with a certain genre
// const getAllSongById = async (genreId) => {
//   if (genreId) {
//     const existingGenre = await getSongsByGenreId(genreId);

//     if (!existingGenre) {
//       throw ServiceError.notFound(`No genre with id ${genreId} exists`, { genreId });
//     }
//   }

//   try {
//     const songs = await Genre.relatedQuery('songs').for(genreId);
//     return songs;
//   } catch (error) {
//     throw handleDBError(error);
//   }
// }

module.exports = {
  getAll,
  getSongsByGenreId,
  create,
  updateById,
  deleteById,
};
