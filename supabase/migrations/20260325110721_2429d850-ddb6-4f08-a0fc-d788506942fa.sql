
CREATE SEQUENCE IF NOT EXISTS trades_display_id_seq;

ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS display_id integer NOT NULL DEFAULT nextval('trades_display_id_seq');

-- Backfill existing trades with sequential IDs based on opened_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY opened_at) AS rn
  FROM public.trades
)
UPDATE public.trades t SET display_id = n.rn FROM numbered n WHERE t.id = n.id;
