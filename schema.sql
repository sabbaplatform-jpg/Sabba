CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('hr', 'employee', 'vendor')),
  full_name TEXT NOT NULL,
  company_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  hr_contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD CONSTRAINT fk_company
  FOREIGN KEY (company_id) REFERENCES companies(id);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('travel', 'volunteering', 'courses', 'jobs_abroad', 'accommodation', 'airlines')),
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration TEXT NOT NULL,
  price_gbp NUMERIC(10,2) NOT NULL,
  emoji TEXT DEFAULT '🌍',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employee_adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adventure_start_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'approved', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  departure_date DATE NOT NULL,
  payroll_months INT NOT NULL CHECK (payroll_months IN (3, 6, 12)),
  monthly_amount NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO companies (id, name, domain, hr_contact_email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Barclays', 'barclays.com', 'hr@barclays.com'),
  ('22222222-2222-2222-2222-222222222222', 'KPMG', 'kpmg.com', 'hr@kpmg.com');

INSERT INTO users (id, email, password_hash, role, full_name, company_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'hr@barclays.com',    '$2a$10$rQnM9dGpGVJ8A3Y5K2X1aO8ZsD4LpM7RvNkWcUyTbXeJhFqImPsGu', 'hr',       'Sarah Clarke',   '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'james@barclays.com', '$2a$10$rQnM9dGpGVJ8A3Y5K2X1aO8ZsD4LpM7RvNkWcUyTbXeJhFqImPsGu', 'employee', 'James Thornton', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'hello@remoteyear.com','$2a$10$rQnM9dGpGVJ8A3Y5K2X1aO8ZsD4LpM7RvNkWcUyTbXeJhFqImPsGu','vendor',   'Remote Year',    NULL);

INSERT INTO vendors (id, user_id, company_name, category, description, verified, rating, total_reviews) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Remote Year', 'travel', 'Premium travel packages for professionals on career breaks.', TRUE, 4.8, 214);

INSERT INTO packages (vendor_id, title, description, category, destination, duration, price_gbp, emoji, status) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Japan Explorer — 3 Weeks', 'Immerse yourself in Japanese culture, from Tokyo to Kyoto.', 'travel', 'Tokyo & Kyoto', '3 weeks', 3200, '🇯🇵', 'live'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Bali Remote Living', 'Work, explore, and recharge in Bali for a full month.', 'travel', 'Bali, Indonesia', '1 month', 2100, '🇮🇩', 'live'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Lisbon Digital Nomad', 'Six weeks in Europes most vibrant city for remote workers.', 'travel', 'Lisbon, Portugal', '6 weeks', 2800, '🇵🇹', 'live');
