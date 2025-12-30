import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const joinGroupSchema = z.object({
  invite_code: z.string().min(6).max(20),
});

/**
 * POST /api/groups/join
 * Join a group using an invite code
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
    const parsed = joinGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { invite_code } = parsed.data;

    // Use the database function to join
    const { data: groupId, error } = await supabase.rpc("join_group_by_code", {
      p_invite_code: invite_code,
    });

    if (error) {
      console.error("Error joining group:", error);

      if (error.message.includes("Invalid")) {
        return NextResponse.json(
          { error: "Invalid or expired invite code" },
          { status: 404 }
        );
      }

      if (error.message.includes("full")) {
        return NextResponse.json(
          { error: "This group is full" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to join group" },
        { status: 500 }
      );
    }

    // Get the group details
    const { data: group } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    return NextResponse.json(
      { message: "Successfully joined group", group },
      { status: 200 }
    );
  } catch (error) {
    console.error("Groups join API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

