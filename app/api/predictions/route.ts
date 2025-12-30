import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createPredictionSchema = z.object({
  content: z.string().min(10).max(1000),
  group_id: z.string().uuid(),
  concreteness_score: z.number().int().min(4).max(10),
  boldness_score: z.number().int().min(0).max(10),
  payout_odds: z.number().min(1),
  ai_comment: z.string().max(280),
  stake_amount: z.number().positive().optional().default(100),
});

/**
 * POST /api/predictions
 * Create a new prediction
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parsed = createPredictionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", data.group_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Create the prediction
    const { data: prediction, error } = await supabase
      .from("predictions")
      .insert({
        user_id: user.id,
        group_id: data.group_id,
        content: data.content,
        concreteness_score: data.concreteness_score,
        boldness_score: data.boldness_score,
        payout_odds: data.payout_odds,
        ai_comment: data.ai_comment,
        stake_amount: data.stake_amount,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating prediction:", error);
      return NextResponse.json(
        { error: "Failed to create prediction" },
        { status: 500 }
      );
    }

    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    console.error("Predictions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/predictions
 * Get predictions for the current user's groups
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("group_id");
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let query = supabase
      .from("prediction_with_votes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching predictions:", error);
      return NextResponse.json(
        { error: "Failed to fetch predictions" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Predictions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

