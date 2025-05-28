import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Handles both code and hash fragment (access_token) in the URL
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (!error) {
        navigate('/', { replace: true });
      } else {
        navigate('/auth/auth-code-error', { replace: true });
      }
    };
    handleAuth();
  }, [navigate]);

  return <div>Signing you in...</div>;
} 