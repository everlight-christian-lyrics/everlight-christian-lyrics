ALTER TABLE songs
ADD COLUMN category TEXT NOT NULL DEFAULT 'General';

CREATE INDEX IF NOT EXISTS idx_songs_category_status
ON songs(category, status);
