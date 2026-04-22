import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Bell, X } from 'lucide-react';
import { localApi } from '@/lib/localApi';
import { useI18n } from '@/lib/i18n';

const TYPE_COLORS = {
  happy_hour: 'bg-amber-100 text-amber-800',
  coupon: 'bg-green-100 text-green-800',
  announcement: 'bg-blue-100 text-blue-800',
  event: 'bg-purple-100 text-purple-800',
};

function NewsModal({ open, onClose, items, hasItems, getLocalizedField, t }) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key="news-modal"
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 24 }}
          transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">{t('news')}</span>
              {hasItems ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {items.length}
                </span>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70dvh] overflow-y-auto p-4">
            {!hasItems ? (
              <div className="py-10 text-center text-muted-foreground">
                <p className="text-sm">{t('nothingNewToday')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const title = getLocalizedField(item, 'title');
                  const body = getLocalizedField(item, 'body');
                  const typeColor = TYPE_COLORS[item.type] || TYPE_COLORS.announcement;

                  return (
                    <div key={item.id} className="space-y-3">
                      {item.image_url ? (
                        <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {item.emoji ? <span>{item.emoji}</span> : null}
                          <h3 className="text-base font-semibold">{title}</h3>
                        </div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${typeColor}`}>{item.type}</span>
                        {item.date ? <p className="text-xs font-medium text-primary">{item.date}{item.time ? ` ${item.time}` : ''}</p> : null}
                        {body ? <p className="text-sm text-muted-foreground">{body}</p> : null}
                      </div>
                      {index < items.length - 1 ? <div className="h-px bg-border" /> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default function NewsPanel() {
  const { getLocalizedField, t } = useI18n();
  const [open, setOpen] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: allNews = [] } = useQuery({
    queryKey: ['customer-news'],
    queryFn: () => localApi.entities.News.filter({ is_active: true }, '-created_date'),
  });

  const items = allNews.filter((item) => {
    if (!item.is_active) return false;
    if (item.expires_at && item.expires_at < today) return false;
    return true;
  });

  const hasItems = items.length > 0;

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-accent md:h-9 md:w-9"
        aria-label="News & Events"
      >
        <Bell className="h-4 w-4" />
        {hasItems ? <span className="absolute top-1.5 right-1.5 h-2 w-2 animate-pulse rounded-full bg-primary" /> : null}
      </button>

      <NewsModal
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        hasItems={hasItems}
        getLocalizedField={getLocalizedField}
        t={t}
      />
    </>
  );
}
