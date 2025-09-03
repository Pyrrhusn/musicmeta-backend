const User = require('../../src/models/User');
const Genre = require('../../src/models/Genre');
const Song = require('../../src/models/Song');
const Playlist = require('../../src/models/Playlist');
const { tables } = require('../../src/data/index');
const { withServer, login, loginAdmin } = require('../supertest.setup');
const { testAuthHeader } = require('../common/auth');
const Role = require('../../src/core/roles');

const data = {
  users: [
    {
      userId: 3,
      username: 'Test User 3',
      email: 'TestUser3@email.com',
      password_hash: 'hUHD8978>FHFJS',
      roles: JSON.stringify([Role.USER]),
      birthDate: new Date(2020, 4, 6),
      isArtist: true,
      about: 'User 3',
      pictureLocation: '/public/T/USER3/picture.png'
    },
    {
      userId: 4,
      username: 'Test User 4',
      email: 'TestUser4@email.com',
      password_hash: 'IJD67F092JK',
      roles: JSON.stringify([Role.USER]),
      birthDate: new Date(2021, 5, 7),
      isArtist: true,
      about: 'User 4',
      pictureLocation: '/public/T/USER4/picture.png'
    },
    {
      userId: 5,
      username: 'Test User 5',
      email: 'TestUser5@email.com',
      password_hash: 'FG458ZSJ09JK',
      roles: JSON.stringify([Role.USER]),
      birthDate: new Date(2021, 2, 1),
      isArtist: true,
      about: 'User 5',
      pictureLocation: '/public/T/USER5/picture.png'
    }
  ],
  songs: [
    {
      songId: 1,
      artistId: 1,
      title: 'Test Song 1',
      length: '01:00:00',
      releaseDate: new Date(2019, 10, 19),
      artLocation: '/public/T/USER1/T/SONG1/picture.png'
    },
    {
      songId: 2,
      artistId: 2,
      title: 'Test Song 2',
      length: '02:00:00',
      releaseDate: new Date(2020, 11, 20),
      artLocation: '/public/T/USER2/T/SONG2/picture.png'
    },
    {
      songId: 3,
      artistId: 3,
      title: 'Test Song 3',
      length: '03:00:00',
      releaseDate: new Date(2021, 12, 23),
      artLocation: '/public/T/USER3/T/SONG3/picture.png'
    }
  ],
  playlists: [
    {
      playlistId: 1,
      ownerId: 2,
      name: 'Test Playlist 1',
      creationDate: new Date(2023, 3, 4)
    },
    {
      playlistId: 2,
      ownerId: 1,
      name: 'Test Playlist 2',
      creationDate: new Date(2022, 2, 16)
    }
  ],
  genres: [
    {
      genreId: 1,
      genreName: 'Space Funk'
    },
    {
      genreId: 2,
      genreName: 'Rock'
    },
    {
      genreId: 3,
      genreName: 'Pyschedelic'
    }
  ],
  user_genre_preferences: [
    {
      userId: 1,
      genreId: 1
    },
    {
      userId: 3,
      genreId: 1
    },
    {
      userId: 2,
      genreId: 2
    },
    {
      userId: 3,
      genreId: 3
    }
  ],
  user_songs_rating: [
    {
      userId: 1,
      songId: 2,
      rating: 3
    },
    {
      userId: 2,
      songId: 3,
      rating: 5
    },
    {
      userId: 3,
      songId: 2,
      rating: 1
    }
  ]
}

const dataToDelete = {
  users: [3, 4, 5],
  songs: [1, 2, 3],
  genres: [1, 2, 3],
  playlists: [1, 2]
}

describe('Users', () => {
  let request, knex, authHeader, adminAuthHeader;

  withServer(({
    supertest,
    knex: k,
  }) => {
    request = supertest;
    knex = k;
  });

  beforeAll(async () => {
    authHeader = await login(request);
    adminAuthHeader = await loginAdmin(request);
  });

  const url = '/api/users';

  describe('GET /api/users', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
    });

    it('should 200 and return all users', async () => {
      const response = await request.get(url).set('Authorization', adminAuthHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
      expect(response.body[0]).toEqual(
        {
          userId: 2,
          username: 'Admin User',
          email: 'admin.user@hogent.be',
          roles: [Role.ADMIN, Role.USER],
          birthDate: new Date(2021, 1, 29).toJSON(),
          isArtist: 1,
          about: 'User 5 Admin',
          pictureLocation: '/public/T/USER5/picture.png'
        }
      );
      expect(response.body[1]).toEqual(
        {
          userId: 1,
          username: 'Test User',
          email: 'test.user@hogent.be',
          roles: [Role.USER],
          birthDate: new Date(2021, 1, 29).toJSON(),
          isArtist: 1,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
    });

    it('should 400 when given an argument', async () => {
      const response = await request.get(`${url}?invalid=true`).set('Authorization', adminAuthHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.query).toHaveProperty('invalid');
    });

    testAuthHeader(() => request.get(url));
  });

  describe('GET /api/users/:id', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
    });

    it('should 200 and return the user of corresponding id', async () => {
      const response = await request.get(`${url}/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        {
          userId: 1,
          username: 'Test User',
          email: 'test.user@hogent.be',
          roles: [Role.USER],
          birthDate: new Date(2021, 2, 1).toJSON(),
          isArtist: 1,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
    });

    it('should 404 when requesting non existing user', async () => {
      const response = await request.get(`${url}/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.get(`${url}/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1`));
  });

  describe('GET /api/users/:id/playlists', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
      await Playlist.query().insertGraph(data.playlists);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
    });

    it('should 200 and return all playlists owned by the user', async () => {
      const response = await request.get(`${url}/1/playlists`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toEqual(
        {
          playlistId: 2,
          ownerId: 1,
          name: 'Test Playlist 2',
          creationDate: new Date(2022, 2, 16).toJSON()
        }
      );
    });

    it('should 404 when requesting playlists of non existing user', async () => {
      const response = await request.get(`${url}/42/playlists`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.get(`${url}/invalid/playlists`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1/playlists`));
  });

  describe('GET /api/users/:id/ratings', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
      await Song.query().insertGraph(data.songs);
      await knex(tables.userSongRating).insert(data.user_songs_rating);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 200 and return all ratings of songs rated by the user', async () => {
      const response = await request.get(`${url}/1/ratings`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toEqual(
        {
          songId: 2,
          artistId: 2,
          title: 'Test Song 2',
          length: '02:00:00',
          releaseDate: new Date(2020, 11, 20).toJSON(),
          artLocation: '/public/T/USER2/T/SONG2/picture.png',
          rating: 3
        }
      );
    });

    it('should 404 when requesting song ratings of non existing user', async () => {
      const response = await request.get(`${url}/42/ratings`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.get(`${url}/invalid/ratings`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1/ratings`));
  });

  describe('GET /api/users/:id/ratings/:songId', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
      await Song.query().insertGraph(data.songs);
      await knex(tables.userSongRating).insert(data.user_songs_rating);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 200 and return the rating of a song rated by the user', async () => {
      const response = await request.get(`${url}/1/ratings/2`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        {
          songId: 2,
          artistId: 2,
          title: 'Test Song 2',
          length: '02:00:00',
          releaseDate: new Date(2020, 11, 20).toJSON(),
          artLocation: '/public/T/USER2/T/SONG2/picture.png',
          rating: 3
        }
      );
    });

    it('should 404 when requesting song rating of non existing user', async () => {
      const response = await request.get(`${url}/42/ratings/3`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.get(`${url}/invalid/ratings/3`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 404 when requesting song rating of non rated song', async () => {
      const response = await request.get(`${url}/1/ratings/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No song with id 42 exists',
        details: {
          songId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid song id', async () => {
      const response = await request.get(`${url}/1/ratings/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('songId');
    });

    testAuthHeader(() => request.get(`${url}/1/ratings/2`));
  });

  describe('GET /api/users/:id/songs', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
      await Song.query().insertGraph(data.songs);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it("should 200 and return all songs that the user is the artist of", async () => {
      const response = await request.get(`${url}/1/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toEqual(
        {
          songId: 1,
          artistId: 1,
          title: 'Test Song 1',
          length: '01:00:00',
          releaseDate: new Date(2019, 10, 19).toJSON(),
          artLocation: '/public/T/USER1/T/SONG1/picture.png'
        }
      );
    });

    it('should 404 when requesting songs of non existing user', async () => {
      const response = await request.get(`${url}/42/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.get(`${url}/invalid/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1/songs`));
  });

  describe('GET /api/users/:id/genres', () => {
    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
      await User.query().insertGraph(data.users);
      await knex(tables.userGenrePreference).insert(data.user_genre_preferences);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
      await User.query().whereIn('userId', dataToDelete.users).delete();
    });

    it('should 200 and return all genres that the user likes to listen to', async () => {
      const response = await request.get(`${url}/1/genres`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toEqual(
        {
          genreId: 1,
          genreName: 'Space Funk'
        }
      );
    });

    it('should 404 when requesting genre preferences of non existing user', async () => {
      const response = await request.get(`${url}/42/genres`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.get(`${url}/invalid/genres`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1/genres`));
  });

  describe('POST /api/users/register', () => {
    afterAll(async () => {
      await User.query().where('userId', '>', 2).delete();
    });

    it('should 200 and return the created user', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(200);
      expect(response.body.user.userId).toBeTruthy();
      expect(response.body.user.username).toBe('Test User 4');
      expect(response.body.user.email).toBe('TestUser4@email.com');
      expect(response.body.user.password_hash).toBeUndefined();
      expect(response.body.user.roles).toStrictEqual([Role.USER]);
      expect(response.body.user.birthDate).toBe(new Date(2021, 1, 1).toJSON());
      expect(response.body.user.isArtist).toBe(1);
      expect(response.body.user.about).toBe('User 4');
      expect(response.body.user.pictureLocation).toBe('/public/T/USER4/picture.png');
    });

    it('should 400 when missing username', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('username');
    });

    it('should 400 when username less than 1 character', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: '',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('username');
    });

    it('should 400 when username greater than 50 charachter', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4dfgfdgdgszeizurapriisdhbvbdniztyuzioghsgs',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('username');
    });

    it('should 400 when username not a string', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 42,
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('username');
    });

    it('should 400 when email not a valid format', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('email');
    });

    it('should 400 when email not a string', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 42,
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('email');
    });

    it('should 400 when missing password', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should 400 when password less than 8 character', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG45',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should 400 when password greater than 32 charachter', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JKjndgklsdgnopsjgpsognspgnpziazpoaertivbn',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should 400 when password not a string', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 45,
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should 400 when missing birth date', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('birthDate');
    });

    it('should 400 when birth date in future', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2042, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('birthDate');
    });

    it('should 400 when missing whether user is artist', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('isArtist');
    });

    it('should 400 when whether user is artist not a boolean', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: 42,
          about: 'User 4',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('isArtist');
    });

    it('should 400 when missing about bio', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('about');
    });

    it('should 400 when about bio greater than 420 characters', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris consequat varius augue vitae placerat. Pellentesque mi mauris, dignissim et velit sed, sodales varius dui. Maecenas pretium vel risus eleifend luctus. Maecenas finibus bibendum arcu ut maximus. In lorem diam, accumsan et enim et, malesuada cursus risus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras tempor lectus ac laoreet volutpat. Ut eget lorem in orci feugiat blandit. Phasellus libero mi, aliquet quis nisi ac, lacinia malesuada arcu. Integer pulvinar pretium arcu, sit amet luctus arcu iaculis id.',
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('about');
    });

    it('should 400 when about bio not a string', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 42,
          pictureLocation: '/public/T/USER4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('about');
    });

    it('should 400 when missing picture location', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('pictureLocation');
    });

    it('should 400 when picture location not a string', async () => {
      const response = await request.post(`${url}/register`).send(
        {
          username: 'Test User 4',
          email: 'TestUser4@email.com',
          password: 'FG458ZSJ09JK',
          roles: JSON.stringify([Role.USER]),
          birthDate: new Date(2021, 1, 1).toJSON(),
          isArtist: true,
          about: 'User 4',
          pictureLocation: 42
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('pictureLocation');
    });
  });

  describe('POST /api/users/:id/ratings', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
      await Song.query().insertGraph(data.songs);
      await knex(tables.userSongRating).insert(data.user_songs_rating);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 201 and return the added rating and rated song for the user', async () => {
      const response = await request.post(`${url}/1/ratings`).set('Authorization', authHeader).send(
        {
          songId: 3,
          rating: 5
        }
      );
      expect(response.statusCode).toBe(201);
      expect(response.body.songId).toBe(3);
      expect(response.body.artistId).toBe(3);
      expect(response.body.title).toBe('Test Song 3');
      expect(response.body.length).toBe('03:00:00');
      expect(response.body.releaseDate).toBe(new Date(2022, 0, 23).toJSON());
      expect(response.body.artLocation).toBe('/public/T/USER3/T/SONG3/picture.png');
      expect(response.body.rating).toBe(5);
    });

    it('should 404 with non existing user', async () => {
      const response = await request.post(`${url}/42/ratings`).set('Authorization', authHeader).send(
        {
          songId: 3,
          rating: 5
        }
      );
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.post(`${url}/invalid/ratings`).set('Authorization', authHeader).send(
        {
          songId: 3,
          rating: 5
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 400 when missing song id', async () => {
      const response = await request.post(`${url}/1/ratings`).set('Authorization', authHeader).send(
        {
          rating: 5
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('songId');
    });

    it('should 400 when missing rating', async () => {
      const response = await request.post(`${url}/1/ratings`).set('Authorization', authHeader).send(
        {
          songId: 3
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('rating');
    });

    it('should 400 when song id is a decimal', async () => {
      const response = await request.post(`${url}/1/ratings`).set('Authorization', authHeader).send(
        {
          songId: 4.2,
          rating: 5
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('songId');
    });

    it('should 400 when song id a string', async () => {
      const response = await request.post(`${url}/1/ratings`).set('Authorization', authHeader).send(
        {
          songId: 'songId',
          rating: 5
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('songId');
    });

    it('should 400 when rating is a decimal', async () => {
      const response = await request.post(`${url}/1/ratings`).set('Authorization', authHeader).send(
        {
          songId: 3,
          rating: 4.2
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('rating');
    });

    it('should 400 when rating a string', async () => {
      const response = await request.post(`${url}/1/ratings`).set('Authorization', authHeader).send(
        {
          songId: 3,
          rating: 'rating'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('rating');
    });

    testAuthHeader(() => request.post(`${url}/1/ratings`));
  });

  describe('POST /api/users/:id/genres', () => {
    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
      await User.query().insertGraph(data.users);
      await knex(tables.userGenrePreference).insert(data.user_genre_preferences);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
      await User.query().whereIn('userId', dataToDelete.users).delete();
    });

    it('should 201 and return the added genre prefered by the user', async () => {
      const response = await request.post(`${url}/1/genres`).set('Authorization', authHeader).send(
        {
          genreId: 2
        }
      );
      expect(response.statusCode).toBe(201);
      expect(response.body.genreId).toBe(2);
      expect(response.body.genreName).toBe('Rock');
    });

    it('should 404 with non existing user', async () => {
      const response = await request.post(`${url}/42/genres`).set('Authorization', authHeader).send(
        {
          genreId: 2
        }
      );
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.post(`${url}/invalid/genres`).set('Authorization', authHeader).send(
        {
          genreId: 2
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 400 when missing genre id', async () => {
      const response = await request.post(`${url}/1/genres`).set('Authorization', authHeader).send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreId');
    });

    it('should 400 when genre id a decimal', async () => {
      const response = await request.post(`${url}/1/genres`).set('Authorization', authHeader).send(
        {
          genreId: 4.2
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreId');
    });

    it('should 400 when genre id a string', async () => {
      const response = await request.post(`${url}/1/genres`).set('Authorization', authHeader).send(
        {
          genreId: 'genreId'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreId');
    });

    testAuthHeader(() => request.post(`${url}/1/genres`));
  });

  describe('PUT /api/users/:id', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
    });

    it('should 200 and return the updated user', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 3 NEW',
          email: 'TestUser3NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 3 NEW',
        }
      );
      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toBeTruthy();
      expect(response.body.username).toBe('Test User 3 NEW');
      expect(response.body.email).toBe('TestUser3NEW@email.com');
      expect(response.body.password_hash).toBeUndefined();
      expect(response.body.roles).toStrictEqual([Role.USER]);
      expect(response.body.birthDate).toBe(new Date(2018, 3, 6).toJSON());
      expect(response.body.isArtist).toBe(1);
      expect(response.body.about).toBe('User 3 NEW');
      expect(response.body.pictureLocation).toBe('/public/T/USER3/picture.png');
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.put(`${url}/invalid`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 400 for duplicate username', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 4',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'A user with this name already exists',
        details: {}
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 for duplicate email', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser4@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'There is already a user with this email address',
        details: {}
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 when missing username', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('username');
    });

    it('should 400 when username less than 1 character', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: '',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('username');
    });

    it('should 400 when username greater than 50 charachter', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 4dfgfdgdgszeizurapriisdhbvbdniztyuzioghsgs',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('username');
    });

    it('should 400 when username not a string', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 42,
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('username');
    });

    it('should 400 when email not a valid format', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('email');
    });

    it('should 400 when email not a string', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 42,
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('email');
    });

    it('should 400 when missing password', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should 400 when password less than 8 character', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 'NEWST',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should 400 when password greater than 32 charachter', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORDzioerzpp^cvbnuiqyhdiuIGFEUIFB',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should 400 when password not a string', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 42,
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should 400 when missing birth date', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('birthDate');
    });

    it('should 400 when birth date in future', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2042, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('birthDate');
    });

    it('should 400 when missing about bio', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('about');
    });

    it('should 400 when about bio greater than 420 characters', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris consequat varius augue vitae placerat. Pellentesque mi mauris, dignissim et velit sed, sodales varius dui. Maecenas pretium vel risus eleifend luctus. Maecenas finibus bibendum arcu ut maximus. In lorem diam, accumsan et enim et, malesuada cursus risus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras tempor lectus ac laoreet volutpat. Ut eget lorem in orci feugiat blandit. Phasellus libero mi, aliquet quis nisi ac, lacinia malesuada arcu. Integer pulvinar pretium arcu, sit amet luctus arcu iaculis id.',
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('about');
    });

    it('should 400 when about bio not a string', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', adminAuthHeader).send(
        {
          username: 'Test User 1 NEW',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 42,
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('about');
    });

    it('should 403 when not admin', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', authHeader).send(
        {
          username: 'Test',
          email: 'TestUser1NEW@email.com',
          password: 'NEWSTRONGPASSWORD',
          birthDate: new Date(2018, 3, 6).toJSON(),
          about: 'User 1 NEW',
        }
      );
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    testAuthHeader(() => request.put(`${url}/3`));
  });

  describe('PUT /api/users/:id/ratings/:songId', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
      await Song.query().insertGraph(data.songs);
      await knex(tables.userSongRating).insert(data.user_songs_rating);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 200 and return the updated rating and the song', async () => {
      const response = await request.put(`${url}/1/ratings/2`).set('Authorization', authHeader).send(
        {
          rating: 1
        }
      );
      expect(response.statusCode).toBe(200);
      expect(response.body.songId).toBe(2);
      expect(response.body.artistId).toBe(2);
      expect(response.body.title).toBe('Test Song 2');
      expect(response.body.length).toBe('02:00:00');
      expect(response.body.releaseDate).toBe(new Date(2020, 11, 20).toJSON());
      expect(response.body.artLocation).toBe('/public/T/USER2/T/SONG2/picture.png');
      expect(response.body.rating).toBe(1);
    });

    it('should 404 with non existing user', async () => {
      const response = await request.put(`${url}/42/ratings/2`).set('Authorization', authHeader).send(
        {
          rating: 1
        }
      );
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.put(`${url}/invalid/ratings/2`).set('Authorization', authHeader).send(
        {
          rating: 1
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 404 with non existing song id', async () => {
      const response = await request.put(`${url}/1/ratings/42`).set('Authorization', authHeader).send(
        {
          rating: 1
        }
      );
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No song with id 42 exists',
        details: {
          songId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid song id', async () => {
      const response = await request.put(`${url}/1/ratings/invalid`).set('Authorization', authHeader).send(
        {
          rating: 1
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('songId');
    });

    it('should 400 when missing rating', async () => {
      const response = await request.put(`${url}/1/ratings/2`).set('Authorization', authHeader).send(
        {}
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('rating');
    });

    it('should 400 when rating is a decimal', async () => {
      const response = await request.put(`${url}/1/ratings/2`).set('Authorization', authHeader).send(
        {
          rating: 4.2
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('rating');
    });

    it('should 400 when rating a string', async () => {
      const response = await request.put(`${url}/1/ratings/2`).set('Authorization', authHeader).send(
        {
          rating: 'rating'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('rating');
    });

    testAuthHeader(() => request.put(`${url}/1/ratings/2`));
  });

  describe('DELETE /api/users/:id', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
    });

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/3`).set('Authorization', adminAuthHeader);
      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 with non existing user', async () => {
      const response = await request.delete(`${url}/42`).set('Authorization', adminAuthHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No user with id 42 exists',
        details: {
          userId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.delete(`${url}/invalid`).set('Authorization', adminAuthHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 403 when not admin', async () => {
      const response = await request.delete(`${url}/3`)
        .set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    testAuthHeader(() => request.delete(`${url}/3`));
  });

  describe('DELETE /api/users/:id/ratings/:songId', () => {
    beforeAll(async () => {
      await User.query().insertGraph(data.users);
      await Song.query().insertGraph(data.songs);
      await knex(tables.userSongRating).insert(data.user_songs_rating);
    });

    afterAll(async () => {
      await User.query().whereIn('userId', dataToDelete.users).delete();
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/1/ratings/2`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 with non existing user', async () => {
      const response = await request.delete(`${url}/42/ratings/2`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.delete(`${url}/invalid/ratings/2`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 404 with non existing song id', async () => {
      const response = await request.delete(`${url}/1/ratings/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No user with id 1 exists or no song with id 42 has a rating',
        details: {
          songId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid song id', async () => {
      const response = await request.delete(`${url}/1/ratings/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('songId');
    });

    testAuthHeader(() => request.delete(`${url}/1/ratings/2`));
  });

  describe('DELETE /api/users/:id/genres/:genreId', () => {
    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
      await User.query().insertGraph(data.users);
      await knex(tables.userGenrePreference).insert(data.user_genre_preferences);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
      await User.query().whereIn('userId', dataToDelete.users).delete();
    });

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/1/genres/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 with non existing user', async () => {
      const response = await request.delete(`${url}/42/genres/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this user\'s information',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid user id', async () => {
      const response = await request.delete(`${url}/invalid/genres/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });
  });

  it('should 404 with non existing genre', async () => {
    const response = await request.delete(`${url}/1/genres/42`).set('Authorization', authHeader);
    expect(response.statusCode).toBe(404);
    expect(response.body).toMatchObject({
      code: 'NOT_FOUND',
      message: 'No user with id 1 exists or no genre with id 42 in preferences',
      details: {
        userId: 1,
        genreId: 42
      }
    });
    expect(response.body.stack).toBeTruthy();
  });

  it('should 400 with invalid genre id', async () => {
    const response = await request.delete(`${url}/1/genres/invalid`).set('Authorization', authHeader);
    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(response.body.details.params).toHaveProperty('genreId');
  });

  testAuthHeader(() => request.delete(`${url}/1/genres/1`));
});
