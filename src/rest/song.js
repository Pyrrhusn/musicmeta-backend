const Router = require("@koa/router");
const songService = require("../service/song");
const Joi = require("joi");
const validate = require("../core/validation");
const { requireAuthentication, makeRequireRole } = require("../core/auth");
const Role = require("../core/roles");

const getAll = async (ctx) => {
  ctx.body = await songService.getAll();
};

getAll.validationScheme = null;

const getById = async (ctx) => {
  ctx.body = await songService.getById(
    Number(ctx.params.id),
    ctx.state.session.userId,
    true
  );
};

getById.validationScheme = {
  params: Joi.object({
    id: Joi.number().integer().positive(),
  }),
};

const create = async (ctx) => {
  const song = await songService.create({
    artistId: ctx.state.session.userId,
    ...ctx.request.body,
  });
  ctx.status = 201;
  ctx.body = song;
};

create.validationScheme = {
  body: {
    // artistId: Joi.number().integer().positive(),
    title: Joi.string().min(1).max(100),
    length: Joi.string().min(8).max(8),
    releaseDate: Joi.date().max("now"),
    artLocation: Joi.string(),
  },
};

const updateById = async (ctx) => {
  ctx.body = await songService.updateById(
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
    title: Joi.string().min(1).max(100),
    releaseDate: Joi.date().max("now"),
  },
};

const deleteById = async (ctx) => {
  await songService.deleteById(Number(ctx.params.id), ctx.state.session.userId);
  ctx.status = 204;
};

deleteById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
};

// const getAllGenreById = async (ctx) => {
//   ctx.body = await songService.getAllGenreById(Number(ctx.params.id));
// }

// getAllGenreById.validationScheme = {
//   params: {
//     id: Joi.number().integer().positive()
//   }
// }

const addGenreById = async (ctx) => {
  const genreAdded = await songService.addGenreById(
    Number(ctx.params.id),
    ctx.state.session.userId,
    { genreId: ctx.request.body.genreId }
  );
  ctx.status = 201;
  ctx.body = genreAdded;
};

addGenreById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
  },
  body: {
    genreId: Joi.number().integer().positive(),
  },
};

const deleteGenreById = async (ctx) => {
  await songService.deleteGenreById(
    Number(ctx.params.id),
    Number(ctx.params.genreId),
    ctx.state.session.userId
  );
  ctx.status = 204;
};

deleteGenreById.validationScheme = {
  params: {
    id: Joi.number().integer().positive(),
    genreId: Joi.number().integer().positive(),
  },
};

module.exports = (app) => {
  const router = new Router({ prefix: "/songs" });

  const requireAdminOrArtist = makeRequireRole([Role.ADMIN, Role.ARTIST]);

  // Public routes
  router.get("/", validate(getAll.validationScheme), getAll);
  // router.get('/:id/genres', validate(getAllGenreById.validationScheme), getAllGenreById);

  // Routes with authentication/authorization
  // Better to use checkRequiredRole as in user.js to only allow access to own data + use one less query in implementation??
  router.use(requireAuthentication);
  router.get(
    "/:id",
    requireAdminOrArtist,
    validate(getById.validationScheme),
    getById
  );
  router.post(
    "/",
    requireAdminOrArtist,
    validate(create.validationScheme),
    create
  );
  router.put(
    "/:id",
    requireAdminOrArtist,
    validate(updateById.validationScheme),
    updateById
  );
  router.delete(
    "/:id",
    requireAdminOrArtist,
    validate(deleteById.validationScheme),
    deleteById
  );
  router.post(
    "/:id/genres",
    requireAdminOrArtist,
    validate(addGenreById.validationScheme),
    addGenreById
  );
  router.delete(
    "/:id/genres/:genreId",
    requireAdminOrArtist,
    validate(deleteGenreById.validationScheme),
    deleteGenreById
  );

  app.use(router.routes()).use(router.allowedMethods());
};
