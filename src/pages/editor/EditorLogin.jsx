import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, UtensilsCrossed } from 'lucide-react';

export default function EditorLogin({ restaurant, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (
        username === restaurant.editor_username &&
        password === restaurant.editor_password
      ) {
        sessionStorage.setItem(`editor_auth_${restaurant.id}`, 'true');
        onSuccess();
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <Card className="w-full max-w-sm border-0 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
