const Router = require("@koa/router");
const playlistService = require("../service/playlist");
const Joi = require("joi");
const validate = require("../core/validation");
const { requireAuthentication } = require("../core/auth");

const getAll = async (ctx) => {
  ctx.body = await playlistService.getAll(ctx.state.session.userId);
};

getAll.validationScheme = null;

const getSongsByPlaylistId = async (ctx) => {
  ctx.body = await playlistService.getSongsByPlaylistId(
    Number(ctx.params.id),
    ctx.state.session.userId
  );
};

getSongsByPlaylistId.validationScheme = {
  params: Joi.object({
    id: Joi.number().integer().positive(),
  }),
};

// const getAllSongById = async (ctx) => {
//   ctx.body = await playlistService.getAllSongById(Number(ctx.params.id), ctx.state.session.userId);
// }

// getAllSongById.validationScheme = {
//   params: Joi.object({
//     id: Joi.number().integer().positive()
//   })
// };

const create = async (ctx) => {
  const playlist = await playlistService.create({
    ownerId: ctx.state.session.userId,
    ...ctx.request.body,
  });
  ctx.status = 201;
  ctx.body = playlist;
};

create.validationScheme = {
  body: {
    // ownerId: Joi.number().integer().positive(),
    name: Joi.string().min(1).max(100),
    creationDate: Joi.date().max("now"),
  },
};

const updateById = async (ctx) => {
  ctx.body = await playlistService.updateById(
    Number(ctx.params.id),
    ctx.state.session.userId,
    { ...ctx.request.body }
  );
};

updateById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    name: Joi.string().min(1).max(100),
  },
};

const deleteById = async (ctx) => {
  await playlistService.deleteById(
    Number(ctx.params.id),
    ctx.state.session.userId
  );
  ctx.status = 204;
};

deleteById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

const addSongById = async (ctx) => {
  const songAdded = await playlistService.addSongById(
    Number(ctx.params.id),
    ctx.state.session.userId,
    Number(ctx.request.body.songId),
    ctx.request.body.addedOnDate
  );
  ctx.status = 201;
  ctx.body = songAdded;
};

addSongById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    songId: Joi.number().integer().positive(),
    addedOnDate: Joi.date().iso().max("now"),
  },
};

const deleteSongById = async (ctx) => {
  await playlistService.deleteSongById(
    Number(ctx.params.id),
    Number(ctx.params.songId),
    ctx.state.session.userId
  );
  ctx.status = 204;
};

deleteSongById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
    songId: Joi.number().integer().positive(),
  },
};

module.exports = (app) => {
  const router = new Router({ prefix: "/playlists" });

  router.use(requireAuthentication);

  // Routes with authentication/authorization
  router.get("/", validate(getAll.validationScheme), getAll);
  router.get(
    "/:id",
    validate(getSongsByPlaylistId.validationScheme),
    getSongsByPlaylistId
  );
  router.post("/", validate(create.validationScheme), create);
  router.put("/:id", validate(updateById.validationScheme), updateById);
  router.delete("/:id", validate(deleteById.validationScheme), deleteById);
  // router.get('/:id/songs', validate(getAllSongById.validationScheme), getAllSongById);
  router.post(
    "/:id/songs",
    validate(addSongById.validationScheme),
    addSongById
  );
  router.delete(
    "/:id/songs/:songId",
    validate(deleteSongById.validationScheme),
    deleteSongById
  );

  app.use(router.routes()).use(router.allowedMethods());
};
