"use client";

import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Shield, Users, Crown, User, Loader2 } from "lucide-react";
import Link from "next/link";

interface SupabaseUser {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  subscription_tier: string | null;
  monthly_call_limit: number | null;
  monthly_used: number | null;
  created_at: string | null;
  last_login: string | null;
}

export default function TestingPage() {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [supabaseUsers, setSupabaseUsers] = useState<SupabaseUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const testSupabaseUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/test-supabase-users", {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch Supabase users");
      }

      const data = await response.json();
      setSupabaseUsers(data.users || []);
      setLastTestTime(new Date());
    } catch (err: any) {
      setError(err.message || "An error occurred while testing Supabase users");
      console.error("Error testing Supabase users:", err);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            You must be logged in to access this page.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            You do not have the necessary permissions to view this page.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Login as Admin
          </Link>
        </div>
      </div>
    );
  }

  const superAdmins = supabaseUsers.filter((u) => u.role === "super_admin");
  const admins = supabaseUsers.filter((u) => u.role === "admin");
  const regularUsers = supabaseUsers.filter(
    (u) => u.role !== "super_admin" && u.role !== "admin"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-4xl font-bold text-white mb-2">Testing</h1>
              <p className="text-gray-300 text-lg">
                Test and verify system connections and data
              </p>
            </div>
          </div>

          {/* Test Supabase Users Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Test Supabase Users
                </h2>
                <p className="text-gray-400">
                  Connect to Supabase and list all users, with special focus on
                  super admin accounts
                </p>
              </div>
              <button
                onClick={testSupabaseUsers}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Test Supabase Users
                  </>
                )}
              </button>
            </div>

            {lastTestTime && (
              <p className="text-sm text-gray-400 mb-4">
                Last tested: {lastTestTime.toLocaleString()}
              </p>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {supabaseUsers.length > 0 && (
              <div className="space-y-6 mt-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">
                      Total Users
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {supabaseUsers.length}
                    </div>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                    <div className="text-sm text-yellow-400 mb-1 flex items-center gap-1">
                      <Crown className="h-4 w-4" />
                      Super Admins
                    </div>
                    <div className="text-2xl font-bold text-yellow-300">
                      {superAdmins.length}
                    </div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                    <div className="text-sm text-blue-400 mb-1 flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      Admins
                    </div>
                    <div className="text-2xl font-bold text-blue-300">
                      {admins.length}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Regular Users
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {regularUsers.length}
                    </div>
                  </div>
                </div>

                {/* Super Admin Accounts */}
                {superAdmins.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Crown className="h-6 w-6 text-yellow-400" />
                      Super Admin Accounts ({superAdmins.length})
                    </h3>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Subscription
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Monthly Limit
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Created
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Last Login
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {superAdmins.map((admin) => (
                              <tr
                                key={admin.id}
                                className="hover:bg-gray-800/50"
                              >
                                <td className="px-4 py-3 text-sm text-white font-medium">
                                  {admin.email}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {admin.is_active ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-500/50">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-500/50">
                                      Inactive
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {admin.subscription_tier || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {admin.monthly_call_limit === -1
                                    ? "Unlimited"
                                    : admin.monthly_call_limit || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-400">
                                  {admin.created_at
                                    ? new Date(
                                        admin.created_at
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-400">
                                  {admin.last_login
                                    ? new Date(
                                        admin.last_login
                                      ).toLocaleDateString()
                                    : "Never"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular Admin Accounts */}
                {admins.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="h-6 w-6 text-blue-400" />
                      Regular Admin Accounts ({admins.length})
                    </h3>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Subscription
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Monthly Limit
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Created
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {admins.map((admin) => (
                              <tr
                                key={admin.id}
                                className="hover:bg-gray-800/50"
                              >
                                <td className="px-4 py-3 text-sm text-white font-medium">
                                  {admin.email}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {admin.is_active ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-500/50">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-500/50">
                                      Inactive
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {admin.subscription_tier || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {admin.monthly_call_limit === -1
                                    ? "Unlimited"
                                    : admin.monthly_call_limit || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-400">
                                  {admin.created_at
                                    ? new Date(
                                        admin.created_at
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* All Users Summary */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6 text-gray-400" />
                    All Users ({supabaseUsers.length})
                  </h3>
                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Subscription
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {supabaseUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-800/50">
                              <td className="px-4 py-3 text-sm text-gray-400">
                                {user.id}
                              </td>
                              <td className="px-4 py-3 text-sm text-white">
                                {user.email}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {user.role === "super_admin" ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300 border border-yellow-500/50">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Super Admin
                                  </span>
                                ) : user.role === "admin" ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-500/50">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin
                                  </span>
                                ) : (
                                  <span className="text-gray-300">
                                    {user.role}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {user.is_active ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-500/50">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-500/50">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {user.subscription_tier || "free"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
