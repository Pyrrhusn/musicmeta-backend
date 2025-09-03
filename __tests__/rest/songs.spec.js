const Genre = require('../../src/models/Genre');
const Song = require('../../src/models/Song');
const { tables } = require('../../src/data/index');
const { withServer, login } = require('../supertest.setup');
const { testAuthHeader } = require('../common/auth');

const data = {
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
    },
    {
      songId: 4,
      artistId: 1,
      title: 'Test Song 4',
      length: '01:00:00',
      releaseDate: new Date(2019, 10, 19),
      artLocation: '/public/T/USER1/T/SONG1/picture.png'
    },
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
  songs: [1, 2, 3, 4],
  genres: [1, 2, 3]
}

describe('Songs', () => {
  let request, knex, authHeader;

  withServer(({
    supertest,
    knex: k,
  }) => {
    request = supertest;
    knex = k;
  });

  beforeAll(async () => {
    authHeader = await login(request);
  });

  const url = '/api/songs';

  describe('GET /api/songs', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 200 and return all songs', async () => {
      const response = await request.get(url).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(4);
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
          songId: 2,
          artistId: 2,
          title: 'Test Song 2',
          length: '02:00:00',
          releaseDate: new Date(2020, 11, 20).toJSON(),
          artLocation: '/public/T/USER2/T/SONG2/picture.png'
        }
      );
      expect(response.body[2]).toEqual(
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

    it('should 400 when given an argument', async () => {
      const response = await request.get(`${url}?invalid=true`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.query).toHaveProperty('invalid');
    });

    testAuthHeader(() => request.get(url));
  });

  describe('GET /api/songs/:id', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 200 and return the song of corresponding id', async () => {
      const response = await request.get(`${url}/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
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

    it('should 404 when requesting non existing song', async () => {
      const response = await request.get(`${url}/42`).set('Authorization', authHeader);
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
      const response = await request.get(`${url}/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1`));
  });

  describe('GET /api/songs/:id/genres', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
      await Genre.query().insertGraph(data.genres);
      await knex(tables.songGenre).insert(data.song_genres);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
    });

    it('should 200 and return all genress of a song of corresponding id', async () => {
      const response = await request.get(`${url}/3/genres`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toEqual(
        {
          genreId: 1,
          genreName: 'Space Funk'
        }
      );
      expect(response.body[1]).toEqual(
        {
          genreId: 3,
          genreName: 'Pyschedelic'
        }
      );
    });

    it('should 404 when requesting genres of non existing song', async () => {
      const response = await request.get(`${url}/42/genres`).set('Authorization', authHeader);
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
      const response = await request.get(`${url}/invalid/genres`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/3/genres`));
  });

  describe('POST /api/songs', () => {
    const songsToDelete = [];

    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
      await Song.query().whereIn('songId', songsToDelete).delete();
    });

    it('should 201 and return the created song', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          length: '04:00:00',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(201);
      expect(response.body.songId).toBeTruthy();
      expect(response.body.artistId).toBe(1);
      expect(response.body.title).toBe('Test Song 5');
      expect(response.body.length).toBe('04:00:00');
      expect(response.body.releaseDate).toBe(new Date(2021, 7, 11).toJSON());
      expect(response.body.artLocation).toBe('/public/T/USER3/T/SONG4/picture.png');

      songsToDelete.push(response.body.songId);
    });

    it('should 400 when missing title', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          length: '04:00:00',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('title');
    });

    it('should 400 when missing length', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('length');
    });

    it('should 400 when missing release date', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          length: '04:00:00',
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('releaseDate');
    });

    it('should 400 when missing cover art location', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          length: '04:00:00',
          releaseDate: new Date(2021, 7, 11).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('artLocation');
    });

    it('should 400 when title less than 1 character', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: '',
          length: '04:00:00',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('title');
    });

    it('should 400 when title greater than 100 characters', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'sdfnosinfiosjfon,skn,flksnfoisoeriuesreisuyriugvhdfghdioghdhfgjfhgjkfdgkjdfbgjdfoiehtiozklvjlkdnv,lke,ngml',
          length: '04:00:00',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('title');
    });

    it('should 400 when title not a string', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 4,
          length: '04:00:00',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('title');
    });

    it('should 400 when length less than 8 character', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          length: '04:00',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('length');
    });

    it('should 400 when length greater than 8 characters', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          length: '04:00:00:42',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('length');
    });

    it('should 400 when length not a string', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          length: 400,
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('length');
    });

    it('should 400 when release date in future', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          length: '04:00:00',
          releaseDate: new Date(2042, 7, 11).toJSON(),
          artLocation: '/public/T/USER3/T/SONG4/picture.png'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('releaseDate');
    });

    it('should 400 when art location not a string', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          title: 'Test Song 5',
          length: '04:00:00',
          releaseDate: new Date(2021, 7, 11).toJSON(),
          artLocation: 42
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('artLocation');
    });

    testAuthHeader(() => request.post(url));
  });

  describe('POST /api/songs/:id/genres', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
      await Genre.query().insertGraph(data.genres);
      await knex(tables.songGenre).insert(data.song_genres);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
    });

    it('should 201 and return the newly related genre to the song', async () => {
      const response = await request.post(`${url}/1/genres`).set('Authorization', authHeader).send(
        {
          genreId: 2
        }
      );
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(
        {
          genreId: 2,
          genreName: 'Rock'
        }
      );
    });

    it('should 404 with non existing song', async () => {
      const response = await request.post(`${url}/42/genres`).set('Authorization', authHeader).send(
        {
          genreId: 2
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

    it('should 400 when genre id is a decimal', async () => {
      const response = await request.post(`${url}/1/genres`).set('Authorization', authHeader).send({
        genreId: 4.2
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreId');
    });

    it('should 400 when genre id a string', async () => {
      const response = await request.post(`${url}/1/genres`).set('Authorization', authHeader).send({
        genreId: 'genreId'
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('genreId');
    });

    testAuthHeader(() => request.post(`${url}/1/genres`));
  });

  describe('PUT /api/songs/:id', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 200 and return the updated song', async () => {
      const response = await request.put(`${url}/1`).set('Authorization', authHeader).send(
        {
          title: 'Test Song 2 NEW',
          releaseDate: new Date(2020, 7, 10).toJSON()
        }
      );
      expect(response.statusCode).toBe(200);
      expect(response.body.songId).toBeTruthy();
      expect(response.body.artistId).toBe(1);
      expect(response.body.title).toBe('Test Song 2 NEW');
      expect(response.body.length).toBe('01:00:00');
      expect(response.body.releaseDate).toBe(new Date(2020, 7, 10).toJSON());
      expect(response.body.artLocation).toBe('/public/T/USER1/T/SONG1/picture.png');
    });

    it('should 400 for duplicate title', async () => {
      const response = await request.put(`${url}/1`).set('Authorization', authHeader).send(
        {
          title: 'Test Song 4',
          releaseDate: new Date(2020, 7, 10).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'A song with this title already exists',
        details: {}
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 when missing title', async () => {
      const response = await request.put(`${url}/1`).set('Authorization', authHeader).send(
        {
          releaseDate: new Date(2020, 7, 10).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('title');
    });

    it('should 400 when title less than 1 character', async () => {
      const response = await request.put(`${url}/1`).set('Authorization', authHeader).send(
        {
          title: '',
          releaseDate: new Date(2020, 7, 10).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('title');
    });

    it('should 400 when title greater than 100 characters', async () => {
      const response = await request.put(`${url}/1`).set('Authorization', authHeader).send(
        {
          title: 'sdfnosinfiosjfon,skn,flksnfoisoeriuesreisuyriugvhdfghdioghdhfgjfhgjkfdgkjdfbgjdfoiehtiozklvjlkdnv,lke,ngml',
          releaseDate: new Date(2020, 7, 10).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('title');
    });

    it('should 400 when title not a string', async () => {
      const response = await request.put(`${url}/1`).set('Authorization', authHeader).send(
        {
          title: 42,
          releaseDate: new Date(2020, 7, 10).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('title');
    });

    it('should 400 when missing release date', async () => {
      const response = await request.put(`${url}/1`).set('Authorization', authHeader).send(
        {
          title: 'Test Song 2 NEW'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('releaseDate');
    });

    it('should 400 when release date in future', async () => {
      const response = await request.put(`${url}/1`).set('Authorization', authHeader).send(
        {
          title: 'Test Song 2 NEW',
          releaseDate: new Date(2042, 7, 10).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('releaseDate');
    });

    testAuthHeader(() => request.put(`${url}/1`));
  });

  describe('DELETE /api/songs/:id', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
    });

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/3`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 when requesting non existing song', async () => {
      const response = await request.delete(`${url}/42`).set('Authorization', authHeader);
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
      const response = await request.delete(`${url}/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.delete(`${url}/3`));
  });

  describe('DELETE /api/songs/:id/genres/:genreId', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
      await Genre.query().insertGraph(data.genres);
      await knex(tables.songGenre).insert(data.song_genres);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
      await Genre.query().whereIn('genreId', dataToDelete.genres).delete();
    });

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/1/genres/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 when requesting non existing song', async () => {
      const response = await request.delete(`${url}/42/genres/2`).set('Authorization', authHeader);
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
      const response = await request.delete(`${url}/invalid/genres/2`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 404 with non existing genre', async () => {
      const response = await request.delete(`${url}/1/genres/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No song with id 1 exists or no genre with id 42 exists',
        details: {
          songId: 1,
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
});
