const Playlist = require('../../src/models/Playlist');
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
    },
    {
      playlistId: 3,
      ownerId: 1,
      name: 'Test Playlist 3',
      creationDate: new Date(2022, 2, 16)
    }
  ],
  playlist_songs: [
    {
      playlistId: 1,
      songId: 3,
      addedOnDate: new Date(2020, 3, 1)
    },
    {
      playlistId: 2,
      songId: 1,
      addedOnDate: new Date(2019, 1, 1)
    },
    {
      playlistId: 1,
      songId: 1,
      addedOnDate: new Date(2020, 3, 1)
    }
  ]
}

const dataToDelete = {
  songs: [1, 2, 3],
  playlists: [1, 2, 3]
}

describe('Playlists', () => {
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

  const url = '/api/playlists';

  describe('GET /api/playlists', () => {
    beforeAll(async () => {
      await Playlist.query().insertGraph(data.playlists);
    });

    afterAll(async () => {
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
    });

    it('should 200 and return all playlists', async () => {
      const response = await request.get(url).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[1]).toEqual(
        {
          playlistId: 3,
          ownerId: 1,
          name: 'Test Playlist 3',
          creationDate: new Date(2022, 2, 16).toJSON()
        }
      );
      expect(response.body[0]).toEqual(
        {
          playlistId: 2,
          ownerId: 1,
          name: 'Test Playlist 2',
          creationDate: new Date(2022, 2, 16).toJSON()
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

  describe('GET /api/playlists/:id', () => {
    beforeAll(async () => {
      await Playlist.query().insertGraph(data.playlists);
    });

    afterAll(async () => {
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
    });

    it('should 200 and return the playlist of corresponding id', async () => {
      const response = await request.get(`${url}/2`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        {
          playlistId: 2,
          ownerId: 1,
          name: 'Test Playlist 2',
          creationDate: new Date(2022, 2, 16).toJSON()
        }
      );
    });

    it('should 404 when requesting non existing playlist', async () => {
      const response = await request.get(`${url}/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No playlist with id 42 exists',
        details: {
          playlistId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid playlist id', async () => {
      const response = await request.get(`${url}/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1`));
  });

  describe('GET /api/playlists/:id/songs', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
      await Playlist.query().insertGraph(data.playlists);
      await knex(tables.playlistSong).insert(data.playlist_songs);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
    });

    it('should 200 and return all songs of a playlist of corresponding id', async () => {
      const response = await request.get(`${url}/2/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toEqual(
        {
          songId: 1,
          artistId: 1,
          title: 'Test Song 1',
          length: '01:00:00',
          releaseDate: new Date(2019, 10, 19).toJSON(),
          artLocation: '/public/T/USER1/T/SONG1/picture.png',
          addedOnDate: new Date(2019, 1, 1).toJSON()
        }
      );
    });

    it('should 404 when requesting songs of non existing playlist', async () => {
      const response = await request.get(`${url}/42/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No playlist with id 42 exists',
        details: {
          playlistId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid playlist id', async () => {
      const response = await request.get(`${url}/invalid/songs`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.get(`${url}/1/songs`));
  });

  describe('POST /api/playlists', () => {
    const playlistsToDelete = [];

    beforeAll(async () => {
      await Playlist.query().insertGraph(data.playlists);
    });

    afterAll(async () => {
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
      await Playlist.query().whereIn('playlistId', playlistsToDelete).delete();
    });

    it('should 201 and return the created playlist', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          name: 'Test Playlist 4',
          creationDate: new Date(2018, 2, 20).toJSON()
        }
      );
      expect(response.statusCode).toBe(201);
      expect(response.body.playlistId).toBeTruthy();
      expect(response.body.ownerId).toBe(1);
      expect(response.body.name).toBe('Test Playlist 4');
      expect(response.body.creationDate).toBe(new Date(2018, 2, 20).toJSON());

      playlistsToDelete.push(response.body.playlistId);
    });

    it('should 400 when missing playlist name', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          creationDate: new Date(2018, 2, 20).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should 400 when missing creation date', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          name: 'Test Playlist 3'
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('creationDate');
    });

    it('should 400 when name less than 1 character', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          name: '',
          creationDate: new Date(2018, 2, 20).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should 400 when name longer than 100 character', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          name: 'sdfnosinfiosjfon,skn,flksnfoisoeriuesreisuyriugvhdfghdioghdhfgjfhgjkfdgkjdfbgjdfoiehtiozklvjlkdnv,lke,ngml',
          creationDate: new Date(2018, 2, 20).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should 400 when name not a string', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          name: 3,
          creationDate: new Date(2018, 2, 20).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should 400 when creation date in future', async () => {
      const response = await request.post(url).set('Authorization', authHeader).send(
        {
          name: 'Test Playlist 3',
          creationDate: new Date(2042, 3, 2).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('creationDate');
    });

    testAuthHeader(() => request.post(url));
  });

  describe('POST /api/playlists/:id/songs', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
      await Playlist.query().insertGraph(data.playlists);
      await knex(tables.playlistSong).insert(data.playlist_songs);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
    });

    it('should 201 and return the song added to the playlist', async () => {
      const response = await request.post(`${url}/2/songs`).set('Authorization', authHeader).send(
        {
          songId: 2,
          addedOnDate: new Date(2021, 4, 3).toJSON()
        }
      );
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(
        {
          songId: 2,
          artistId: 2,
          title: 'Test Song 2',
          length: '02:00:00',
          releaseDate: new Date(2020, 11, 20).toJSON(),
          artLocation: '/public/T/USER2/T/SONG2/picture.png',
          addedOnDate: new Date(2021, 4, 3).toJSON()
        }
      );
    });

    it('should 400 with invalid playlist id', async () => {
      const response = await request.post(`${url}/invalid/songs`).set('Authorization', authHeader).send(
        {
          songId: 2,
          addedOnDate: new Date(2021, 4, 3).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 404 with non exisiting playlist id', async () => {
      const response = await request.post(`${url}/42/songs`).set('Authorization', authHeader).send(
        {
          songId: 2,
          addedOnDate: new Date(2021, 4, 3).toJSON()
        }
      );
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No playlist with id 42 exists',
        details: {
          playlistId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 when missing song id', async () => {
      const response = await request.post(`${url}/1/songs`).set('Authorization', authHeader).send(
        {
          addedOnDate: new Date(2021, 4, 3).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('songId');
    });

    it('should 400 when missing date the song was added on', async () => {
      const response = await request.post(`${url}/1/songs`).set('Authorization', authHeader).send(
        {
          songId: 2,
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('addedOnDate');
    });

    it('should 400 when song id is a decimal', async () => {
      const response = await request.post(`${url}/1/songs`).set('Authorization', authHeader).send(
        {
          songId: 4.2,
          addedOnDate: new Date(2021, 4, 3).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('songId');
    });

    it('should 400 when song id a string', async () => {
      const response = await request.post(`${url}/1/songs`).set('Authorization', authHeader).send(
        {
          songId: "songId",
          addedOnDate: new Date(2021, 4, 3).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('songId');
    });

    it('should 400 when date the song was added on set in future', async () => {
      const response = await request.post(`${url}/1/songs`).set('Authorization', authHeader).send(
        {
          songId: 3,
          addedOnDate: new Date(2042, 4, 3).toJSON()
        }
      );
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('addedOnDate');
    });

    testAuthHeader(() => request.post(`${url}/2/songs`));
  });

  describe('PUT /api/playlists/:id', () => {
    beforeAll(async () => {
      await Playlist.query().insertGraph(data.playlists);
    });

    afterAll(async () => {
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
    });

    it('should 200 and return the updated playlist', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        name: 'Test Playlist 2 NEW'
      });
      expect(response.statusCode).toBe(200);
      expect(response.body.playlistId).toBeTruthy();
      expect(response.body.ownerId).toBe(1);
      expect(response.body.name).toBe('Test Playlist 2 NEW');
      expect(response.body.creationDate).toBe(new Date(2022, 2, 16).toJSON());
    });

    it('should 400 for duplicate playlist name', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        name: 'Test Playlist 3'
      });
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        message: 'A playlist with this name already exists',
        details: {}
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 when missing playlist name', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should 400 when name less than 1 character', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        name: ''
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should 400 when name longer than 100 character', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        name: 'sdfnosinfiosjfon,skn,flksnfoisoeriuesreisuyriugvhdfghdioghdhfgjfhgjkfdgkjdfbgjdfoiehtiozklvjlkdnv,lke,ngml'
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should 400 when name not a string', async () => {
      const response = await request.put(`${url}/2`).set('Authorization', authHeader).send({
        name: 42
      });
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.body).toHaveProperty('name');
    });

    testAuthHeader(() => request.put(`${url}/2`));
  });

  describe('DELETE /api/playlists/:id', () => {
    beforeAll(async () => {
      await Playlist.query().insertGraph(data.playlists);
    });

    afterAll(async () => {
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
    });

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/2`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 when requesting non existing playlist', async () => {
      const response = await request.delete(`${url}/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No playlist with id 42 exists',
        details: {
          playlistId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid playlist id', async () => {
      const response = await request.delete(`${url}/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    testAuthHeader(() => request.delete(`${url}/2`));
  });

  describe('DELETE /api/playlists/:id/songs/:songId', () => {
    beforeAll(async () => {
      await Song.query().insertGraph(data.songs);
      await Playlist.query().insertGraph(data.playlists);
      await knex(tables.playlistSong).insert(data.playlist_songs);
    });

    afterAll(async () => {
      await Song.query().whereIn('songId', dataToDelete.songs).delete();
      await Playlist.query().whereIn('playlistId', dataToDelete.playlists).delete();
    });

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/2/songs/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 with non existing playlist', async () => {
      const response = await request.delete(`${url}/42/songs/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No playlist with id 42 exists',
        details: {
          playlistId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid playlist id', async () => {
      const response = await request.delete(`${url}/invalid/songs/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('id');
    });

    it('should 404 with non existing song', async () => {
      const response = await request.delete(`${url}/2/songs/42`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No playlist with id 2 exists or no song with id 42 could be found in the playlist',
        details: {
          playlistId: 2,
          songId: 42
        }
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 400 with invalid song id', async () => {
      const response = await request.delete(`${url}/1/songs/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('songId');
    });

    testAuthHeader(() => request.delete(`${url}/2/songs/1`));
  });
});
