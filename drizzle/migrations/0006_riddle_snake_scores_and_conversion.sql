CREATE TABLE public.riddle_solves (
  user_id uuid NOT NULL,
  riddle_idx integer NOT NULL CHECK (riddle_idx >= 0),
  solved boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, riddle_idx)
);
GRANT ALL ON public.riddle_solves TO service_role;
ALTER TABLE public.riddle_solves ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.snake_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'done')),
  apples integer NOT NULL DEFAULT 0 CHECK (apples >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT ALL ON public.snake_games TO service_role;
ALTER TABLE public.snake_games ENABLE ROW LEVEL SECURITY;
CREATE INDEX snake_games_user_idx ON public.snake_games (user_id, created_at DESC);

-- Adds score only (riddles, snake); called by server functions after they verify the play.
CREATE OR REPLACE FUNCTION public.award_score(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET score = score + GREATEST(_amount, 0) WHERE id = _user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.award_score(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_score(uuid, integer) TO service_role;

-- Converts every full 100 score into 5 points for the signed-in user; returns points gained.
CREATE OR REPLACE FUNCTION public.convert_score_to_points()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  s integer;
  blocks integer;
BEGIN
  IF uid IS NULL THEN RETURN 0; END IF;
  SELECT score INTO s FROM public.profiles WHERE id = uid FOR UPDATE;
  IF s IS NULL THEN RETURN 0; END IF;
  blocks := s / 100;
  IF blocks <= 0 THEN RETURN 0; END IF;
  UPDATE public.profiles SET score = score - blocks * 100, points = points + blocks * 5 WHERE id = uid;
  RETURN blocks * 5;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.convert_score_to_points() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_score_to_points() TO authenticated;