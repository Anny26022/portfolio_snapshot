import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  
  const { signIn, signUp } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password);
      } else {
        result = await signIn(email, password);
      }
      
      if (!result.success) {
        setError(result.error ? (result.error as any).message || 'Authentication failed' : 'Authentication failed');
      } else if (isSignUp) {
        setSignUpSuccess(true);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setError(null);
    setResetLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(resetEmail);
      setResetMessage('If an account with this email exists, a password reset link has been sent.');
    } catch (err: any) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setResetLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-sm mx-auto bg-white/95 p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-5 text-center text-gray-900">
        {isSignUp ? 'Create an Account' : showReset ? 'Reset Password' : 'Sign In'}
      </h2>
      {signUpSuccess && isSignUp && (
        <div className="mb-3 p-2 bg-green-100 text-green-700 rounded text-xs font-medium w-full text-center">
          A verification email has been sent to your email address. Please check your inbox and verify your account before signing in.
        </div>
      )}
      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-xs font-medium w-full text-center">
          {error}
        </div>
      )}
      {showReset ? (
        <form onSubmit={handleResetPassword} className="space-y-5 w-full">
          <div className="relative">
            <input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              className="peer w-full px-2 pt-5 pb-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-transparent placeholder-transparent text-sm h-10"
              required
              placeholder="Email"
            />
            <label htmlFor="reset-email" className="absolute left-2 top-1.5 text-gray-500 text-xs font-medium transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-gray-500">Email</label>
          </div>
          <button
            type="submit"
            disabled={resetLoading}
            className={`w-full py-2 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-500 to-blue-600 shadow hover:from-blue-600 hover:to-indigo-500 transition-all duration-200 text-sm ${resetLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {resetLoading ? 'Sending...' : 'Send Reset Email'}
          </button>
          {resetMessage && <div className="text-green-600 text-xs text-center mt-1">{resetMessage}</div>}
          <div className="text-center mt-2">
            <button type="button" onClick={() => { setShowReset(false); setResetMessage(null); setError(null); }} className="text-xs text-blue-600 hover:underline font-normal">Back to Sign In</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 w-full">
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full px-2 pt-5 pb-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-transparent placeholder-transparent text-sm h-10"
              required
              placeholder="Email"
              disabled={signUpSuccess && isSignUp}
            />
            <label htmlFor="email" className="absolute left-2 top-1.5 text-gray-500 text-xs font-medium transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-gray-500">Email</label>
          </div>
          <div className="relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full px-2 pt-5 pb-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-transparent placeholder-transparent text-sm h-10"
              required
              minLength={6}
              placeholder="Password"
              disabled={signUpSuccess && isSignUp}
            />
            <label htmlFor="password" className="absolute left-2 top-1.5 text-gray-500 text-xs font-medium transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-gray-500">Password</label>
            <div className="flex justify-end mt-0.5">
              <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setError(null); }} className="text-xs text-blue-500 hover:underline font-normal" disabled={signUpSuccess && isSignUp}>Forgot password?</button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || (signUpSuccess && isSignUp)}
            className={`w-full py-2 rounded-lg text-white font-medium bg-gradient-to-r from-indigo-500 to-blue-600 shadow hover:from-blue-600 hover:to-indigo-500 transition-all duration-200 text-sm ${(loading || (signUpSuccess && isSignUp)) ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
      )}
      {!showReset && (
        <>
          <div className="w-full flex items-center my-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-2 text-gray-400 text-xs font-normal">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSignUpSuccess(false); }}
            className="text-xs text-blue-600 hover:underline font-normal"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await supabase.auth.signInWithOAuth({
                  provider: 'twitter',
                  options: {
                    redirectTo: window.location.origin + '/auth/callback',
                  },
                });
              } catch (err: any) {
                setError('Twitter login failed. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            className="w-full mt-4 py-2 rounded-lg flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-medium shadow transition-all duration-200 text-sm"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0 0 16.616 3c-2.73 0-4.942 2.21-4.942 4.936 0 .386.045.763.127 1.124C7.728 8.84 4.1 6.884 1.671 3.965c-.423.722-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.237-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.213-.005-.425-.014-.636A9.936 9.936 0 0 0 24 4.557z"/></svg>
            Sign in with Twitter
          </button>
        </>
      )}
    </div>
  );
};
