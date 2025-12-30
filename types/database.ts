/**
 * Database types for The 2026 Oracle
 * These types mirror the Supabase schema
 */

export type MemberRole = "admin" | "member";
export type PredictionStatus = "pending" | "correct" | "incorrect" | "cancelled";
export type VoteType = "agreed" | "doubt";

export interface Profile {
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

export interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  max_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  group_id: string;
  content: string;
  concreteness_score: number;
  boldness_score: number;
  payout_odds: number;
  ai_comment: string;
  stake_amount: number;
  potential_payout: number;
  status: PredictionStatus;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  prediction_id: string;
  user_id: string;
  vote: VoteType;
  created_at: string;
}

export interface Settlement {
  id: string;
  prediction_id: string;
  outcome: boolean;
  evidence_url: string | null;
  evidence_description: string | null;
  settled_by: string;
  disputed: boolean;
  settled_at: string;
}

// Extended types with joins

export interface PredictionWithDetails extends Prediction {
  author_name: string;
  author_avatar: string | null;
  group_name: string;
  agreed_count: number;
  doubt_count: number;
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

// Supabase generated types helper
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at" | "total_potential_winnings" | "predictions_count" | "correct_predictions">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, "id" | "invite_code" | "created_at" | "updated_at" | "is_active">;
        Update: Partial<Omit<Group, "id" | "invite_code" | "created_by" | "created_at">>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, "id" | "joined_at">;
        Update: Partial<Omit<GroupMember, "id" | "group_id" | "user_id" | "joined_at">>;
      };
      predictions: {
        Row: Prediction;
        Insert: Omit<Prediction, "id" | "potential_payout" | "status" | "created_at" | "updated_at">;
        Update: Partial<Omit<Prediction, "id" | "user_id" | "potential_payout" | "created_at">>;
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, "id" | "created_at">;
        Update: Partial<Omit<Vote, "id" | "prediction_id" | "user_id" | "created_at">>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, "id" | "disputed" | "settled_at">;
        Update: Partial<Omit<Settlement, "id" | "prediction_id" | "settled_by" | "settled_at">>;
      };
    };
    Views: {
      prediction_with_votes: {
        Row: PredictionWithDetails;
      };
    };
    Functions: {
      join_group_by_code: {
        Args: { p_invite_code: string };
        Returns: string;
      };
      get_leaderboard: {
        Args: { p_limit?: number };
        Returns: LeaderboardEntry[];
      };
      regenerate_invite_code: {
        Args: { p_group_id: string };
        Returns: string;
      };
    };
  };
}

