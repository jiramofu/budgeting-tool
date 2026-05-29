import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

interface Member {
  userId: number;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'user' | 'viewer';
  joinedAt: string;
  activity?: {
    requestCount: number;
    successCount: number;
    errorCount: number;
    lastActive: string | null;
    avgResponseTime: number;
  };
}

interface MembersData {
  period: {
    days: number;
    startDate: string;
  };
  members: Member[];
}

export const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const [membersData, setMembersData] = useState<MembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'user' | 'viewer'>('user');

  useEffect(() => {
    loadMembers();
  }, [selectedDays]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/dashboard/members-activity?days=${selectedDays}`);
      setMembersData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load members');
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      // This would call an invite endpoint
      // await api.post('/organizations/members/invite', { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      setShowInviteForm(false);
      // Reload members after invite
      await loadMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite member');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'admin':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'manager':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'user':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Members</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage organization members and permissions</p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showInviteForm ? 'Cancel' : 'Invite Member'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="member@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer (read-only)</option>
                  <option value="user">User (standard access)</option>
                  <option value="manager">Manager (create/edit)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Send Invite
              </button>
            </form>
          </div>
        )}

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedDays === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>

        {/* Members List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {membersData?.members.length || 0} Members
            </h2>
          </div>

          {membersData && membersData.members.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {membersData.members.map((member) => (
                <div key={member.userId} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(member.role)}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>

                      {member.activity && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.activity.requestCount} requests
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.activity.lastActive
                              ? `Last active: ${new Date(member.activity.lastActive).toLocaleDateString()}`
                              : 'Not active'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No members found
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/admin/organization')}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400"
          >
            Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
