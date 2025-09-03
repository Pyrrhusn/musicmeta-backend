const config = require('config');
const { initializeLogger } = require('../src/core/logging');
const Role = require('../src/core/roles');
const { initializeData } = require('../src/data');
const User = require('../src/models/User');

module.exports = async () => {
  // Create a database connection
  initializeLogger({
    level: config.get('logging.level'),
    disabled: config.get('logging.disabled'),
  });
  await initializeData();

  await User.query().insertGraph([
    {
      userId: 1,
      username: 'Test User',
      email: 'test.user@hogent.be',
      password_hash:
        '$argon2id$v=19$m=2048,t=2,p=1$NF6PFLTgSYpDSex0iFeFQQ$Rz5ouoM9q3EH40hrq67BC3Ajsu/ohaHnkKBLunELLzU',
      roles: JSON.stringify([Role.USER]),
      birthDate: new Date(2021, 2, 1),
      isArtist: true,
      about: 'User 4',
      pictureLocation: '/public/T/USER4/picture.png'
    },
    {
      userId: 2,
      username: 'Admin User',
      email: 'admin.user@hogent.be',
      password_hash:
        '$argon2id$v=19$m=2048,t=2,p=1$NF6PFLTgSYpDSex0iFeFQQ$Rz5ouoM9q3EH40hrq67BC3Ajsu/ohaHnkKBLunELLzU',
      roles: JSON.stringify([Role.ADMIN, Role.USER]),
      birthDate: new Date(2021, 2, 1),
      isArtist: true,
      about: 'User 5 Admin',
      pictureLocation: '/public/T/USER5/picture.png'
    }
  ]);
};
