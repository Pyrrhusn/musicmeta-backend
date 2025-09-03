const userService = require('../service/user');

const requireAuthentication = async (ctx, next) => {
  const { authorization } = ctx.headers;

  const { authToken, ...session } = await userService.checkAndParseSession(
    authorization
  );

  ctx.state.session = session;
  ctx.state.authToken = authToken;

  return next();
};

const makeRequireRole = (requireRoles) => async (ctx, next) => {
  const { roles = [] } = ctx.state.session;

  userService.checkRole(requireRoles, roles);
  return next();
};

module.exports = {
  requireAuthentication,
  makeRequireRole,
};
