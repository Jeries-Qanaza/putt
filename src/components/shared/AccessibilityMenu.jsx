import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Accessibility, ZoomIn, ZoomOut, Contrast, X, RotateCcw, Highlighter, Volume2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';

const DEFAULTS = { fontSize: 100, contrast: false, highlightLinks: false, readAloud: false };
const LANGUAGE_CODES = { en: 'en-US', he: 'he-IL', ar: 'ar-SA' };

const LABELS = {
  en: {
    title: 'Accessibility',
    textSize: 'Text Size',
    highContrast: 'High Contrast',
    underlineLinks: 'Highlight Links',
    readAloud: 'Read Aloud',
    reset: 'Reset',
  },
  he: {
    title: 'נגישות',
    textSize: 'גודל טקסט',
    highContrast: 'ניגודיות גבוהה',
    underlineLinks: 'הדגשת קישורים',
    readAloud: 'הקראה בקול',
    reset: 'איפוס',
  },
  ar: {
    title: 'إمكانية الوصول',
    textSize: 'حجم النص',
    highContrast: 'تباين عالٍ',
    underlineLinks: 'إبراز الروابط',
    readAloud: 'القراءة بصوت عالٍ',
    reset: 'إعادة تعيين',
  },
};

function getReadableText(target) {
  if (!(target instanceof Element)) return '';

  const readableElement = target.closest(
    'h1, h2, h3, h4, h5, h6, p, span, li, a, button, label, figcaption, blockquote, td, th'
  );

  if (!readableElement) return '';

  const text = (
    readableElement.getAttribute('aria-label') ||
    readableElement.getAttribute('title') ||
    readableElement.textContent ||
    ''
  )
    .replace(/\s+/g, ' ')
    .trim();

  if (!text || text.length < 2) return '';
  if (text.length > 280) return `${text.slice(0, 277)}...`;

  return text;
}

export default function AccessibilityMenu() {
  const { lang, dir } = useI18n();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [overlayContext, setOverlayContext] = useState('');
  const [settings, setSettings] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('putt_a11y') || 'null');
      return stored ? { ...DEFAULTS, ...stored } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  const labels = LABELS[lang] || LABELS.en;
  const isRTL = dir === 'rtl';

  useEffect(() => {
    const syncOverlayContext = () => {
      setOverlayContext(document.body.dataset.overlayContext || '');
    };

    syncOverlayContext();

    const observer = new MutationObserver(syncOverlayContext);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-overlay-context'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    localStorage.setItem('putt_a11y', JSON.stringify(settings));
    document.documentElement.style.fontSize = `${settings.fontSize}%`;
    document.documentElement.setAttribute('data-contrast', settings.contrast ? 'high' : 'normal');
    document.documentElement.setAttribute('data-highlight-links', settings.highlightLinks ? 'true' : 'false');
    document.documentElement.setAttribute('data-read-aloud', settings.readAloud ? 'true' : 'false');
  }, [settings]);

  useEffect(() => {
    if (!settings.readAloud || typeof window === 'undefined' || !window.speechSynthesis) {
      return undefined;
    }

    const handleClick = (event) => {
      const text = getReadableText(event.target);
      if (!text) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANGUAGE_CODES[lang] || LANGUAGE_CODES.en;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((voice) =>
        voice.lang?.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase())
      );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      window.speechSynthesis.speak(utterance);
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.speechSynthesis.cancel();
    };
  }, [lang, settings.readAloud]);

  const shouldHide = isMobile && overlayContext === 'meal-sheet';

  useEffect(() => {
    if (shouldHide) {
      setOpen(false);
    }
  }, [shouldHide]);

  const updateSetting = (key, value) => setSettings((previous) => ({ ...previous, [key]: value }));
  const reset = () => setSettings(DEFAULTS);

  const fabPosition = isRTL ? 'right-4' : 'left-4';
  const panelPosition = isRTL ? 'right-4' : 'left-4';

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={labels.title}
        className={`fixed bottom-6 ${fabPosition} z-[250] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
      >
        <Accessibility className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              key="a11y-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[249]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="a11y-panel"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className={`fixed bottom-24 ${panelPosition} z-[250] w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl`}
              dir={dir}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{labels.title}</span>
                </div>
                <button onClick={() => setOpen(false)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{labels.textSize}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateSetting('fontSize', Math.max(80, settings.fontSize - 10))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="flex-1 text-center text-sm font-semibold">{settings.fontSize}%</span>
                    <button
                      onClick={() => updateSetting('fontSize', Math.min(150, settings.fontSize + 10))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => updateSetting('contrast', !settings.contrast)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${settings.contrast ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}
                >
                  <Contrast className="h-4 w-4" />
                  {labels.highContrast}
                </button>

                <button
                  onClick={() => updateSetting('highlightLinks', !settings.highlightLinks)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${settings.highlightLinks ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}
                >
                  <Highlighter className="h-4 w-4" />
                  {labels.underlineLinks}
                </button>

                <button
                  onClick={() => updateSetting('readAloud', !settings.readAloud)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${settings.readAloud ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}
                >
                  <Volume2 className="h-4 w-4" />
                  {labels.readAloud}
                </button>

                <button
                  onClick={reset}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {labels.reset}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
