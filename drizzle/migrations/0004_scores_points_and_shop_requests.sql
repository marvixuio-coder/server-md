ALTER TABLE public.profiles
  ADD COLUMN score integer NOT NULL DEFAULT 0,
  ADD COLUMN points integer NOT NULL DEFAULT 0 CHECK (points >= 0);

-- Users may only change their own display name; score and points change through functions.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

CREATE TABLE public.ttt_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  board text NOT NULL DEFAULT '_________' CHECK (board ~ '^[XO_]{9}$'),
  status text NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'won', 'lost', 'draw')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ttt_games TO service_role;
ALTER TABLE public.ttt_games ENABLE ROW LEVEL SECURITY;
CREATE INDEX ttt_games_user_idx ON public.ttt_games (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.award_ttt_win(_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET score = score + 50, points = points + 5 WHERE id = _user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.award_ttt_win(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_ttt_win(uuid) TO service_role;

CREATE TABLE public.shop_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('vip_buy', 'og_buy', 'og_claim')),
  price integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_requests TO authenticated;
GRANT ALL ON public.shop_requests TO service_role;
ALTER TABLE public.shop_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own shop requests" ON public.shop_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE UNIQUE INDEX shop_requests_one_pending ON public.shop_requests (user_id, kind) WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.request_shop_item(_kind text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cost integer := 0;
BEGIN
  IF uid IS NULL THEN RETURN 'signed_out'; END IF;
  IF _kind NOT IN ('vip_buy', 'og_buy', 'og_claim') THEN RETURN 'bad_kind'; END IF;
  IF EXISTS (SELECT 1 FROM public.shop_requests WHERE user_id = uid AND kind = _kind AND status = 'pending') THEN
    RETURN 'already';
  END IF;
  BEGIN
    IF _kind = 'vip_buy' THEN
      cost := 700;
      UPDATE public.profiles SET points = points - cost WHERE id = uid AND points >= cost;
      IF NOT FOUND THEN RETURN 'not_enough'; END IF;
    END IF;
    INSERT INTO public.shop_requests (user_id, kind, price) VALUES (uid, _kind, cost);
  EXCEPTION WHEN unique_violation THEN
    RETURN 'already';
  END;
  RETURN 'ok';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.request_shop_item(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_shop_item(text) TO authenticated;

-- Owner rejects/removes a request; a pending paid request gets its points back.
CREATE OR REPLACE FUNCTION public.remove_shop_request(_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.shop_requests%ROWTYPE;
BEGIN
  DELETE FROM public.shop_requests WHERE id = _id RETURNING * INTO r;
  IF NOT FOUND THEN RETURN false; END IF;
  IF r.status = 'pending' AND r.price > 0 THEN
    UPDATE public.profiles SET points = points + r.price WHERE id = r.user_id;
  END IF;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.remove_shop_request(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_shop_request(uuid) TO service_role;