import React, { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { apiClient } from '../services/api';

interface BankConnection {
  id: number;
  institution_name: string;
  account_mask: string;
  last_sync_at: string;
  created_at: string;
}

interface BankConnectionsProps {
  onTransactionsImported?: () => void;
}

export default function BankConnections({ onTransactionsImported }: BankConnectionsProps) {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [linkToken, setLinkToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadConnections();
    createLinkToken();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/plaid/connections');
      setConnections(response.data);
    } catch (err: any) {
      console.error('Error loading connections:', err);
      setError('Failed to load bank connections');
    } finally {
      setLoading(false);
    }
  };

  const createLinkToken = async () => {
    try {
      const response = await apiClient.post('/plaid/link-token', {});
      setLinkToken(response.data.linkToken);
    } catch (err: any) {
      console.error('Error creating link token:', err);
      setError('Failed to initialize bank linking');
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        // Exchange public token for access token
        await apiClient.post('/plaid/exchange-token', { publicToken });
        // Reload connections
        await loadConnections();
        onTransactionsImported?.();
      } catch (err: any) {
        console.error('Error linking account:', err);
        setError('Failed to link bank account');
      }
    },
    onExit: (err) => {
      if (err?.error_code) {
        console.error('Plaid error:', err.error_code);
      }
    },
  });

  const handleSync = async (connectionId: number) => {
    try {
      setSyncing(connectionId);
      await apiClient.post(`/plaid/sync/${connectionId}`, {});
      // Reload connections to update last_sync_at
      await loadConnections();
      onTransactionsImported?.();
    } catch (err: any) {
      console.error('Error syncing:', err);
      setError('Failed to sync transactions');
    } finally {
      setSyncing(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to remove this bank connection?')) {
      return;
    }

    try {
      await apiClient.delete(`/plaid/connections/${itemId}`);
      await loadConnections();
    } catch (err: any) {
      console.error('Error removing connection:', err);
      setError('Failed to remove connection');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Bank Accounts</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading connections...</p>
      ) : connections.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No bank accounts connected yet</p>
          <button
            onClick={() => open()}
            disabled={!ready}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Connect Bank Account
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{conn.institution_name}</p>
                  <p className="text-sm text-gray-500">Ending in {conn.account_mask}</p>
                  {conn.last_sync_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last synced: {new Date(conn.last_sync_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSync(conn.id)}
                    disabled={syncing === conn.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium py-1 px-3 rounded transition"
                  >
                    {syncing === conn.id ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    onClick={() => handleRemove(conn.id.toString())}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1 px-3 rounded transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => open()}
            disabled={!ready}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Add Another Account
          </button>
        </>
      )}
    </div>
  );
}
