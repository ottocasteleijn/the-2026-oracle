import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Group } from "@/types/database";
import { Users, Plus, ArrowRight, Copy } from "lucide-react";

async function getUserGroups(): Promise<(Group & { member_count: number })[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      group_members!inner (user_id)
    `)
    .eq("group_members.user_id", user.id);

  if (error) {
    console.error("Error fetching groups:", error);
    return [];
  }

  // Get member counts
  const groupsWithCounts = await Promise.all(
    (data ?? []).map(async (group) => {
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id);

      // Explicitly construct object to avoid spread type error
      const g = group as Group;
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        invite_code: g.invite_code,
        created_by: g.created_by,
        max_members: g.max_members,
        is_active: g.is_active,
        created_at: g.created_at,
        updated_at: g.updated_at,
        member_count: count ?? 0,
      };
    })
  );

  return groupsWithCounts;
}

export default async function GroupsPage() {
  const groups = await getUserGroups();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
              Your Circles
            </h1>
            <p className="text-text-secondary">
              Private groups where you share predictions with friends
            </p>
          </div>
          <Link href="/groups/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Circle
            </Button>
          </Link>
        </div>

        {/* Groups Grid */}
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="p-6 hover:border-oracle-purple/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-oracle-purple to-oracle-cyan flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary">
                      {group.member_count} members
                    </Badge>
                  </div>

                  <h3 className="font-display text-lg font-bold text-text-primary mb-2">
                    {group.name}
                  </h3>
                  
                  {group.description && (
                    <p className="text-sm text-text-muted mb-4 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Copy className="h-3 w-3" />
                      <code className="bg-slate-deep px-2 py-0.5 rounded">
                        {group.invite_code}
                      </code>
                    </div>
                    <ArrowRight className="h-4 w-4 text-oracle-purple" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-glass-purple flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-oracle-purple" />
            </div>
            <h2 className="font-display text-xl font-bold text-text-primary mb-2">
              No Circles Yet
            </h2>
            <p className="text-text-muted mb-6 max-w-md mx-auto">
              Create a circle to start making predictions with your friends, or join
              one using an invite code.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/groups/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Circle
                </Button>
              </Link>
              <Link href="/groups/join">
                <Button variant="secondary" className="gap-2">
                  Join with Code
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Join Section */}
        {groups.length > 0 && (
          <div className="mt-8 p-6 rounded-2xl bg-glass-white border border-glass-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary mb-1">
                  Have an invite code?
                </h3>
                <p className="text-sm text-text-muted">
                  Join a friend&apos;s circle to see and vote on their predictions
                </p>
              </div>
              <Link href="/groups/join">
                <Button variant="secondary">Join Circle</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

