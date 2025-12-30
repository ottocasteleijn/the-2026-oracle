-- ═══════════════════════════════════════════════════════════════════════════════
-- THE 2026 ORACLE - DATABASE SCHEMA
-- A social prediction market with AI-powered evaluation
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: profiles
-- Extended user data linked to Supabase auth.users
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    total_potential_winnings DECIMAL(12, 2) DEFAULT 0,
    predictions_count INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for leaderboard queries
CREATE INDEX idx_profiles_winnings ON profiles(total_potential_winnings DESC);
CREATE INDEX idx_profiles_display_name ON profiles(display_name);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Oracle Seeker'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: groups (Circles)
-- Private groups/circles for friends to share predictions
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for invite code lookups
CREATE UNIQUE INDEX idx_groups_invite_code ON groups(invite_code);
CREATE INDEX idx_groups_created_by ON groups(created_by);

CREATE TRIGGER groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: group_members
-- Many-to-many relationship between users and groups
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE member_role AS ENUM ('admin', 'member');

CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique membership
    UNIQUE(group_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: predictions
-- Core prediction data with AI-generated scores
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE prediction_status AS ENUM ('pending', 'correct', 'incorrect', 'cancelled');

CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    
    -- The prediction content
    content TEXT NOT NULL,
    
    -- AI Judge scores
    concreteness_score INTEGER NOT NULL CHECK (concreteness_score >= 0 AND concreteness_score <= 10),
    boldness_score INTEGER NOT NULL CHECK (boldness_score >= 0 AND boldness_score <= 10),
    payout_odds DECIMAL(5, 2) NOT NULL CHECK (payout_odds >= 1.0),
    ai_comment TEXT NOT NULL,
    
    -- Betting mechanics
    stake_amount DECIMAL(10, 2) DEFAULT 100.00,
    potential_payout DECIMAL(12, 2) GENERATED ALWAYS AS (stake_amount * payout_odds) STORED,
    
    -- Metadata
    status prediction_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Validation: concreteness must be at least 4 to submit
    CONSTRAINT min_concreteness CHECK (concreteness_score >= 4)
);

-- Indexes for efficient queries
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_group_id ON predictions(group_id);
CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX idx_predictions_payout ON predictions(potential_payout DESC);

CREATE TRIGGER predictions_updated_at
    BEFORE UPDATE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update user's total potential winnings when predictions change
CREATE OR REPLACE FUNCTION update_user_potential_winnings()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate total potential winnings for the user
    UPDATE profiles
    SET total_potential_winnings = (
        SELECT COALESCE(SUM(potential_payout), 0)
        FROM predictions
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        AND status = 'pending'
    )
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER predictions_update_winnings
    AFTER INSERT OR UPDATE OR DELETE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_potential_winnings();

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: votes
-- Friends can vote 'Agreed' or 'Doubt' on predictions
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE vote_type AS ENUM ('agreed', 'doubt');

CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote vote_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Each user can only vote once per prediction
    UNIQUE(prediction_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_votes_prediction_id ON votes(prediction_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: settlements
-- Record of prediction outcomes when 2026 arrives
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE UNIQUE,
    outcome BOOLEAN NOT NULL, -- true = prediction came true, false = didn't
    evidence_url TEXT, -- Link to proof
    evidence_description TEXT,
    settled_by UUID NOT NULL REFERENCES profiles(id),
    disputed BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Only settled predictions should have settlements
    CONSTRAINT one_settlement_per_prediction UNIQUE(prediction_id)
);

-- Index for queries
CREATE INDEX idx_settlements_prediction_id ON settlements(prediction_id);
CREATE INDEX idx_settlements_settled_by ON settlements(settled_by);

-- Update prediction status when settled
CREATE OR REPLACE FUNCTION update_prediction_on_settlement()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE predictions
    SET status = CASE WHEN NEW.outcome THEN 'correct' ELSE 'incorrect' END
    WHERE id = NEW.prediction_id;
    
    -- Update user's correct predictions count
    IF NEW.outcome THEN
        UPDATE profiles
        SET correct_predictions = correct_predictions + 1
        WHERE id = (SELECT user_id FROM predictions WHERE id = NEW.prediction_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settlements_update_prediction
    AFTER INSERT ON settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_prediction_on_settlement();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEW: prediction_with_votes
-- Aggregated view of predictions with vote counts
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE VIEW prediction_with_votes AS
SELECT 
    p.*,
    pr.display_name AS author_name,
    pr.avatar_url AS author_avatar,
    g.name AS group_name,
    COALESCE(v.agreed_count, 0) AS agreed_count,
    COALESCE(v.doubt_count, 0) AS doubt_count
FROM predictions p
LEFT JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN groups g ON p.group_id = g.id
LEFT JOIN (
    SELECT 
        prediction_id,
        COUNT(*) FILTER (WHERE vote = 'agreed') AS agreed_count,
        COUNT(*) FILTER (WHERE vote = 'doubt') AS doubt_count
    FROM votes
    GROUP BY prediction_id
) v ON p.id = v.prediction_id;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROFILES POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users can view all profiles (for leaderboard, etc.)
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- GROUPS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users can view groups they are members of
CREATE POLICY "Users can view their groups"
    ON groups FOR SELECT
    USING (
        id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Any authenticated user can create a group
CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Only group admins can update group settings
CREATE POLICY "Group admins can update group"
    ON groups FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_id = id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Only group creator can delete group
CREATE POLICY "Group creator can delete group"
    ON groups FOR DELETE
    USING (created_by = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- GROUP MEMBERS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users can view members of groups they belong to
CREATE POLICY "Users can view members of their groups"
    ON group_members FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Users can join groups (insert themselves)
CREATE POLICY "Users can join groups"
    ON group_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can leave groups (delete themselves)
CREATE POLICY "Users can leave groups"
    ON group_members FOR DELETE
    USING (user_id = auth.uid());

-- Admins can remove members
CREATE POLICY "Admins can remove members"
    ON group_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════════
-- PREDICTIONS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users can view predictions in their groups
CREATE POLICY "Users can view predictions in their groups"
    ON predictions FOR SELECT
    USING (
        group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Users can create predictions in their groups
CREATE POLICY "Users can create predictions"
    ON predictions FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    );

-- Users can update their own pending predictions
CREATE POLICY "Users can update own pending predictions"
    ON predictions FOR UPDATE
    USING (user_id = auth.uid() AND status = 'pending')
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own predictions, admins can delete any
CREATE POLICY "Users can delete own predictions"
    ON predictions FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = predictions.group_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════════
-- VOTES POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users can view votes on predictions in their groups
CREATE POLICY "Users can view votes in their groups"
    ON votes FOR SELECT
    USING (
        prediction_id IN (
            SELECT id FROM predictions WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Users can vote on predictions in their groups (not their own)
CREATE POLICY "Users can vote on others predictions"
    ON votes FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND prediction_id IN (
            SELECT id FROM predictions 
            WHERE user_id != auth.uid()
            AND group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Users can change their vote
CREATE POLICY "Users can update own votes"
    ON votes FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their vote
CREATE POLICY "Users can delete own votes"
    ON votes FOR DELETE
    USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- SETTLEMENTS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users can view settlements for predictions in their groups
CREATE POLICY "Users can view settlements in their groups"
    ON settlements FOR SELECT
    USING (
        prediction_id IN (
            SELECT id FROM predictions WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- Group admins can settle predictions
CREATE POLICY "Admins can settle predictions"
    ON settlements FOR INSERT
    WITH CHECK (
        settled_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM predictions p
            JOIN group_members gm ON p.group_id = gm.group_id
            WHERE p.id = prediction_id
            AND gm.user_id = auth.uid()
            AND gm.role = 'admin'
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to join a group by invite code
CREATE OR REPLACE FUNCTION join_group_by_code(p_invite_code TEXT)
RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
    v_member_count INTEGER;
    v_max_members INTEGER;
BEGIN
    -- Find the group
    SELECT id, max_members INTO v_group_id, v_max_members
    FROM groups
    WHERE invite_code = p_invite_code AND is_active = true;
    
    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive invite code';
    END IF;
    
    -- Check member count
    SELECT COUNT(*) INTO v_member_count
    FROM group_members
    WHERE group_id = v_group_id;
    
    IF v_member_count >= v_max_members THEN
        RAISE EXCEPTION 'Group is full';
    END IF;
    
    -- Add member
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (v_group_id, auth.uid(), 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
    
    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT,
    total_potential_winnings DECIMAL,
    predictions_count INTEGER,
    correct_predictions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.display_name,
        p.avatar_url,
        p.total_potential_winnings,
        p.predictions_count,
        p.correct_predictions
    FROM profiles p
    ORDER BY p.total_potential_winnings DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to regenerate invite code (admin only)
CREATE OR REPLACE FUNCTION regenerate_invite_code(p_group_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_new_code TEXT;
BEGIN
    -- Verify caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = p_group_id
        AND user_id = auth.uid()
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can regenerate invite codes';
    END IF;
    
    v_new_code := encode(gen_random_bytes(6), 'hex');
    
    UPDATE groups
    SET invite_code = v_new_code
    WHERE id = p_group_id;
    
    RETURN v_new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

