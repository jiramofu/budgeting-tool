import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface Household {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
}

interface HouseholdMember {
  id: number;
  household_id: number;
  user_id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'editor' | 'viewer';
  joined_at: string;
}

interface HouseholdInvitation {
  id: number;
  household_id: number;
  invited_email: string;
  role: 'admin' | 'editor' | 'viewer';
  token: string;
  is_accepted: boolean;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export const HouseholdPage = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<HouseholdInvitation[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<number | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({ name: '', description: '' });
  const [inviteFormData, setInviteFormData] = useState({ email: '', role: 'viewer' as const });
  const [error, setError] = useState('');

  useEffect(() => {
    loadHouseholds();
  }, []);

  useEffect(() => {
    if (selectedHousehold) {
      loadHouseholdDetails();
    }
  }, [selectedHousehold]);

  const loadHouseholds = async () => {
    try {
      setLoading(true);
      const householdsRes = await apiClient.getHouseholds();
      setHouseholds(householdsRes.data);

      const pendingRes = await apiClient.getPendingInvitations();
      setPendingInvitations(pendingRes.data);

      setError('');
    } catch (err) {
      setError('Failed to load households');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHouseholdDetails = async () => {
    if (!selectedHousehold) return;

    try {
      const membersRes = await apiClient.getHouseholdMembers(selectedHousehold);
      setMembers(membersRes.data);

      const invitationsRes = await apiClient.getHouseholdInvitations(selectedHousehold);
      setInvitations(invitationsRes.data);
    } catch (err) {
      setError('Failed to load household details');
      console.error(err);
    }
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.createHousehold(createFormData.name, createFormData.description);
      const newHousehold = res.data;
      setHouseholds([...households, newHousehold]);
      setCreateFormData({ name: '', description: '' });
      setShowCreateForm(false);
      setSelectedHousehold(newHousehold.id);
      setError('');
    } catch (err) {
      setError('Failed to create household');
      console.error(err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHousehold) return;

    try {
      const res = await apiClient.inviteMember(selectedHousehold, inviteFormData.email, inviteFormData.role);
      const invitation = res.data;
      setInvitations([...invitations, invitation]);
      setInviteFormData({ email: '', role: 'viewer' });
      setShowInviteForm(false);
      setError('');
    } catch (err) {
      setError('Failed to send invitation');
      console.error(err);
    }
  };

  const handleAcceptInvitation = async (token: string) => {
    try {
      await apiClient.acceptInvitation(token);
      await loadHouseholds();
      setSelectedHousehold(null);
      setError('');
    } catch (err) {
      setError('Failed to accept invitation');
      console.error(err);
    }
  };

  const handleUpdateMemberRole = async (memberId: number, newRole: string) => {
    if (!selectedHousehold) return;

    try {
      const res = await apiClient.updateMemberRole(selectedHousehold, memberId, newRole as 'admin' | 'editor' | 'viewer');
      const updatedMember = res.data;
      setMembers(members.map(m => m.id === memberId ? updatedMember : m));
      setError('');
    } catch (err) {
      setError('Failed to update member role');
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedHousehold) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await apiClient.removeMember(selectedHousehold, memberId);
      setMembers(members.filter(m => m.id !== memberId));
      setError('');
    } catch (err) {
      setError('Failed to remove member');
      console.error(err);
    }
  };

  const handleDeleteHousehold = async (householdId: number) => {
    if (!confirm('Are you sure you want to delete this household? This cannot be undone.')) return;

    try {
      await apiClient.deleteHousehold(householdId);
      setHouseholds(households.filter(h => h.id !== householdId));
      if (selectedHousehold === householdId) {
        setSelectedHousehold(null);
        setMembers([]);
        setInvitations([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to delete household');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-700 dark:text-gray-300">Loading households...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Household & Sharing</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Pending Invitations</h2>
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Join household from {invitation.household_id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Role: {invitation.role}</p>
                </div>
                <button
                  onClick={() => handleAcceptInvitation(invitation.token)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Households List */}
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Households</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + New
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateHousehold} className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
              <input
                type="text"
                placeholder="Household name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-3 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {households.length === 0 ? (
              <p className="p-4 text-gray-500 dark:text-gray-400 text-center">No households yet. Create one to get started!</p>
            ) : (
              households.map((household) => (
                <button
                  key={household.id}
                  onClick={() => setSelectedHousehold(household.id)}
                  className={`w-full text-left p-4 rounded border transition ${
                    selectedHousehold === household.id
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-600 text-gray-900 dark:text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="font-semibold">{household.name}</p>
                  {household.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{household.description}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Household Details */}
        {selectedHousehold && (
          <div className="lg:col-span-2 space-y-6">
            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Members</h3>
                <button
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Invite
                </button>
              </div>

              {showInviteForm && (
                <form onSubmit={handleInviteMember} className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <select
                    value={inviteFormData.role}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-3 bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="viewer">Viewer (read-only)</option>
                    <option value="editor">Editor (can modify)</option>
                    <option value="admin">Admin (full control)</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Send Invite
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteForm(false)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="p-4 border border-gray-300 dark:border-gray-600 rounded flex items-center justify-between bg-white dark:bg-gray-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{member.email}</p>
                      {member.firstName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.firstName} {member.lastName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invitations for this Household */}
            {invitations.filter(i => !i.is_accepted).length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Pending Invitations</h3>
                <div className="space-y-3">
                  {invitations
                    .filter((i) => !i.is_accepted)
                    .map((invitation) => (
                      <div key={invitation.id} className="p-4 border border-yellow-300 dark:border-yellow-700 rounded bg-yellow-50 dark:bg-yellow-900">
                        <p className="font-medium text-gray-900 dark:text-white">{invitation.invited_email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Role: {invitation.role}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Delete Household */}
            <div className="pt-6 border-t border-gray-300 dark:border-gray-700">
              <button
                onClick={() => handleDeleteHousehold(selectedHousehold)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Household
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
