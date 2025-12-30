import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Users, Trophy, Menu, LogOut } from "lucide-react";

async function UserNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    );
  }

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={profile?.avatar_url ?? undefined}
          alt={profile?.display_name ?? "User"}
        />
        <AvatarFallback>
          {(profile?.display_name ?? user.email ?? "U").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-text-primary hidden sm:block">
        {profile?.display_name ?? user.email?.split("@")[0]}
      </span>
      <form action="/api/auth/signout" method="post">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-oracle-purple to-oracle-cyan flex items-center justify-center transition-transform group-hover:scale-105">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-xl bg-oracle-purple/20 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-display text-lg font-bold text-text-primary hidden sm:block">
                The 2026 Oracle
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Feed
                </Button>
              </Link>
              <Link href="/groups">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  Groups
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Button>
              </Link>
            </div>

            {/* User Nav */}
            <Suspense
              fallback={
                <div className="h-8 w-24 rounded bg-slate-mid animate-pulse" />
              }
            >
              <UserNav />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-glass-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-text-muted">
              <Eye className="h-4 w-4" />
              <span className="text-sm">The 2026 Oracle</span>
            </div>
            <p className="text-sm text-text-muted">
              Make predictions. Get judged. Win bragging rights.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

