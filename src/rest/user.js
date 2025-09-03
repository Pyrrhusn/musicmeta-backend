const Router = require("@koa/router");
const userService = require("../service/user");
const Joi = require("joi");
const validate = require("../core/validation");
const { requireAuthentication, makeRequireRole } = require("../core/auth");
const Role = require("../core/roles");

const login = async (ctx) => {
  const { email, password } = ctx.request.body;
  const token = await userService.login(email, password);
  ctx.body = token;
};

login.validationScheme = {
  body: {
    email: Joi.string().email(),
    password: Joi.string(),
  },
};

/**
 * Check if the signed in user can access the given user's information.
 */
const checkUserId = (ctx, next) => {
  const { userId, roles } = ctx.state.session;
  const { id } = ctx.params;

  // You can only get our own data unless you're an admin
  if (id !== userId && !roles.includes(Role.ADMIN)) {
    return ctx.throw(
      403,
      "You are not allowed to view this user's information",
      {
        code: "FORBIDDEN",
      }
    );
  }
  return next();
};

const getAll = async (ctx) => {
  ctx.body = await userService.getAll();
};

getAll.validationScheme = null;

const getById = async (ctx) => {
  ctx.body = await userService.getById(Number(ctx.params.id));
};

getById.validationScheme = {
  params: Joi.object({
    id: Joi.number().integer().positive(),
  }),
};

const create = async (ctx) => {
  const token = await userService.create({ ...ctx.request.body });
  ctx.body = token;
  ctx.status = 200;
};

create.validationScheme = {
  body: {
    username: Joi.string().min(1).max(50),
    email: Joi.string().email(),
    password: Joi.string().min(8).max(32),
    birthDate: Joi.date().max("now").optional(),
    isArtist: Joi.boolean(),
    about: Joi.string().max(420).optional(),
    pictureLocation: Joi.string().optional(),
  },
};

const updateById = async (ctx) => {
  ctx.body = await userService.updateById(Number(ctx.params.id), {
    ...ctx.request.body,
  });
};

updateById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    username: Joi.string().min(1).max(50),
    birthDate: Joi.date().max("now").optional(),
    about: Joi.string().max(420).optional(),
  },
};

const deleteById = async (ctx) => {
  await userService.deleteById(Number(ctx.params.id));
  ctx.status = 204;
};

deleteById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const getAllPlaylistByUserId = async (ctx) => {
  ctx.body = await userService.getAllPlaylistByUserId(Number(ctx.params.id));
};

getAllPlaylistByUserId.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const getAllSongsRatingById = async (ctx) => {
  ctx.body = await userService.getAllSongsRatingById(Number(ctx.params.id));
};

getAllSongsRatingById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

// const getSongRatingById = async (ctx) => {
//   ctx.body = await userService.getSongRatingById(Number(ctx.params.id), Number(ctx.params.songId));
// }

// getSongRatingById.validationScheme = {
//   params: {
//     id: Joi.number().integer().positive(),
//     songId: Joi.number().integer().positive()
//   }
// };

const addSongRatingById = async (ctx) => {
  const userSongRatingAdded = await userService.addSongRatingById(
    Number(ctx.params.id),
    { ...ctx.request.body }
  );
  ctx.status = 201;
  ctx.body = userSongRatingAdded;
};

addSongRatingById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    songId: Joi.number().integer().positive(),
    rating: Joi.number().integer().positive().min(1).max(5),
  },
};

const updateSongRatingById = async (ctx) => {
  ctx.body = await userService.updateSongRatingById(
    Number(ctx.params.id),
    Number(ctx.params.songId),
    { ...ctx.request.body }
  );
};

updateSongRatingById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
    songId: Joi.number().integer().positive(),
  },
  body: {
    rating: Joi.number().integer().positive().min(1).max(5),
  },
};

const deleteSongRatingById = async (ctx) => {
  await userService.deleteSongRatingById(
    Number(ctx.params.id),
    Number(ctx.params.songId)
  );
  ctx.status = 204;
};

deleteSongRatingById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
    songId: Joi.number().integer().positive(),
  },
};

const getAllSongsById = async (ctx) => {
  ctx.body = await userService.getAllSongsById(Number(ctx.params.id));
};

getAllSongsById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const getAllGenrePreferencesById = async (ctx) => {
  ctx.body = await userService.getAllGenrePreferencesById(
    Number(ctx.params.id)
  );
};

getAllGenrePreferencesById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const addGenrePreferenceById = async (ctx) => {
  const userGenrePreferenceAdded = await userService.addGenrePreferenceById(
    Number(ctx.params.id),
    { ...ctx.request.body }
  );
  ctx.status = 201;
  ctx.body = userGenrePreferenceAdded;
};

addGenrePreferenceById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    genreId: Joi.number().integer().positive(),
  },
};

const deleteGenrePreferenceById = async (ctx) => {
  await userService.deleteGenrePreferenceById(
    Number(ctx.params.id),
    Number(ctx.params.genreId)
  );
  ctx.status = 204;
};

deleteGenrePreferenceById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
    genreId: Joi.number().integer().positive(),
  },
};

module.exports = (app) => {
  const router = new Router({ prefix: "/users" });

  // Public routes
  router.post("/login", validate(login.validationScheme), login);
  router.post("/register", validate(create.validationScheme), create);
  // router.get('/:id/songs', requireAuthentication, requireArtist, validate(getAllSongsById.validationScheme), checkUserId, getAllSongsById);
  router.get(
    "/:id/songs",
    validate(getAllSongsById.validationScheme),
    getAllSongsById
  );

  const requireAdmin = makeRequireRole([Role.ADMIN]);
  const requireArtist = makeRequireRole([Role.ARTIST]);

  // Routes with authentication/authorization
  router.get(
    "/",
    requireAuthentication,
    requireAdmin,
    validate(getAll.validationScheme),
    getAll
  );
  router.get(
    "/:id",
    requireAuthentication,
    validate(getById.validationScheme),
    checkUserId,
    getById
  );
  router.put(
    "/:id",
    requireAuthentication,
    validate(updateById.validationScheme),
    checkUserId,
    updateById
  );
  router.delete(
    "/:id",
    requireAuthentication,
    validate(deleteById.validationScheme),
    checkUserId,
    deleteById
  );
  router.get(
    "/:id/playlists",
    requireAuthentication,
    validate(getAllPlaylistByUserId.validationScheme),
    checkUserId,
    getAllPlaylistByUserId
  );
  router.get(
    "/:id/ratings",
    requireAuthentication,
    validate(getAllSongsRatingById.validationScheme),
    checkUserId,
    getAllSongsRatingById
  );
  // router.get('/:id/ratings/:songId', requireAuthentication, validate(getSongRatingById.validationScheme), checkUserId, getSongRatingById);
  router.post(
    "/:id/ratings",
    requireAuthentication,
    validate(addSongRatingById.validationScheme),
    checkUserId,
    addSongRatingById
  );
  router.put(
    "/:id/ratings/:songId",
    requireAuthentication,
    validate(updateSongRatingById.validationScheme),
    checkUserId,
    updateSongRatingById
  );
  router.delete(
    "/:id/ratings/:songId",
    requireAuthentication,
    validate(deleteSongRatingById.validationScheme),
    checkUserId,
    deleteSongRatingById
  );
  router.get(
    "/:id/genres",
    requireAuthentication,
    validate(getAllGenrePreferencesById.validationScheme),
    checkUserId,
    getAllGenrePreferencesById
  );
  router.post(
    "/:id/genres",
    requireAuthentication,
    validate(addGenrePreferenceById.validationScheme),
    checkUserId,
    addGenrePreferenceById
  );
  router.delete(
    "/:id/genres/:genreId",
    requireAuthentication,
    validate(deleteGenrePreferenceById.validationScheme),
    checkUserId,
    deleteGenrePreferenceById
  );

  app.use(router.routes()).use(router.allowedMethods());
};
