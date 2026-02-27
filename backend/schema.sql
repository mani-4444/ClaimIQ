-- ClaimIQ Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor

-- Enable pgvector extension for CLIP embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    policy_type TEXT CHECK (policy_type IN ('comprehensive', 'third_party', 'own_damage')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: claims
-- ============================================
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    user_description TEXT,
    policy_number TEXT NOT NULL,
    incident_date TIMESTAMPTZ,
    location TEXT,
    damage_json JSONB,
    ai_explanation TEXT,
    cost_breakdown JSONB,
    cost_total INTEGER DEFAULT 0,
    fraud_score INTEGER DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
    fraud_flags TEXT[] DEFAULT '{}',
    decision TEXT DEFAULT 'pending' CHECK (decision IN ('pending', 'pre_approved', 'manual_review', 'rejected')),
    decision_confidence FLOAT DEFAULT 0.0,
    risk_level TEXT DEFAULT 'unknown' CHECK (risk_level IN ('low', 'medium', 'high', 'critical', 'unknown')),
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- Table: cost_table (reference data)
-- ============================================
CREATE TABLE IF NOT EXISTS cost_table (
    id SERIAL PRIMARY KEY,
    zone_name TEXT UNIQUE NOT NULL,
    minor_cost INTEGER NOT NULL,
    moderate_cost INTEGER NOT NULL,
    severe_cost INTEGER NOT NULL,
    labor_cost INTEGER NOT NULL DEFAULT 2000,
    regional_multiplier FLOAT NOT NULL DEFAULT 1.0
);

-- ============================================
-- Table: fraud_history (with vector embeddings)
-- ============================================
CREATE TABLE IF NOT EXISTS fraud_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    image_embedding VECTOR(512),
    similarity_score FLOAT,
    matched_claim_id UUID REFERENCES claims(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_decision ON claims(decision);
CREATE INDEX IF NOT EXISTS idx_fraud_claim_id ON fraud_history(claim_id);

-- Vector similarity index (create after inserting some data)
-- CREATE INDEX idx_fraud_embedding ON fraud_history
--     USING ivfflat (image_embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- Seed: cost_table (4 vehicle zones)
-- ============================================
INSERT INTO cost_table (zone_name, minor_cost, moderate_cost, severe_cost, labor_cost, regional_multiplier) VALUES
    ('Front',      5000, 15000, 35000, 2500, 1.0),
    ('Rear',       4000, 12000, 28000, 2000, 1.0),
    ('Left Side',  4500, 13000, 30000, 2000, 1.0),
    ('Right Side', 4500, 13000, 30000, 2000, 1.0)
ON CONFLICT (zone_name) DO NOTHING;

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own claims" ON claims;
CREATE POLICY "Users can view own claims"
    ON claims FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own claims" ON claims;
CREATE POLICY "Users can insert own claims"
    ON claims FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own claims" ON claims;
CREATE POLICY "Users can update own claims"
    ON claims FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own claims" ON claims;
CREATE POLICY "Users can delete own claims"
    ON claims FOR DELETE
    USING (auth.uid() = user_id);
