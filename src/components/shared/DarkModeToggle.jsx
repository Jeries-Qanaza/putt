import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('putt_theme') === 'dark' ||
      (!localStorage.getItem('putt_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('putt_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('putt_theme', 'light');
    }
  }, [dark]);

  return (
    <Button variant="ghost" size="icon" className="h-11 w-11 md:h-9 md:w-9" onClick={() => setDark((d) => !d)}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}