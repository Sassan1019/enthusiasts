-- Add note support columns to posts table
ALTER TABLE posts ADD COLUMN source TEXT DEFAULT 'internal';
ALTER TABLE posts ADD COLUMN external_url TEXT;
ALTER TABLE posts ADD COLUMN thumbnail_url TEXT;

-- Create index for source
CREATE INDEX IF NOT EXISTS idx_posts_source ON posts(source);
