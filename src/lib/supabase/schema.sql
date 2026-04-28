-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  UNIQUE(user_id, name)
);

-- Note-Tags junction
CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Note links (wikilinks between notes)
CREATE TABLE IF NOT EXISTS note_links (
  source_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  target_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  PRIMARY KEY (source_id, target_id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Full-text search index
CREATE INDEX IF NOT EXISTS notes_fts_idx ON notes
  USING GIN (to_tsvector('english', title || ' ' || content));

-- Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own tags" ON tags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own note_tags" ON note_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users manage own note_links" ON note_links FOR ALL
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = source_id AND notes.user_id = auth.uid()));
