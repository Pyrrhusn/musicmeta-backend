const { Model } = require("objection");

class Song extends Model {
  static get tableName() {
    return "songs";
  }

  static get idColumn() {
    return "songId";
  }

  static get relationMappings() {
    const User = require("./User");
    const Playlist = require("./Playlist");
    const Genre = require("./Genre");

    return {
      playlists: {
        relation: Model.ManyToManyRelation,
        modelClass: Playlist,
        join: {
          from: "songs.songId",
          through: {
            from: "playlist_songs.songId",
            to: "playlist_songs.playlistId",
            extra: {
              addedOnDate: "addedOnDate",
            },
          },
          to: "playlists.playlistId",
        },
      },

      genres: {
        relation: Model.ManyToManyRelation,
        modelClass: Genre,
        join: {
          from: "songs.songId",
          through: {
            from: "song_genres.songId",
            to: "song_genres.genreId",
          },
          to: "genres.genreId",
        },
      },

      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "songs.artistId",
          to: "users.userId",
        },
      },

      usersRating: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: "songs.songId",
          through: {
            from: "user_songs_rating.songId",
            to: "user_songs_rating.userId",
            extra: {
              rating: "rating",
            },
          },
          to: "users.userId",
        }
      },
    };
  }

  // modifiers for e.g. fuzzy search, to be used in Service
}

module.exports = Song;
