const Genre = require('../../src/models/Genre');
const Song = require('../../src/models/Song');
const { tables } = require('../../src/data/index');
const { withServer, loginAdmin } = require('../supertest.setup');
const { testAuthHeader } = require('../common/auth');

const data = {
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
      artistId: 1,
      title: 'Test Song 3',
      length: '03:00:00',
      releaseDate: new Date(2021, 12, 23),
      artLocation: '/public/T/USER3/T/SONG3/picture.png'
    }
  ],
  song_genres: [
    {
      songId: 1,
      genreId: 1
    },
    {
      songId: 3,
      genreId: 1
    },
    {
      songId: 2,
      genreId: 2
    },
    {
      songId: 3,
      genreId: 3
    }
  ]
}

const dataToDelete = {
  genres: [1, 2, 3],
  songs: [1, 2, 3]
}

describe('Genres', () => {
  let request, knex, authHeader;

  withServer(({
    supertest,
    knex: k,
  }) => {
    request = supertest;
    knex = k;
  });

  beforeAll(async () => {
    authHeader = await loginAdmin(request);
  });

  const url = '/api/genres';

  describe('GET /api/genres', () => {
    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
    });

    it('should 200 and return all genres', async () => {
      const response = await request.get(url).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toEqual(
        {
          genreId: 1,
          genreName: 'Space Funk'
        }
      );
      expect(response.body[1]).toEqual(
        {
          genreId: 2,
          genreName: 'Rock'
        }
      );
      expect(response.body[2]).toEqual(
        {
          genreId: 3,
          genreName: 'Pyschedelic'
        }
      );
    });

    it('should 400 when given an argument', async () => {
      const response = await request.get(`${url}?invalid=true`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.query).toHaveProperty('invalid');
    });

    testAuthHeader(() => request.get(url));
  });

  describe('GET /api/genres/:id', () => {
    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
    });

    it('should 200 and return the genre of corresponding id', async () => {
      const response = await request.get(`${url}/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        {
          genreId: 1,
          genreName: 'Space Funk'
        }
      );
    });

    it('should 404 when requesting non existing genre', async () => {
      const response = await request.get(`${url}/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No genre with id 42 exists',
        details: {
          genreId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid genre id', async () => {
      const response = await request.get(`${url}/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1`));
  });

  describe('GET /api/genres/:id/songs', () => {
    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
      await Song.query().insertGraph(data.songs);
      await knex(tables.songGenre).insert(data.song_genres);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 200 and return all songs of a genre of corresponding id', async () => {
      const response = await request.get(`${url}/1/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(2);
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
      expect(response.body[1]).toEqual(
        {
          songId: 3,
          artistId: 1,
          title: 'Test Song 3',
          length: '03:00:00',
          releaseDate: new Date(2021, 12, 23).toJSON(),
          artLocation: '/public/T/USER3/T/SONG3/picture.png'
        }
      );
    });

    it('should 404 when requesting songs of non existing genre', async () => {
      const response = await request.get(`${url}/42/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No genre with id 42 exists',
        details: {
          genreId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid genre id', async () => {
      const response = await request.get(`${url}/invalid/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1/songs`));
  });

  describe('POST /api/genres', () => {
    const genresToDelete = [];

    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', genresToDelete).delete();
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
    });

    it('should 201 and return the created genre', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send({
        genreName: 'Alternative'
      });
      expect(response.statusCode).toBe(201);
      expect(response.body.genreId).toBeTruthy();
      expect(response.body.genreName).toBe('Alternative');

      genresToDelete.push(response.body.genreId);
    });

    it('should 400 when missing genre name', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreName');
    });

    it('should 400 when genre name less than 1 character', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send({
        genreName: ''
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreName');
    });

    it('should 400 when genre name longer than 25 characters', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send({
        genreName: 'Alternative Psychedelic Indie Math Rock'
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreName');
    });

    it('should 400 when genre name not a string', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send({
        genreName: 2
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreName');
    });

    testAuthHeader(() => request.post(url));
  });

  describe('PUT /api/genres/:id', () => {
    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
    });

    it('should 200 and return the updated genre', async () => {
      const response = await request.put(`${url}/3`).set('Authorization', authHeader).send({
        genreName: 'Australian Psychedelic'
      });
      expect(response.statusCode).toBe(200);
      expect(response.body.genreId).toBeTruthy();
      expect(response.body.genreName).toBe('Australian Psychedelic');
    });

    it('should 400 for duplicate genre name', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        genreName: 'Space Funk'
      });
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'A genre with this name already exists',
        details: {}
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 when missing genre name', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreName');
    });

    it('should 400 when genre name less than 1 character', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        genreName: ''
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreName');
    });

    it('should 400 when genre name longer than 25 characters', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        genreName: 'Alternative Psychedelic Indie Math Rock'
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreName');
    });

    it('should 400 when genre name not a string', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        genreName: 2
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreName');
    });

    testAuthHeader(() => request.put(`${url}/2`));
  });

  describe('DELETE /api/genres/:id', () => {
    beforeAll(async () => {
      await Genre.query().insertGraph(data.genres);
    });

    afterAll(async () => {
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
    });

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 with non existing genre', async () => {
      const response = await request.delete(`${url}/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No genre with id 42 exists',
        details: {
          genreId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid genre id', async () => {
      const response = await request.delete(`${url}/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.delete(`${url}/1`));
  });
});
