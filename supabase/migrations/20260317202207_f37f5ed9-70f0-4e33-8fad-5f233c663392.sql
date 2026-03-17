
-- Seed crypto assets
INSERT INTO public.assets (symbol, name, type, leverage_max, enabled, icon_url) VALUES
  ('BTC/EUR', 'Bitcoin', 'crypto', 100, true, null),
  ('ETH/EUR', 'Ethereum', 'crypto', 100, true, null),
  ('SOL/EUR', 'Solana', 'crypto', 50, true, null),
  ('XRP/EUR', 'Ripple', 'crypto', 50, true, null),
  ('BNB/EUR', 'Binance Coin', 'crypto', 50, true, null),
  ('DOGE/EUR', 'Dogecoin', 'crypto', 50, true, null),
  ('ADA/EUR', 'Cardano', 'crypto', 50, true, null),
  ('DOT/EUR', 'Polkadot', 'crypto', 50, true, null),
  ('LINK/EUR', 'Chainlink', 'crypto', 50, true, null),
  ('AVAX/EUR', 'Avalanche', 'crypto', 50, true, null)
ON CONFLICT DO NOTHING;

-- Seed stock assets (market hours Mon-Fri 09:30-16:00)
INSERT INTO public.assets (symbol, name, type, leverage_max, enabled, market_hours_start, market_hours_end, market_days) VALUES
  ('AAPL', 'Apple Inc.', 'stock', 10, true, '09:30', '16:00', '{1,2,3,4,5}'),
  ('TSLA', 'Tesla Inc.', 'stock', 10, true, '09:30', '16:00', '{1,2,3,4,5}'),
  ('MSFT', 'Microsoft Corp.', 'stock', 10, true, '09:30', '16:00', '{1,2,3,4,5}'),
  ('AMZN', 'Amazon.com Inc.', 'stock', 10, true, '09:30', '16:00', '{1,2,3,4,5}'),
  ('GOOGL', 'Alphabet Inc.', 'stock', 10, true, '09:30', '16:00', '{1,2,3,4,5}'),
  ('NVDA', 'NVIDIA Corp.', 'stock', 10, true, '09:30', '16:00', '{1,2,3,4,5}'),
  ('META', 'Meta Platforms', 'stock', 10, true, '09:30', '16:00', '{1,2,3,4,5}')
ON CONFLICT DO NOTHING;

-- Seed forex assets (24/5)
INSERT INTO public.assets (symbol, name, type, leverage_max, enabled, market_days) VALUES
  ('EUR/USD', 'Euro / US Dollar', 'forex', 100, true, '{1,2,3,4,5}'),
  ('GBP/USD', 'British Pound / US Dollar', 'forex', 100, true, '{1,2,3,4,5}'),
  ('USD/JPY', 'US Dollar / Japanese Yen', 'forex', 100, true, '{1,2,3,4,5}')
ON CONFLICT DO NOTHING;
