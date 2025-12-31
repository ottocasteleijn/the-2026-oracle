import { createClient } from "@/lib/supabase/server";
import { Eye, Sparkles } from "lucide-react";

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-oracle-purple/10 to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-glass-purple px-4 py-1.5 mb-6 border border-glass-border">
            <Sparkles className="h-4 w-4 text-oracle-purple" />
            <span className="text-sm font-medium text-oracle-purple-glow">
              The Future Awaits
            </span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-gradient">The 2026 Oracle</span>
          </h1>
          
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            Make bold predictions about 2026. The AI Judge scores your prophecy.
            The bolder and more specific, the higher your potential payout.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {!user && (
          <div className="glass-purple rounded-2xl p-8 text-center">
            <Eye className="h-12 w-12 text-oracle-purple mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-text-primary mb-2">
              Join the Oracle
            </h2>
            <p className="text-text-secondary mb-6">
              Sign in to make your predictions and compete with friends.
            </p>
            <a
              href="/login"
              className="btn-oracle btn-oracle-primary inline-flex"
            >
              Sign In to Predict
            </a>
          </div>
        )}

        {user && (
          <div className="glass rounded-2xl p-8 text-center">
            <Eye className="h-12 w-12 text-oracle-purple mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-text-primary mb-2">
              Welcome, Oracle
            </h2>
            <p className="text-text-secondary mb-6">
              You&apos;re signed in as {user.email}. Start making predictions!
            </p>
            <a
              href="/groups"
              className="btn-oracle btn-oracle-primary inline-flex"
            >
              View Your Circles
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
