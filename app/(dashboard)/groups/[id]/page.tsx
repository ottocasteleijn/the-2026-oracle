import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PredictionInput } from "@/components/prediction-input";
import { PredictionCard } from "@/components/prediction-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Group, PredictionWithDetails } from "@/types/database";
import type { MemberQueryResult } from "@/types/supabase-queries";
import { Users, Copy, ArrowLeft, Settings, Crown } from "lucide-react";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

async function getGroup(id: string): Promise<(Group & { userRole: string }) | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get group with membership check
  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !group) return null;

  // Check if user is a member
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;

  // Explicitly construct the return object to satisfy TypeScript
  const groupData = group as Group;
  const memberRole = (membership as { role: string }).role;
  return {
    id: groupData.id,
    name: groupData.name,
    description: groupData.description,
    invite_code: groupData.invite_code,
    created_by: groupData.created_by,
    max_members: groupData.max_members,
    is_active: groupData.is_active,
    created_at: groupData.created_at,
    updated_at: groupData.updated_at,
    userRole: memberRole,
  };
}

async function getGroupMembers(groupId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("group_members")
    .select(`
      role,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq("group_id", groupId);

  const members = (data ?? []) as MemberQueryResult[];
  
  return members
    .filter((m) => m.profiles !== null)
    .map((m) => ({
      id: m.profiles!.id,
      display_name: m.profiles!.display_name,
      avatar_url: m.profiles!.avatar_url,
      role: m.role,
    }));
}

async function getGroupPredictions(groupId: string): Promise<PredictionWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("prediction_with_votes")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  return (data ?? []) as PredictionWithDetails[];
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  const [group, members, predictions, user] = await Promise.all([
    getGroup(id),
    getGroupMembers(id),
    getGroupPredictions(id),
    getCurrentUser(),
  ]);

  if (!group) {
    notFound();
  }

  const isAdmin = group.userRole === "admin";

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Circles
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Group Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-oracle-purple to-oracle-cyan flex items-center justify-center">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display text-2xl font-bold text-text-primary">
                      {group.name}
                    </h1>
                    {group.description && (
                      <p className="text-text-muted">{group.description}</p>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Invite Code */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-glass-white border border-glass-border">
                <div className="flex items-center gap-3">
                  <Copy className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      Invite Code
                    </p>
                    <code className="text-lg font-mono text-oracle-purple">
                      {group.invite_code}
                    </code>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(group.invite_code);
                  }}
                >
                  Copy
                </Button>
              </div>
            </Card>

            {/* Prediction Input */}
            <PredictionInput
              groupId={group.id}
              onSubmit={async (prediction) => {
                "use server";
                // TODO: Save prediction
                console.log("Prediction for group:", prediction);
              }}
            />

            {/* Predictions */}
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-4">
                Group Predictions
              </h2>

              {predictions.length > 0 ? (
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <PredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      currentUserId={user?.id}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-text-muted">
                    No predictions yet. Be the first to make one!
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar - Members */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-text-primary">
                    Members
                  </h3>
                  <Badge variant="secondary">{members.length}</Badge>
                </div>

                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-glass-white transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={member.avatar_url ?? undefined}
                          alt={member.display_name}
                        />
                        <AvatarFallback className="text-xs">
                          {member.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {member.display_name}
                        </p>
                      </div>
                      {member.role === "admin" && (
                        <Crown className="h-4 w-4 text-oracle-amber" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

