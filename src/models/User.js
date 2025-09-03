const { Model } = require('objection');

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get idColumn() {
    return 'userId';
  }

  static get relationMappings() {
    const Genre = require('./Genre');
    const Song = require('./Song');
    const Playlist = require('./Playlist');

    return {
      genrePreferences: {
        relation: Model.ManyToManyRelation,
        modelClass: Genre,
        join: {
          from: 'users.userId',
          through: {
            from: 'user_genre_preferences.userId',
            to: 'user_genre_preferences.genreId'
          },
          to: 'genres.genreId'
        }
      },

      playlists: {
        relation: Model.HasManyRelation,
        modelClass: Playlist,
        join: {
          from: 'users.userId',
          to: 'playlists.ownerId'
        }
      },

      songsRating: {
        relation: Model.ManyToManyRelation,
        modelClass: Song,
        join: {
          from: 'users.userId',
          through: {
            from: 'user_songs_rating.userId',
            to: 'user_songs_rating.songId',
            extra: {
              rating: 'rating'
            }
          },
          to: 'songs.songId'
        }
      },

      songs: {
        relation: Model.HasManyRelation,
        modelClass: Song,
        join: {
          from: 'users.userId',
          to: 'songs.artistId'
        }
      }
    }
  }
}

module.exports = User
