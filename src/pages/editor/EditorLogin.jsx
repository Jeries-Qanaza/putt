import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, UtensilsCrossed } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n';

const LOCKOUT_MS = 2 * 60 * 60 * 1000;

function readLockUntil(storageKey) {
  const value = Number(localStorage.getItem(storageKey) || '0');
  if (!value) return 0;
  if (Date.now() >= value) {
    localStorage.removeItem(storageKey);
    return 0;
  }
  return value;
}

export default function EditorLogin({ restaurant, onSuccess }) {
  const { t } = useI18n();
  const attemptStorageKey = `editor_attempts_${restaurant.id}`;
  const lockedStorageKey = `editor_locked_until_${restaurant.id}`;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(() => readLockUntil(lockedStorageKey));
  const [error, setError] = useState(() =>
    readLockUntil(lockedStorageKey) ? t('supportLockMessage') : ''
  );
  const [loading, setLoading] = useState(false);

  const isLocked = lockedUntil > Date.now();
  const expectedEditorId = restaurant.editor_id || '';

  useEffect(() => {
    if (!isLocked) return undefined;
    const timer = window.setInterval(() => {
      const nextLockedUntil = readLockUntil(lockedStorageKey);
      setLockedUntil(nextLockedUntil);
      if (!nextLockedUntil) {
        localStorage.removeItem(attemptStorageKey);
        setError('');
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attemptStorageKey, isLocked, lockedStorageKey]);

  const remainingLabel = useMemo(() => {
    if (!isLocked) return '';
    const remainingMs = Math.max(0, lockedUntil - Date.now());
    const totalMinutes = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [isLocked, lockedUntil]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isLocked) {
      setError(t('supportLockMessage'));
      return;
    }

    setLoading(true);
    setError('');

    window.setTimeout(async () => {
      const normalizedEmail = email.trim().toLowerCase();
      let isValid = false;

      if (isSupabaseConfigured && expectedEditorId) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        isValid =
          !signInError &&
          !!data.session &&
          (data.user?.id || '') === expectedEditorId;

        if (!isValid && data.session) {
          await supabase.auth.signOut();
        }
      } else {
        const normalizedStoredEmail = (restaurant.editor_email || restaurant.editor_username || '').trim().toLowerCase();
        isValid = normalizedEmail === normalizedStoredEmail && password === restaurant.editor_password;
      }

      if (isValid) {
        localStorage.removeItem(attemptStorageKey);
        localStorage.removeItem(lockedStorageKey);
        setLockedUntil(0);
        sessionStorage.setItem(`editor_auth_${restaurant.id}`, 'true');
        onSuccess();
      } else {
        const nextAttempts = Number(localStorage.getItem(attemptStorageKey) || '0') + 1;
        localStorage.setItem(attemptStorageKey, String(nextAttempts));

        if (nextAttempts >= 4) {
          const nextLockedUntil = Date.now() + LOCKOUT_MS;
          localStorage.setItem(lockedStorageKey, String(nextLockedUntil));
          setLockedUntil(nextLockedUntil);
          setError(t('supportLockMessage'));
        } else {
          setError(`${t('invalidEmailOrPassword')} ${4 - nextAttempts} ${t('attemptsLeft')}.`);
        }
      }

      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <Card className="w-full max-w-sm border-0 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          <CardTitle className="text-xl">{restaurant.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('editorAccess')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editor-email">Email</Label>
              <Input
                id="editor-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                type="email"
                maxLength={120}
                required
              />
            </div>
            <div>
              <Label htmlFor="editor-pass">Password</Label>
              <div className="relative">
                <Input
                  id="editor-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="pe-10"
                  maxLength={50}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading || isLocked}>
              {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {isLocked ? `${t('locked')} ${remainingLabel ? `(${remainingLabel})` : ''}` : t('signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
