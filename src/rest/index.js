const Router = require('@koa/router');
const installGenreRouter = require('./genre');
const installPlaylistRouter = require('./playlist');
const installSongRouter = require('./song');
const installUserRouter = require('./user');
const installHealthRouter = require('./health');

module.exports = (app) => {
  const router = new Router({ prefix: '/api' });

  installHealthRouter(router);
  installGenreRouter(router);
  installPlaylistRouter(router);
  installSongRouter(router);
  installUserRouter(router);

  app.use(router.routes()).use(router.allowedMethods());
}
