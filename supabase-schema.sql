-- CattleOS Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create barns table
CREATE TABLE IF NOT EXISTS public.barns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    total_pens INTEGER NOT NULL DEFAULT 0,
    total_capacity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create pens table
CREATE TABLE IF NOT EXISTS public.pens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    barn_id UUID NOT NULL REFERENCES public.barns(id) ON DELETE CASCADE,
    capacity INTEGER NOT NULL DEFAULT 0,
    current_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create cattle table
CREATE TABLE IF NOT EXISTS public.cattle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_number TEXT NOT NULL,
    name TEXT,
    breed TEXT NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('Bull', 'Cow', 'Steer', 'Heifer')),
    birth_date DATE NOT NULL,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    purchase_weight DECIMAL(10,2),
    current_value DECIMAL(10,2),
    weight DECIMAL(10,2) NOT NULL,
    dam TEXT,
    sire TEXT,
    lot TEXT NOT NULL,
    pasture TEXT,
    pen_id UUID REFERENCES public.pens(id) ON DELETE SET NULL,
    barn_id UUID REFERENCES public.barns(id) ON DELETE SET NULL,
    batch_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Sold', 'Deceased', 'Culled')),
    stage TEXT NOT NULL CHECK (stage IN ('Calf', 'Weaned Calf', 'Yearling', 'Breeding', 'Finishing')),
    health_status TEXT NOT NULL CHECK (health_status IN ('Healthy', 'Sick', 'Treatment', 'Quarantine')),
    pregnancy_status TEXT CHECK (pregnancy_status IN ('Open', 'Bred', 'Pregnant', 'Calved')),
    expected_calving_date DATE,
    last_vet_visit DATE,
    notes TEXT,
    color_markings TEXT,
    horn_status TEXT,
    identification_method TEXT NOT NULL,
    rfid_tag TEXT,
    brand_number TEXT,
    days_on_feed INTEGER,
    projected_weight DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(tag_number, user_id)
);

-- Create weight_records table
CREATE TABLE IF NOT EXISTS public.weight_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cattle_id UUID NOT NULL REFERENCES public.cattle(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create health_records table
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cattle_id UUID NOT NULL REFERENCES public.cattle(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Vaccination', 'Treatment', 'Checkup', 'Surgery', 'Other')),
    description TEXT NOT NULL,
    veterinarian TEXT,
    cost DECIMAL(10,2),
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create feed_inventory table
CREATE TABLE IF NOT EXISTS public.feed_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    supplier TEXT,
    purchase_date DATE NOT NULL,
    expiry_date DATE,
    location TEXT,
    notes TEXT,
    daily_usage DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    cattle_id UUID REFERENCES public.cattle(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_cattle_user_id ON public.cattle(user_id);
CREATE INDEX idx_cattle_pen_id ON public.cattle(pen_id);
CREATE INDEX idx_cattle_barn_id ON public.cattle(barn_id);
CREATE INDEX idx_cattle_status ON public.cattle(status);
CREATE INDEX idx_cattle_tag_number ON public.cattle(tag_number);

CREATE INDEX idx_pens_user_id ON public.pens(user_id);
CREATE INDEX idx_pens_barn_id ON public.pens(barn_id);

CREATE INDEX idx_barns_user_id ON public.barns(user_id);

CREATE INDEX idx_weight_records_cattle_id ON public.weight_records(cattle_id);
CREATE INDEX idx_weight_records_user_id ON public.weight_records(user_id);

CREATE INDEX idx_health_records_cattle_id ON public.health_records(cattle_id);
CREATE INDEX idx_health_records_user_id ON public.health_records(user_id);

CREATE INDEX idx_feed_inventory_user_id ON public.feed_inventory(user_id);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_cattle_id ON public.transactions(cattle_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.barns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cattle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for barns
CREATE POLICY "Users can view their own barns" ON public.barns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own barns" ON public.barns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own barns" ON public.barns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own barns" ON public.barns
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for pens
CREATE POLICY "Users can view their own pens" ON public.pens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pens" ON public.pens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pens" ON public.pens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pens" ON public.pens
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cattle
CREATE POLICY "Users can view their own cattle" ON public.cattle
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cattle" ON public.cattle
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cattle" ON public.cattle
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cattle" ON public.cattle
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for weight_records
CREATE POLICY "Users can view their own weight records" ON public.weight_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight records" ON public.weight_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight records" ON public.weight_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight records" ON public.weight_records
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for health_records
CREATE POLICY "Users can view their own health records" ON public.health_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health records" ON public.health_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records" ON public.health_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health records" ON public.health_records
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for feed_inventory
CREATE POLICY "Users can view their own feed inventory" ON public.feed_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feed inventory" ON public.feed_inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feed inventory" ON public.feed_inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feed inventory" ON public.feed_inventory
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_barns_updated_at BEFORE UPDATE ON public.barns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pens_updated_at BEFORE UPDATE ON public.pens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cattle_updated_at BEFORE UPDATE ON public.cattle
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_inventory_updated_at BEFORE UPDATE ON public.feed_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
