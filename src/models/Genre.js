const { Model } = require('objection');

class Genre extends Model {
  static get tableName() {
    return 'genres';
  }

  static get idColumn() {
    return 'genreId';
  }

  // static get jsonSchema() {
  //   return {
  //     type: 'object',
  //     required: ['genreName'],
  //     properties: {
  //       genreId: { type: 'integer', minimum: 0 },
  //       genreName: { type: 'string', minLength: 1, maxLength: 20 }
  //     }
  //   }
  // }

  static get relationMappings() {
    const User = require('./User');
    const Song = require('./Song');

    return {
      userPreferences: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'genres.genreId',
          through: {
            from: 'user_genre_preferences.genreId',
            to: 'user_genre_preferences.userId'
          },
          to: 'users.userId'
        }
      },

      songs: {
        relation: Model.ManyToManyRelation,
        modelClass: Song,
        join: {
          from: 'genres.genreId',
          through: {
            from: 'song_genres.genreId',
            to: 'song_genres.songId'
          },
          to: 'songs.songId'
        }
      }
    }
  }
}

module.exports = Genre
