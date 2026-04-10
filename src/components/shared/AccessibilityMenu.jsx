import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accessibility, ZoomIn, ZoomOut, Contrast, X, RotateCcw, Underline } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const DEFAULTS = { fontSize: 100, contrast: false, underlineLinks: false };

const LABELS = {
  en: {
    title: 'Accessibility',
    textSize: 'Text Size',
    highContrast: 'High Contrast',
    underlineLinks: 'Underline Links',
    reset: 'Reset',
  },
  he: {
    title: 'נגישות',
    textSize: 'גודל טקסט',
    highContrast: 'ניגודיות גבוהה',
    underlineLinks: 'קו תחתון לקישורים',
    reset: 'איפוס',
  },
  ar: {
    title: 'إمكانية الوصول',
    textSize: 'حجم النص',
    highContrast: 'تباين عالٍ',
    underlineLinks: 'تسطير الروابط',
    reset: 'إعادة تعيين',
  },
};

export default function AccessibilityMenu() {
  const { lang, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('putt_a11y') || 'null') || DEFAULTS; }
    catch { return DEFAULTS; }
  });

  const labels = LABELS[lang] || LABELS.en;
  const isRTL = dir === 'rtl';

  useEffect(() => {
    localStorage.setItem('putt_a11y', JSON.stringify(settings));
    document.documentElement.style.fontSize = `${settings.fontSize}%`;
    document.documentElement.setAttribute('data-contrast', settings.contrast ? 'high' : 'normal');
    document.documentElement.setAttribute('data-underline-links', settings.underlineLinks ? 'true' : 'false');
  }, [settings]);

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));
  const reset = () => setSettings(DEFAULTS);

  // Position: always on the side that is "start" in current dir
  const fabPosition = isRTL ? 'right-4' : 'left-4';
  const panelPosition = isRTL ? 'right-4' : 'left-4';

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={labels.title}
        className={`fixed bottom-6 ${fabPosition} z-[250] h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
      >
        <Accessibility className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="a11y-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[249]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="a11y-panel"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className={`fixed bottom-24 ${panelPosition} z-[250] bg-card border border-border rounded-2xl shadow-2xl w-64 overflow-hidden`}
              dir={dir}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{labels.title}</span>
                </div>
                <button onClick={() => setOpen(false)} className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Font size */}
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">{labels.textSize}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => set('fontSize', Math.max(80, settings.fontSize - 10))}
                      className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">{settings.fontSize}%</span>
                    <button
                      onClick={() => set('fontSize', Math.min(150, settings.fontSize + 10))}
                      className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* High Contrast */}
                <button
                  onClick={() => set('contrast', !settings.contrast)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${settings.contrast ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                >
                  <Contrast className="h-4 w-4" />
                  {labels.highContrast}
                </button>

                {/* Underline links */}
                <button
                  onClick={() => set('underlineLinks', !settings.underlineLinks)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${settings.underlineLinks ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                >
                  <Underline className="h-4 w-4" />
                  {labels.underlineLinks}
                </button>

                {/* Reset */}
                <button
                  onClick={reset}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {labels.reset}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}