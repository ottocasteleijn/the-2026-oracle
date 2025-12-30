/**
 * Centralized Supabase Query Result Types
 * 
 * These interfaces provide explicit typing for Supabase query results
 * to work around TypeScript strict mode inferring `never` types.
 */

// Profile query result (for simple profile lookups)
export interface ProfileQueryResult {
  display_name: string;
  avatar_url: string | null;
}

// Full profile with all fields
export interface FullProfileQueryResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  total_potential_winnings: number;
  predictions_count: number;
  correct_predictions: number;
  created_at: string;
  updated_at: string;
}

// Group query result (for groups with joined members)
export interface GroupQueryResult {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  max_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  group_members: { user_id: string }[];
}

// Group member query result (for member listings with profiles)
export interface MemberQueryResult {
  role: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

// Leaderboard RPC result
export interface LeaderboardRpcResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_potential_winnings: number;
  predictions_count: number;
  correct_predictions: number;
}

// Prediction with vote counts (from view)
export interface PredictionViewResult {
  id: string;
  user_id: string;
  group_id: string | null;
  prediction_text: string;
  target_date: string;
  concreteness_score: number;
  boldness_score: number;
  payout_odds: number;
  ai_comment: string | null;
  status: string;
  result: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
  display_name: string;
  avatar_url: string | null;
  group_name: string | null;
  agree_count: number;
  disagree_count: number;
}

