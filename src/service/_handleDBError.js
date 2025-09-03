const { UniqueViolationError, ForeignKeyViolationError } = require('objection');
const ServiceError = require('../core/serviceError');

const handleDBError = (error) => {
  const { constraint } = error;

  if (error instanceof UniqueViolationError) {
    switch (true) {
      case constraint.includes('idx_username_unique'):
        return ServiceError.validationFailed(
          'A user with this name already exists'
        );
      case constraint.includes('idx_user_email_unique'):
        return ServiceError.validationFailed(
          'There is already a user with this email address'
        );
      case constraint.includes('idx_playlist_name_and_owner_unique'):
        return ServiceError.validationFailed(
          'A playlist with this name already exists'
        );
      case constraint.includes('idx_genre_name_unique'):
        return ServiceError.validationFailed(
          'A genre with this name already exists'
        );
      case constraint.includes('idx_song_title_and_artist_unique'):
        return ServiceError.validationFailed(
          'A song with this title already exists'
        );
      case constraint.includes('playlist_songs.PRIMARY'):
        return ServiceError.validationFailed(
          'This song has already been added to the playlist'
        );
      case constraint.includes('user_songs_rating.PRIMARY'):
        return ServiceError.validationFailed(
          'This song has already been rated'
        );
      case constraint.includes('user_genre_preferences.PRIMARY'):
        return ServiceError.validationFailed(
          'This genre has already been added to the preferences'
        );
      case constraint.includes('song_genres.PRIMARY'):
        return ServiceError.validationFailed(
          'This genre has already been added to the song'
        );
      default:
        return ServiceError.validationFailed('This item already exists');
    }
  }

  if (error instanceof ForeignKeyViolationError) {
    switch (true) {
      case constraint.includes('fk_playlist_owner'):
        return ServiceError.notFound('This user does not exist');
      case constraint.includes('fk_song_artist'):
        return ServiceError.notFound('This artist does not exist');
      case constraint.includes('fk_rating_user_id'):
        return ServiceError.notFound('This user does not exist');
      case constraint.includes('fk_song_id_rating'):
        return ServiceError.notFound('This song does not exist');
      case constraint.includes('fk_song_playlist_id'):
        return ServiceError.notFound('This playlist does not exist');
      case constraint.includes('fk_song_id_playlist'):
        return ServiceError.notFound('This song does not exist');
      case constraint.includes('fk_user_id'):
        return ServiceError.notFound('This user does not exist');
      case constraint.includes('fk_genre_id'):
        return ServiceError.notFound('This genre does not exist');
      case constraint.includes('fk_genre_song_id'):
        return ServiceError.notFound('This song does not exist');
      case constraint.includes('fk_genre_id_song'):
        return ServiceError.notFound('This genre does not exist');
    }
  }

  // Return error because we don't know what happened
  return error;
};

module.exports = handleDBError;
