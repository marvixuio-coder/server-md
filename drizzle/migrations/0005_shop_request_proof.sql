ALTER TABLE public.shop_requests ADD COLUMN proof text CHECK (proof IS NULL OR char_length(proof) <= 300);

DROP FUNCTION IF EXISTS public.request_shop_item(text);

CREATE OR REPLACE FUNCTION public.request_shop_item(_kind text, _proof text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cost integer := 0;
  clean_proof text := nullif(btrim(coalesce(_proof, '')), '');
BEGIN
  IF uid IS NULL THEN RETURN 'signed_out'; END IF;
  IF _kind NOT IN ('vip_buy', 'og_buy', 'og_claim') THEN RETURN 'bad_kind'; END IF;
  IF _kind = 'og_claim' AND clean_proof IS NULL THEN RETURN 'need_proof'; END IF;
  IF clean_proof IS NOT NULL AND char_length(clean_proof) > 300 THEN RETURN 'proof_too_long'; END IF;
  IF EXISTS (SELECT 1 FROM public.shop_requests WHERE user_id = uid AND kind = _kind AND status = 'pending') THEN
    RETURN 'already';
  END IF;
  BEGIN
    IF _kind = 'vip_buy' THEN
      cost := 700;
      UPDATE public.profiles SET points = points - cost WHERE id = uid AND points >= cost;
      IF NOT FOUND THEN RETURN 'not_enough'; END IF;
    END IF;
    INSERT INTO public.shop_requests (user_id, kind, price, proof) VALUES (uid, _kind, cost, clean_proof);
  EXCEPTION WHEN unique_violation THEN
    RETURN 'already';
  END;
  RETURN 'ok';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.request_shop_item(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_shop_item(text, text) TO authenticated;