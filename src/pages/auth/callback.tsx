import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = typeof useNavigate === 'function' ? useNavigate() : null;

  useEffect(() => {
    const handleAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          if (navigate) {
            navigate('/');
          } else {
            window.location.replace('/');
          }
        } else {
          if (navigate) {
            navigate('/auth/auth-code-error');
          } else {
            window.location.replace('/auth/auth-code-error');
          }
        }
      }
    };
    handleAuth();
  }, [navigate]);

  return <div>Signing you in...</div>;
} 