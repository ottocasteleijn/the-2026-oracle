import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createGroupSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  max_members: z.number().int().min(2).max(100).optional().default(50),
});

const joinGroupSchema = z.object({
  invite_code: z.string().length(12),
});

/**
 * POST /api/groups
 * Create a new group
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
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: data.name,
        description: data.description,
        max_members: data.max_members,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Error creating group:", groupError);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: 500 }
      );
    }

    // Add creator as admin member
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "admin",
    });

    if (memberError) {
      console.error("Error adding member:", memberError);
      // Delete the group if we couldn't add the member
      await supabase.from("groups").delete().eq("id", group.id);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: 500 }
      );
    }

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Groups API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/groups
 * Get all groups for the current user
 */
export async function GET() {
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

    // Get user's groups
    const { data, error } = await supabase
      .from("groups")
      .select(
        `
        *,
        group_members!inner (user_id, role)
      `
      )
      .eq("group_members.user_id", user.id);

    if (error) {
      console.error("Error fetching groups:", error);
      return NextResponse.json(
        { error: "Failed to fetch groups" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Groups API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

