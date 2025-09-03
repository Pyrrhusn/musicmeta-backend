const { faker } = require("@faker-js/faker");
const { hashPassword } = require("../core/password");
const Role = require("../core/roles");

faker.seed(69);

const SONGS = [];
const USERS = [];
const PLAYLISTS = [];
const GENRES = [];
const USER_GENRE_PREFERENCES = [];
const USER_SONGS_RATING = [];
const PLAYLIST_SONG = [];
const SONG_GENRE = [];
const ART_COVERS = ["https://cdn.pixabay.com/photo/2020/05/19/13/48/cartoon-5190942_1280.jpg", "https://cdn.pixabay.com/photo/2021/05/14/12/26/man-6253257_1280.jpg", "https://cdn.pixabay.com/photo/2024/05/01/03/27/hands-8731277_1280.png", "https://cdn.pixabay.com/photo/2024/02/12/05/02/ai-generated-8567846_1280.png",
   "https://cdn.pixabay.com/photo/2023/10/01/02/29/ai-generated-8286678_1280.png", "https://cdn.pixabay.com/photo/2022/10/08/04/29/clouds-7506238_1280.jpg", "https://cdn.pixabay.com/photo/2022/12/30/22/01/music-7687732_1280.png", "https://cdn.pixabay.com/photo/2017/06/24/20/27/music-2438748_1280.jpg", "https://cdn.pixabay.com/photo/2023/06/14/04/45/mountain-8062284_1280.png",
  "https://cdn.pixabay.com/photo/2023/05/23/23/58/moth-8013721_1280.jpg", "https://cdn.pixabay.com/photo/2023/03/12/18/47/castle-7847599_1280.jpg", "https://cdn.pixabay.com/photo/2024/03/28/22/49/ai-generated-8661825_1280.png", "https://cdn.pixabay.com/photo/2022/03/05/10/08/beauty-7048849_1280.jpg"]

const createUsers = async (userId) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const isArtist = faker.datatype.boolean(0.4);
  return {
    userId,
    username: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName: firstName, lastName: lastName }),
    // password_hash: await hashPassword(faker.internet.password()),
    password_hash: await hashPassword("1234567890"),
    roles: JSON.stringify(
      faker.datatype.boolean() ? [Role.USER] : [Role.USER, Role.ADMIN]
    ),
    birthDate: faker.date.birthdate(),
    isArtist: isArtist,
    about: isArtist ? faker.person.bio() : "",
    pictureLocation: faker.system.filePath(),
  };
};

const createSongs = (songId, artistId) => {
  return {
    songId,
    artistId: artistId,
    title: faker.music.songName(),
    length: `${faker.number
      .int({ max: 30 })
      .toString()
      .padStart(2, "0")}:${faker.number
      .int({ max: 59 })
      .toString()
      .padStart(2, "0")}`,
    releaseDate: faker.date.past(),
    artLocation: ART_COVERS[Math.floor(ART_COVERS.length * Math.random())]
  };
};

const createGenres = (genreId, genreName) => {
  return {
    genreId,
    genreName,
  };
};

const createPlaylists = (playlistId, userId) => {
  return {
    playlistId,
    ownerId: userId,
    name: "Liked Songs",
    creationDate: faker.date.past(),
  };
};

const createUserGenrePreference = (userId, genreId) => {
  return {
    userId,
    genreId,
  };
};

const createUserSongsRating = (
  userId,
  songId,
  rating = faker.number.int({ min: 1, max: 5 })
) => {
  return {
    userId,
    songId,
    rating,
  };
};

const createPlaylistSong = (
  playlistId,
  songId,
  addedOnDate = faker.date.past()
) => {
  return {
    playlistId,
    songId,
    addedOnDate,
  };
};

const createSongGenre = (songId, genreId) => {
  return {
    songId,
    genreId,
  };
};

const generateMockData = async (
  numberOfUsers = 10,
  numberOfPlaylists = 10,
  numberOfSongs = 15,
  numberOfGenres = 8
) => {
  for (u = 0; u < numberOfUsers; u++) {
    const userId = u + 1;
    USERS[u] = await createUsers(userId);
  }

  for (s = 0; s < numberOfSongs; s++) {
    const songId = s + 1;
    const ARTISTS = USERS.filter((user) => user.isArtist);
    SONGS[s] = createSongs(
      songId,
      ARTISTS[Math.floor(ARTISTS.length * Math.random())].userId
    );
  }

  for (p = 0; p < numberOfPlaylists; p++) {
    const playlistId = p + 1;
    PLAYLISTS[p] = createPlaylists(playlistId, USERS[p % USERS.length].userId);
  }

  for (g = 0; g < numberOfGenres; g++) {
    const genre = faker.music.genre();
    if (GENRES.find(({ genreName }) => genreName == genre)) {
      g--;
      continue;
    }
    const genreId = g + 1;
    GENRES.push(createGenres(genreId, genre));
  }

  USERS.forEach(({ userId }) => {
    for (g = 0; g < Math.floor(GENRES.length * Math.random()); g++) {
      if (faker.datatype.boolean())
        USER_GENRE_PREFERENCES.push(
          createUserGenrePreference(userId, GENRES[g].genreId)
        );
    }
  });

  USERS.forEach(({ userId }) => {
    SONGS.forEach(({ songId }) => {
      if (faker.datatype.boolean(0.3))
        USER_SONGS_RATING.push(createUserSongsRating(userId, songId));
    });
  });

  PLAYLISTS.forEach(({ playlistId }) => {
    for (s = 0; s < Math.floor(SONGS.length * Math.random()); s++) {
      PLAYLIST_SONG.push(createPlaylistSong(playlistId, SONGS[s].songId));
    }
  });

  SONGS.forEach(({ songId }) => {
    for (g = 0; g < Math.floor(GENRES.length * Math.random()); g++) {
      SONG_GENRE.push(createSongGenre(songId, GENRES[g].genreId));
    }
  });

  // add a custom user for development
  USERS.push({
    userId: USERS.length + 1,
    username: "Artist",
    email: "artist@app.com",
    password_hash: await hashPassword("1234567890"),
    roles: JSON.stringify([Role.USER]),
    birthDate: "1970-07-31 08:33:29.567",
    isArtist: true,
    about: "Artist 🖼️",
    pictureLocation: "" });

  USERS.push({
    userId: USERS.length + 1,
    username: "User",
    email: "user@app.com",
    password_hash: await hashPassword("1234567890"),
    roles: JSON.stringify([Role.USER]),
    birthDate: null,
    isArtist: false,
    about: "Average User",
    pictureLocation: "",
  });

  USERS.push({
    userId: USERS.length + 1,
    username: "Admin",
    email: "admin@app.com",
    password_hash: await hashPassword("1234567890"),
    roles: JSON.stringify([Role.ADMIN]),
    birthDate: null,
    isArtist: false,
    about: "Admin",
    pictureLocation: "",
  });
};

const mockData = Object.freeze({
  SONGS,
  USERS,
  PLAYLISTS,
  GENRES,
  USER_GENRE_PREFERENCES,
  USER_SONGS_RATING,
  PLAYLIST_SONG,
  SONG_GENRE,
});

module.exports = { generateMockData, mockData };
