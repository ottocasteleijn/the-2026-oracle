/**
 * Database types for The 2026 Oracle
 * Re-exports generated types from Supabase and adds custom types
 */

// Re-export all generated types
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "./supabase";
export { Constants } from "./supabase";

// Import Database type for use in this file
import type { Database } from "./supabase";

// Type aliases for common table types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"];

// Enum type aliases
export type MemberRole = Database["public"]["Enums"]["member_role"];
export type PredictionStatus = Database["public"]["Enums"]["prediction_status"];
export type VoteType = Database["public"]["Enums"]["vote_type"];

// View types
export type PredictionWithVotes = Database["public"]["Views"]["prediction_with_votes"]["Row"];

// Extended types with joins (for UI display)
export interface PredictionWithDetails {
  id: string;
  user_id: string;
  group_id: string;
  content: string;
  concreteness_score: number;
  boldness_score: number;
  payout_odds: number;
  ai_comment: string;
  stake_amount: number | null;
  potential_payout: number | null;
  status: PredictionStatus;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar: string | null;
  group_name: string | null;
  agreed_count: number | null;
  doubt_count: number | null;
}

export interface GroupWithMembers extends Group {
  members: GroupMemberWithProfile[];
  predictions_count: number;
}

export interface GroupMemberWithProfile extends GroupMember {
  profile: Profile;
}

// API Response types
export interface JudgeResponse {
  concreteness_score: number;
  boldness_score: number;
  payout_odds: number;
  ai_comment: string;
  is_valid: boolean;
  validation_message?: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_potential_winnings: number;
  predictions_count: number;
  correct_predictions: number;
  rank: number;
}

// Form types
export interface CreatePredictionInput {
  content: string;
  group_id: string;
  stake_amount?: number;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  max_members?: number;
}

export interface JoinGroupInput {
  invite_code: string;
}

export interface CastVoteInput {
  prediction_id: string;
  vote: VoteType;
}

export interface SettlePredictionInput {
  prediction_id: string;
  outcome: boolean;
  evidence_url?: string;
  evidence_description?: string;
}
