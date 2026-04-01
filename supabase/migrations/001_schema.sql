-- =============================================
-- Track Coffee - Database Schema
-- =============================================

-- STORES
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO stores (name, location) VALUES
  ('Interlaken', 'Interlaken, Switzerland'),
  ('Montreux', 'Montreux, Switzerland');

-- USER PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'torrador', 'barista')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GREEN COFFEE LOTS
CREATE TABLE green_coffee_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  origin_country TEXT NOT NULL,
  farm_producer TEXT,
  variety TEXT NOT NULL,
  process_method TEXT NOT NULL,
  quantity_kg NUMERIC(10,2) NOT NULL,
  current_stock_kg NUMERIC(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  supplier TEXT,
  price_per_kg NUMERIC(10,2),
  notes TEXT,
  label_image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ROAST SESSIONS
CREATE TABLE roast_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  green_coffee_lot_id UUID NOT NULL REFERENCES green_coffee_lots(id),
  roast_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  input_weight_kg NUMERIC(10,3) NOT NULL,
  output_weight_kg NUMERIC(10,3) NOT NULL,
  loss_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
    ROUND(((input_weight_kg - output_weight_kg) / input_weight_kg) * 100, 2)
  ) STORED,
  roast_level TEXT NOT NULL CHECK (roast_level IN ('light', 'medium', 'medium-dark', 'dark')),
  temperature_notes TEXT,
  roast_profile_notes TEXT,
  roasted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ROASTED COFFEE INVENTORY
CREATE TABLE roasted_coffee_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  roast_session_id UUID NOT NULL REFERENCES roast_sessions(id),
  quantity_kg NUMERIC(10,3) NOT NULL,
  current_stock_kg NUMERIC(10,3) NOT NULL,
  roast_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- FLAVOR PROFILES
CREATE TABLE flavor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roast_session_id UUID NOT NULL REFERENCES roast_sessions(id),
  acidity INTEGER CHECK (acidity BETWEEN 1 AND 10),
  body INTEGER CHECK (body BETWEEN 1 AND 10),
  sweetness INTEGER CHECK (sweetness BETWEEN 1 AND 10),
  bitterness INTEGER CHECK (bitterness BETWEEN 1 AND 10),
  aftertaste INTEGER CHECK (aftertaste BETWEEN 1 AND 10),
  tasting_notes TEXT,
  sca_score NUMERIC(5,2) CHECK (sca_score BETWEEN 0 AND 100),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RECIPES
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  roast_session_id UUID REFERENCES roast_sessions(id),
  title TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('espresso', 'v60', 'french_press', 'aeropress', 'chemex', 'cold_brew', 'moka_pot', 'weber_bird', 'other')),
  dose_grams NUMERIC(6,2),
  water_ml NUMERIC(8,2),
  temperature_celsius NUMERIC(5,1),
  brew_time_seconds INTEGER,
  grind_size TEXT,
  instructions TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RECIPE COMMENTS
CREATE TABLE recipe_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- STORAGE BUCKET for label images
-- =============================================
-- Run this in Supabase Dashboard > Storage:
-- Create a public bucket named "labels"

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-deduct green beans when a roast session is created
CREATE OR REPLACE FUNCTION deduct_green_beans()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE green_coffee_lots
  SET current_stock_kg = current_stock_kg - NEW.input_weight_kg,
      updated_at = now()
  WHERE id = NEW.green_coffee_lot_id;

  IF (SELECT current_stock_kg FROM green_coffee_lots WHERE id = NEW.green_coffee_lot_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient green bean stock for this roast';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deduct_green_beans
  AFTER INSERT ON roast_sessions
  FOR EACH ROW EXECUTE FUNCTION deduct_green_beans();

-- Auto-create roasted inventory entry
CREATE OR REPLACE FUNCTION create_roasted_inventory()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO roasted_coffee_inventory (store_id, roast_session_id, quantity_kg, current_stock_kg, roast_date)
  VALUES (NEW.store_id, NEW.id, NEW.output_weight_kg, NEW.output_weight_kg, NEW.roast_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_roasted_inventory
  AFTER INSERT ON roast_sessions
  FOR EACH ROW EXECUTE FUNCTION create_roasted_inventory();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, store_id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'store_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'role', 'barista'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at_green_coffee
  BEFORE UPDATE ON green_coffee_lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at_roasted
  BEFORE UPDATE ON roasted_coffee_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at_recipes
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_coffee_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roasted_coffee_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE USING (get_user_role() = 'admin');

-- GREEN COFFEE LOTS
CREATE POLICY "View own store lots"
  ON green_coffee_lots FOR SELECT
  USING (store_id = get_user_store_id() OR get_user_role() = 'admin');
CREATE POLICY "Insert own store lots"
  ON green_coffee_lots FOR INSERT
  WITH CHECK (store_id = get_user_store_id() OR get_user_role() = 'admin');
CREATE POLICY "Update own store lots"
  ON green_coffee_lots FOR UPDATE
  USING (store_id = get_user_store_id() OR get_user_role() = 'admin');
CREATE POLICY "Delete own store lots"
  ON green_coffee_lots FOR DELETE
  USING (store_id = get_user_store_id() OR get_user_role() = 'admin');

-- ROAST SESSIONS
CREATE POLICY "View own store roasts"
  ON roast_sessions FOR SELECT
  USING (store_id = get_user_store_id() OR get_user_role() = 'admin');
CREATE POLICY "Torradores and admins can insert roasts"
  ON roast_sessions FOR INSERT
  WITH CHECK (
    (store_id = get_user_store_id() AND get_user_role() IN ('torrador', 'admin'))
    OR get_user_role() = 'admin'
  );

-- ROASTED INVENTORY
CREATE POLICY "View own store roasted inventory"
  ON roasted_coffee_inventory FOR SELECT
  USING (store_id = get_user_store_id() OR get_user_role() = 'admin');
CREATE POLICY "Update own store roasted inventory"
  ON roasted_coffee_inventory FOR UPDATE
  USING (store_id = get_user_store_id() OR get_user_role() = 'admin');

-- FLAVOR PROFILES
CREATE POLICY "All can view flavor profiles"
  ON flavor_profiles FOR SELECT USING (true);
CREATE POLICY "Torrador/admin can insert flavor profiles"
  ON flavor_profiles FOR INSERT
  WITH CHECK (get_user_role() IN ('torrador', 'admin'));
CREATE POLICY "Torrador/admin can update flavor profiles"
  ON flavor_profiles FOR UPDATE
  USING (get_user_role() IN ('torrador', 'admin'));

-- RECIPES
CREATE POLICY "View own store or shared recipes"
  ON recipes FOR SELECT
  USING (is_shared = true OR store_id = get_user_store_id() OR get_user_role() = 'admin');
CREATE POLICY "Auth users can insert recipes"
  ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators and admins can update recipes"
  ON recipes FOR UPDATE
  USING (created_by = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY "Creators and admins can delete recipes"
  ON recipes FOR DELETE
  USING (created_by = auth.uid() OR get_user_role() = 'admin');

-- RECIPE COMMENTS
CREATE POLICY "View all comments"
  ON recipe_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert comments"
  ON recipe_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can delete own comments"
  ON recipe_comments FOR DELETE
  USING (created_by = auth.uid() OR get_user_role() = 'admin');

-- STORES (readable by all authenticated users)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can view stores"
  ON stores FOR SELECT USING (true);
