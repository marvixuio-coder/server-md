ALTER TABLE public.community_messages ADD COLUMN user_id uuid;
CREATE INDEX community_messages_user_id_idx ON public.community_messages (user_id);

-- Messages written from the site always carry the writer's account and current display name.
-- Server-side bot messages (service role, no signed-in user) keep the name they were given.
CREATE OR REPLACE FUNCTION public.set_community_message_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  dn text;
BEGIN
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT display_name INTO dn FROM public.profiles WHERE id = uid;
  IF dn IS NULL THEN
    RAISE EXCEPTION 'A profile is required to post';
  END IF;
  NEW.user_id := uid;
  NEW.name := COALESCE(NULLIF(btrim(left(dn, 30)), ''), 'عضو');
  RETURN NEW;
END;
$$;

CREATE TRIGGER community_messages_set_author
BEFORE INSERT ON public.community_messages
FOR EACH ROW EXECUTE FUNCTION public.set_community_message_author();

DROP POLICY "Anyone can post community messages" ON public.community_messages;
REVOKE INSERT ON public.community_messages FROM anon;

CREATE POLICY "Signed-in users post as themselves"
ON public.community_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Public list of owner accounts, used to show the owner tag next to their names.
CREATE OR REPLACE FUNCTION public.owner_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles WHERE role = 'owner'
$$;
GRANT EXECUTE ON FUNCTION public.owner_ids() TO anon, authenticated;