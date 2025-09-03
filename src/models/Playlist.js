const { Model } = require('objection');

class Playlist extends Model {
  static get tableName() {
    return 'playlists';
  }

  static get idColumn() {
    return 'playlistId';
  }

  static get relationMappings() {
    const User = require('./User');
    const Song = require('./Song');

    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'playlists.ownerId',
          to: 'users.userId'
        }
      },

      songs: {
        relation: Model.ManyToManyRelation,
        modelClass: Song,
        join: {
          from: 'playlists.playlistId',
          through: {
            from: 'playlist_songs.playlistId',
            to: 'playlist_songs.songId',
            extra: {
              addedOnDate: 'addedOnDate'
            }
          },
          to: 'songs.songId'
        }
      }
    }
  }
}

module.exports = Playlist
