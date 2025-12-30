import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const castVoteSchema = z.object({
  prediction_id: z.string().uuid(),
  vote: z.enum(["agreed", "doubt"]),
});

/**
 * POST /api/votes
 * Cast a vote on a prediction
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
    const parsed = castVoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prediction_id, vote } = parsed.data;

    // Check if user owns the prediction (can't vote on own prediction)
    const { data: prediction } = await supabase
      .from("predictions")
      .select("user_id, group_id")
      .eq("id", prediction_id)
      .single();

    if (!prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    if (prediction.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own prediction" },
        { status: 400 }
      );
    }

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", prediction.group_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Upsert the vote (update if exists, create if not)
    const { data: voteData, error } = await supabase
      .from("votes")
      .upsert(
        {
          prediction_id,
          user_id: user.id,
          vote,
        },
        {
          onConflict: "prediction_id,user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error casting vote:", error);
      return NextResponse.json(
        { error: "Failed to cast vote" },
        { status: 500 }
      );
    }

    return NextResponse.json(voteData);
  } catch (error) {
    console.error("Votes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/votes
 * Remove a vote from a prediction
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get("prediction_id");

    if (!predictionId) {
      return NextResponse.json(
        { error: "prediction_id is required" },
        { status: 400 }
      );
    }

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

    // Delete the vote
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("prediction_id", predictionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error removing vote:", error);
      return NextResponse.json(
        { error: "Failed to remove vote" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Vote removed" });
  } catch (error) {
    console.error("Votes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

