import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, UtensilsCrossed } from 'lucide-react';

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
  const attemptStorageKey = `editor_attempts_${restaurant.id}`;
  const lockedStorageKey = `editor_locked_until_${restaurant.id}`;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(() => readLockUntil(lockedStorageKey));
  const [error, setError] = useState(() =>
    readLockUntil(lockedStorageKey) ? '⚠️ This device is blocked for 2 hours. Contact Putt support.' : ''
  );
  const [loading, setLoading] = useState(false);

  const isLocked = lockedUntil > Date.now();

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
  }, [isLocked, lockedStorageKey, attemptStorageKey]);

  const remainingLabel = useMemo(() => {
    if (!isLocked) return '';
    const remainingMs = Math.max(0, lockedUntil - Date.now());
    const totalMinutes = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [isLocked, lockedUntil]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLocked) {
      setError('⚠️ This device is blocked for 2 hours. Contact Putt support.');
      return;
    }

    setLoading(true);
    setError('');

    window.setTimeout(() => {
      if (username === restaurant.editor_username && password === restaurant.editor_password) {
        localStorage.removeItem(attemptStorageKey);
        localStorage.removeItem(lockedStorageKey);
        setLockedUntil(0);
        sessionStorage.setItem(`editor_auth_${restaurant.id}`, 'true');
        onSuccess();
      } else {
        const nextAttempts = Number(localStorage.getItem(attemptStorageKey) || '0') + 1;
        localStorage.setItem(attemptStorageKey, String(nextAttempts));

        if (nextAttempts === 4) {
          const nextLockedUntil = Date.now() + LOCKOUT_MS;
          localStorage.setItem(lockedStorageKey, String(nextLockedUntil));
          setLockedUntil(nextLockedUntil);
          setError('⚠️ This device is blocked for 2 hours. Contact Putt support.');
        } else {
          setError(`Invalid username or password. ${4 - nextAttempts} attempts left.`);
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
          <p className="text-sm text-muted-foreground">Editor Access</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editor-user">Username</Label>
              <Input
                id="editor-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                maxLength={50}
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
                  onChange={(e) => setPassword(e.target.value)}
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
              {isLocked ? `Locked ${remainingLabel ? `(${remainingLabel})` : ''}` : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
