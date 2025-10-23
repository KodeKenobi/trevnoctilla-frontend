"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Key,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Activity,
  Shield,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
  api_keys_count: number;
}

interface UserStats {
  total_calls: number;
  recent_calls: number;
  success_calls: number;
  error_calls: number;
  success_rate: number;
  popular_endpoints: Array<{ endpoint: string; count: number }>;
}

export default function UsersPage() {
  const { user, loading: userLoading } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Authentication guard - only redirect if we're sure user is not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      // Check if there's a token in localStorage before redirecting
      const token = localStorage.getItem("auth_token");
      if (!token) {
        // Only redirect if there's no token at all
        window.location.href = "/auth/login";
        return;
      }
      // If there's a token but user is not loaded yet, wait a bit more
      // This gives time for the user context to load when switching views
      const timeout = setTimeout(() => {
        if (!user) {
          window.location.href = "/auth/login";
        }
      }, 2000); // Wait 2 seconds before redirecting

      return () => clearTimeout(timeout);
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Refetch users when filters change
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get the session token from NextAuth
      const session = await fetch('/api/auth/session').then(res => res.json());
      
      if (!session?.user) {
        throw new Error('No active session found');
      }

      console.log('🔍 Fetching users with session:', session.user);

      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('is_active', statusFilter === 'active' ? 'true' : 'false');

      // Try admin API first
      try {
        const response = await fetch(
          `https://web-production-737b.up.railway.app/api/admin/users?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.accessToken || session.user.id}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Admin API response:', data);
          
          // Transform the data to match our interface
          const transformedUsers = data.users.map((user: any) => ({
            id: user.id,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at,
            last_login: user.last_login || user.created_at,
            api_keys_count: user.api_keys?.length || 0,
          }));

          setUsers(transformedUsers);
          setLoading(false);
          return;
        } else {
          console.log('❌ Admin API failed:', response.status, response.statusText);
        }
      } catch (adminError) {
        console.log('❌ Admin API error:', adminError);
      }

      // Fallback: Create user entry from current session
      console.log('🔄 Using fallback: creating user from session data');
      
      const currentUser = {
        id: session.user.id || 1,
        email: session.user.email || 'unknown@example.com',
        role: session.user.role || 'user',
        is_active: session.user.is_active !== false,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        api_keys_count: 0,
      };

      setUsers([currentUser]);
      setLoading(false);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      
      // Ultimate fallback: show current user if available
      if (user) {
        setUsers([{
          id: user.id || 1,
          email: user.email || 'unknown@example.com',
          role: user.role || 'user',
          is_active: user.is_active !== false,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          api_keys_count: 0,
        }]);
      }
      
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId: number) => {
    try {
      // Get the session token from NextAuth
      const session = await fetch('/api/auth/session').then(res => res.json());
      
      if (!session?.user) {
        throw new Error('No active session found');
      }

      // Try to get user stats from admin API
      const response = await fetch(
        `https://web-production-737b.up.railway.app/api/admin/users/${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.accessToken || session.user.id}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        
        // Transform the stats data to match our interface
        if (userData.stats) {
          setUserStats({
            total_calls: userData.stats.total_calls || 0,
            recent_calls: userData.stats.recent_calls || 0,
            success_calls: userData.stats.success_calls || 0,
            error_calls: userData.stats.error_calls || 0,
            success_rate: userData.stats.success_rate || 0,
            popular_endpoints: userData.stats.popular_endpoints || [],
          });
        } else {
          // If no stats available, show empty stats
          setUserStats({
            total_calls: 0,
            recent_calls: 0,
            success_calls: 0,
            error_calls: 0,
            success_rate: 0,
            popular_endpoints: [],
          });
        }
      } else {
        // If admin API fails, try to get basic user info
        const profileResponse = await fetch(
          'https://web-production-737b.up.railway.app/auth/profile',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.accessToken || session.user.id}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          // Show basic stats from profile data
          setUserStats({
            total_calls: 0,
            recent_calls: 0,
            success_calls: 0,
            error_calls: 0,
            success_rate: 0,
            popular_endpoints: [],
          });
        } else {
          throw new Error(`Failed to fetch user stats: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
      // Show empty stats on error
      setUserStats({
        total_calls: 0,
        recent_calls: 0,
        success_calls: 0,
        error_calls: 0,
        success_rate: 0,
        popular_endpoints: [],
      });
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    fetchUserStats(user.id);
  };

  const handleToggleUserStatus = async (
    userId: number,
    currentStatus: boolean
  ) => {
    try {
      // TODO: Implement API call to update user status
      // For now, show an alert that this feature is not yet implemented
      alert(`User status toggle feature is not yet implemented. User ID: ${userId}, Current status: ${currentStatus}`);
      
      // In real implementation, make API call to update user status
      // setUsers(
      //   users.map((user) =>
      //     user.id === userId ? { ...user, is_active: !currentStatus } : user
      //   )
      // );
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading while checking authentication
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
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

  // Show access denied if not admin
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-4xl font-bold text-white mb-2">Users</h1>
              <p className="text-gray-300 text-lg">
                Manage user accounts and their API access
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-300"
                >
                  Search
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 sm:text-sm bg-gray-700 border-gray-600 text-white rounded-md"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-300"
                >
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-300"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl overflow-hidden">
            <ul className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-white">
                            {user.email}
                          </p>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === "admin" || user.role === "super_admin"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                            }`}
                          >
                            {user.role}
                          </span>
                          <span
                            className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-400">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          Joined {formatDate(user.created_at)}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-400">
                          <Key className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {user.api_keys_count} API key
                          {user.api_keys_count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() =>
                          handleToggleUserStatus(user.id, user.is_active)
                        }
                        className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                          user.is_active
                            ? "border-red-500/50 text-red-300 bg-red-500/10 hover:bg-red-500/20"
                            : "border-green-500/50 text-green-300 bg-green-500/10 hover:bg-green-500/20"
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
        </ul>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowUserDetails(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      User Details: {selectedUser.email}
                    </h3>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* User Info */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          User Information
                        </h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Email
                            </dt>
                            <dd className="text-sm text-gray-900">
                              {selectedUser.email}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Role
                            </dt>
                            <dd className="text-sm text-gray-900 capitalize">
                              {selectedUser.role}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Status
                            </dt>
                            <dd className="text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  selectedUser.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {selectedUser.is_active ? "Active" : "Inactive"}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Created
                            </dt>
                            <dd className="text-sm text-gray-900">
                              {formatDate(selectedUser.created_at)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Last Login
                            </dt>
                            <dd className="text-sm text-gray-900">
                              {formatDate(selectedUser.last_login)}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Usage Stats */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Usage Statistics
                        </h4>
                        {userStats ? (
                          <dl className="space-y-2">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Total API Calls
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {userStats.total_calls.toLocaleString()}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Recent Calls (24h)
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {userStats.recent_calls}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Success Rate
                              </dt>
                              <dd className="text-sm text-gray-900">
                                {userStats.success_rate}%
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">
                                Popular Endpoints
                              </dt>
                              <dd className="text-sm text-gray-900">
                                <ul className="list-disc list-inside">
                                  {userStats.popular_endpoints.map(
                                    (ep, idx) => (
                                      <li key={idx}>
                                        {ep.endpoint} ({ep.count} calls)
                                      </li>
                                    )
                                  )}
                                </ul>
                              </dd>
                            </div>
                          </dl>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Loading stats...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowUserDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
