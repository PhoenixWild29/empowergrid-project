-- Row Level Security (RLS) Policies for EmpowerGRID
-- These policies ensure data access control at the database level
-- Run this SQL script directly on your PostgreSQL database after running migrations

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON TABLES
-- ============================================================================

-- Enable RLS on User table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Session table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on AuthChallenge table
ALTER TABLE auth_challenges ENABLE ROW LEVEL SECURITY;

-- Enable RLS on BlacklistedToken table
ALTER TABLE blacklisted_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER TABLE POLICIES
-- ============================================================================

-- Policy: Users can read their own data
CREATE POLICY user_read_own
  ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::text);

-- Policy: Users can update their own profile
CREATE POLICY user_update_own
  ON users
  FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::text);

-- Policy: Admins can read all users
CREATE POLICY admin_read_all_users
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = current_setting('app.current_user_id', true)::text
      AND role = 'ADMIN'
    )
  );

-- Policy: System can create new users (for registration)
CREATE POLICY system_create_users
  ON users
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- SESSION TABLE POLICIES
-- ============================================================================

-- Policy: Users can read their own sessions
CREATE POLICY session_read_own
  ON sessions
  FOR SELECT
  USING ("userId" = current_setting('app.current_user_id', true)::text);

-- Policy: Users can delete their own sessions (logout)
CREATE POLICY session_delete_own
  ON sessions
  FOR DELETE
  USING ("userId" = current_setting('app.current_user_id', true)::text);

-- Policy: System can create sessions (for login)
CREATE POLICY system_create_sessions
  ON sessions
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update sessions (for token refresh)
CREATE POLICY system_update_sessions
  ON sessions
  FOR UPDATE
  USING (true);

-- Policy: Admins can read all sessions
CREATE POLICY admin_read_all_sessions
  ON sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = current_setting('app.current_user_id', true)::text
      AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- AUTH CHALLENGE POLICIES
-- ============================================================================

-- Policy: Anyone can create challenges (for authentication)
CREATE POLICY challenge_create_public
  ON auth_challenges
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can read challenges (for validation)
CREATE POLICY system_read_challenges
  ON auth_challenges
  FOR SELECT
  USING (true);

-- Policy: System can update challenges (mark as used)
CREATE POLICY system_update_challenges
  ON auth_challenges
  FOR UPDATE
  USING (true);

-- Policy: System can delete expired challenges
CREATE POLICY system_delete_expired_challenges
  ON auth_challenges
  FOR DELETE
  USING ("expiresAt" < NOW());

-- ============================================================================
-- BLACKLISTED TOKEN POLICIES
-- ============================================================================

-- Policy: Users can blacklist their own tokens (logout)
CREATE POLICY blacklist_own_tokens
  ON blacklisted_tokens
  FOR INSERT
  WITH CHECK ("userId" = current_setting('app.current_user_id', true)::text);

-- Policy: System can read blacklist (for validation)
CREATE POLICY system_read_blacklist
  ON blacklisted_tokens
  FOR SELECT
  USING (true);

-- Policy: System can cleanup expired blacklisted tokens
CREATE POLICY system_cleanup_expired_blacklist
  ON blacklisted_tokens
  FOR DELETE
  USING ("expiresAt" < NOW());

-- Policy: Admins can read all blacklisted tokens
CREATE POLICY admin_read_blacklist
  ON blacklisted_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = current_setting('app.current_user_id', true)::text
      AND role = 'ADMIN'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS text AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

-- Before running queries as a specific user, set the context:
-- SELECT set_current_user_id('user_cuid_here');

-- Example:
-- SELECT set_current_user_id('clx123456789');
-- SELECT * FROM users; -- Will only return the user's own data

-- To run as system (no RLS), use a superuser account or:
-- SET SESSION AUTHORIZATION postgres;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('users', 'sessions', 'auth_challenges', 'blacklisted_tokens');

-- View all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;






