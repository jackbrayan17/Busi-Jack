INSERT INTO products (name, description, price, delivery_method)
VALUES
  ('Ebook IA 2024', 'Guide complet pour monétiser des services IA.', 15000, 'download'),
  ('Formation Automation', 'Série de vidéos pour automatiser les business en ligne.', 45000, 'email');

INSERT INTO customers (name, email, phone)
VALUES
  ('Awa Diop', 'awa@example.com', '+221770000001'),
  ('Jean Mensah', 'jean@example.com', '+233540000002');

INSERT INTO orders (customer_id, product_id, quantity, status)
VALUES
  (1, 1, 2, 'confirmed'),
  (2, 2, 1, 'pending');

INSERT INTO payments (customer_id, amount, provider, status)
VALUES
  (1, 30000, 'orange-money', 'confirmed'),
  (2, 45000, 'mtn-momo', 'pending');

INSERT INTO marketing_campaigns (platform, message, status)
VALUES
  ('facebook', 'Promo Ebook IA 2024 -40%', 'scheduled'),
  ('whatsapp', 'Formation Automation disponible maintenant', 'active');

INSERT INTO projects (name, niche, status)
VALUES
  ('IA Trend Hub', 'Intelligence artificielle', 'active'),
  ('Automation Booster', 'Automatisation business', 'draft');
