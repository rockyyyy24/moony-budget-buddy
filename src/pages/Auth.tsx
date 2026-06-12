import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import moonyImg from '@/assets/moony.png';

const Auth = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate('/', { replace: true });
  }, [session, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("📬 Check your email for a reset link!");
        setMode('signin');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success("Welcome to Mooney! ✨");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Hey bestie! 🌟");
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background sparkle-bg p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <img src={moonyImg} alt="Mooney" className="w-20 h-20 rounded-full border-2 border-secondary" />
            <div className="text-center">
              <h1 className="text-2xl font-display">Mooney</h1>
              <p className="text-sm text-muted-foreground">
                {mode === 'signin' ? 'Welcome back, bestie! 🦆' : mode === 'signup' ? 'Join the Mooney fam! ✨' : 'Reset your password 🔑'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'signin' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            )}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0" disabled={busy}>
              {busy ? '...' : (mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send reset link')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'forgot' ? (
              <button onClick={() => setMode('signin')} className="text-primary font-semibold hover:underline">← Back to sign in</button>
            ) : mode === 'signin' ? (
              <>New here? <button onClick={() => setMode('signup')} className="text-primary font-semibold hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode('signin')} className="text-primary font-semibold hover:underline">Sign in</button></>
            )}
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;