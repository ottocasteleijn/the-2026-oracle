"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function JoinGroupPage() {
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: inviteCode.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to join group");
      }

      const { group } = await response.json();
      setSuccess(`Successfully joined "${group.name}"!`);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/groups/${group.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Back Link */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Circles
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-oracle-cyan to-oracle-purple flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            Join a Circle
          </h1>
          <p className="text-text-muted">
            Enter the invite code shared by your friend
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleJoin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-oracle-rose/10 border border-oracle-rose/30 text-oracle-rose text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-oracle-emerald/10 border border-oracle-emerald/30 text-oracle-emerald text-sm">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                Invite Code
              </label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123DEF456"
                className="font-mono text-center text-lg tracking-widest"
                required
                minLength={6}
              />
              <p className="text-xs text-text-muted text-center">
                The invite code is case-insensitive
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || inviteCode.length < 6 || !!success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Joined!
                </>
              ) : (
                "Join Circle"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

