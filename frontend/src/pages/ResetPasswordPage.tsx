import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid Reset Link</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The password reset link is missing required information. Please request a new one.
            </p>
            <Link to="/forgot-password" className="text-primary font-medium hover:underline">
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        email,
        newPassword: password,
      });
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 text-5xl">🧭</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Compass</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Your Financial Navigation System</p>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">Set New Password</h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : null}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
