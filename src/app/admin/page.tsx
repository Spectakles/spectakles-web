"use client";

import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, Lock, Mail, ShieldAlert, Sparkles } from "lucide-react";
import SpectaklesLogo from "@/components/SpectaklesLogo";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed");
      }

      setAuthenticated(true);
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  };

  if (authenticated === null) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-500 font-medium">Checking session...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-green/10 text-brand-green mb-4">
              <Lock size={26} />
            </div>
            <h1 className="text-2xl font-bold text-brand-dark tracking-tight">Admin Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to manage blog posts, media, and SEO metatags.</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center gap-2">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="admin-email">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@spectakles.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound size={16} />
                </div>
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand-green hover:bg-[#257341] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Authenticating..." : "Enter Admin Panel"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            Protected Spectakles CMS Session • SHA-256 HMAC
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <SpectaklesLogo height={30} className="h-7 w-auto" />
          <span className="text-xs font-bold bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-full">
            Admin CMS
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3.5 py-1.5 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="py-6">
        <AdminDashboard onLogout={handleLogout} />
      </div>
    </div>
  );
}
