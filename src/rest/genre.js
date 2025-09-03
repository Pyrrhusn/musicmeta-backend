const Router = require('@koa/router');
const genreService = require('../service/genre');
const Joi = require('joi');
const validate = require('../core/validation');
const { requireAuthentication, makeRequireRole } = require('../core/auth');
const Role = require('../core/roles');

const getAll = async (ctx) => {
  ctx.body = await genreService.getAll();
}

getAll.validationScheme = null;

const getSongsByGenreId = async (ctx) => {
  ctx.body = await genreService.getSongsByGenreId(Number(ctx.params.id));
}

getSongsByGenreId.validationScheme = {
  params: Joi.object({
    id: Joi.number().integer().positive()
  })
};

// const getAllSongById = async (ctx) => {
//   ctx.body = await genreService.getAllSongById(Number(ctx.params.id));
// }

// getAllSongById.validationScheme = {
//   params: Joi.object({
//     id: Joi.number().integer().positive()
//   })
// };

const create = async (ctx) => {
  const genre = await genreService.create({ ...ctx.request.body });
  ctx.status = 201;
  ctx.body = genre;
}

create.validationScheme = {
  body: {
    genreName: Joi.string().min(1).max(25)
  }
};

const updateById = async (ctx) => {
  ctx.body = await genreService.updateById(Number(ctx.params.id), { ...ctx.request.body });
}

updateById.validationScheme = {
  params: {
    id: Joi.number().integer().positive()
  },
  body: {
    genreName: Joi.string().min(1).max(25)
  }
};

const deleteById = async (ctx) => {
  await genreService.deleteById(Number(ctx.params.id));
  ctx.status = 204;
}

deleteById.validationScheme = {
  params: {
    id: Joi.number().integer().positive()
  }
};

module.exports = (app) => {
  const router = new Router({ prefix: '/genres' });

  const requireAdmin = makeRequireRole([Role.ADMIN]);
  const requireAdminOrArtist = makeRequireRole([Role.ADMIN, Role.ARTIST]);

  // Public routes
  router.get('/', validate(getAll.validationScheme), getAll);
  router.get('/:id', validate(getSongsByGenreId.validationScheme), getSongsByGenreId);
  // router.get('/:id/songs', validate(getAllSongById.validationScheme), getAllSongById);

  router.use(requireAuthentication);
  // Routes with authentication/authorization
  router.post('/', requireAdminOrArtist, validate(create.validationScheme), create);
  router.put('/:id', requireAdmin, validate(updateById.validationScheme), updateById);
  router.delete('/:id', requireAdmin, validate(deleteById.validationScheme), deleteById);

  app.use(router.routes()).use(router.allowedMethods());
}
