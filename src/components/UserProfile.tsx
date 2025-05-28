import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const MinimalUserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 8-4 8-4s8 0 8 4"/></svg>
);

export const UserProfile: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const [editEmail, setEditEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-400"></div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  const typedUser = user as User;
  
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);
    setEmailError(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMessage('A confirmation email has been sent to your new address. Please verify to complete the change.');
      setEditEmail(false);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to update email.');
    }
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    setResetMessage(null);
    setResetError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(typedUser.email!);
      if (error) throw error;
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md mx-auto flex flex-col items-center">
      <MinimalUserIcon className="mb-4" />
      <div className="w-full flex flex-col items-center mb-6">
        <span className="text-xs text-gray-400 tracking-wide uppercase mb-1">Signed in as</span>
        {!editEmail ? (
          <span className="text-lg font-semibold text-gray-900 break-all text-center flex items-center gap-2">
            {typedUser.email}
            <button onClick={() => { setEditEmail(true); setNewEmail(typedUser.email!); setEmailMessage(null); setEmailError(null); }} className="ml-2 text-xs text-blue-600 hover:underline font-normal">Change</button>
          </span>
        ) : (
          <form onSubmit={handleEmailChange} className="flex flex-col items-center gap-2 w-full mt-2">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
            <div className="flex gap-2 w-full">
              <button type="submit" className="px-3 py-1 rounded bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition">Save</button>
              <button type="button" onClick={() => setEditEmail(false)} className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition">Cancel</button>
            </div>
          </form>
        )}
        {emailMessage && <div className="mt-2 text-green-600 text-xs text-center">{emailMessage}</div>}
        {emailError && <div className="mt-2 text-red-600 text-xs text-center">{emailError}</div>}
      </div>
      <div className="w-full flex flex-col gap-3 text-sm text-gray-600">
        {/* User ID hidden for minimal look */}
        {/*
        <div className="flex justify-between w-full border-b border-gray-100 pb-2">
          <span className="font-medium text-gray-400">User ID</span>
          <span className="font-mono text-xs text-gray-500 text-right">{typedUser.id}</span>
        </div>
        */}
        <div className="flex justify-between w-full border-b border-gray-100 pb-2">
          <span className="font-medium text-gray-400">Email Verified</span>
          <span className="text-gray-700">{typedUser.email_confirmed_at ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex justify-between w-full">
          <span className="font-medium text-gray-400">Last Sign In</span>
          <span className="text-gray-700">{typedUser.last_sign_in_at ? new Date(typedUser.last_sign_in_at).toLocaleString() : 'Never'}</span>
        </div>
      </div>
      <div className="w-full flex flex-col items-center mt-6 gap-2">
        <button
          onClick={handlePasswordReset}
          disabled={resetLoading}
          className="w-full px-4 py-2 rounded bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition text-sm"
        >
          {resetLoading ? 'Sending reset email...' : 'Reset Password'}
        </button>
        {resetMessage && <div className="text-green-600 text-xs text-center mt-1">{resetMessage}</div>}
        {resetError && <div className="text-red-600 text-xs text-center mt-1">{resetError}</div>}
      </div>
      <button
        onClick={async () => {
          setSignOutError(null);
          const result = await signOut();
          if (result.success) {
            window.location.reload();
          } else {
            setSignOutError('Sign out failed. Please try again.');
          }
        }}
        className="mt-8 px-5 py-2 rounded-full bg-gray-100 text-gray-700 font-medium shadow hover:bg-gray-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        Sign Out
      </button>
      {signOutError && <div className="text-red-600 text-xs text-center mt-2">{signOutError}</div>}
    </div>
  );
};
