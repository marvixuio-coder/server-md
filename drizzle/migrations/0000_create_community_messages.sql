CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 30),
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.community_messages TO anon, authenticated;
GRANT ALL ON public.community_messages TO service_role;

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community messages"
ON public.community_messages FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can post community messages"
ON public.community_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX community_messages_created_at_idx ON public.community_messages (created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;