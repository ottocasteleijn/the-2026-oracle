import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-glass-purple flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-oracle-purple" />
            </div>
            <h2 className="font-display text-xl font-bold text-text-primary mb-2">
              Sign In Required
            </h2>
            <p className="text-text-muted mb-6">
              Please sign in to view your circles.
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
            Your Circles
          </h1>
          <p className="text-text-secondary">
            Private groups where you share predictions with friends
          </p>
        </div>

        {/* Coming Soon */}
        <Card className="p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-glass-purple flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-oracle-purple" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">
            Coming Soon
          </h2>
          <p className="text-text-muted mb-6 max-w-md mx-auto">
            Group functionality is being built. Check back soon!
          </p>
          <Link href="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
