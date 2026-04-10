import React, { useState } from 'react';
import { localApi } from '@/lib/localApi';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const TYPE_COLORS = {
  happy_hour: 'bg-amber-100 text-amber-800',
  coupon: 'bg-green-100 text-green-800',
  announcement: 'bg-blue-100 text-blue-800',
  event: 'bg-purple-100 text-purple-800',
};

export default function NewsPanel() {
  const { getLocalizedField, t } = useI18n();
  const [open, setOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: allNews = [] } = useQuery({
    queryKey: ['customer-news'],
    queryFn: () => localApi.entities.News.filter({ is_active: true }, '-created_date'),
  });

  // Show events happening today + all active non-expired announcements/offers
  const items = allNews.filter(item => {
    if (!item.is_active) return false;
    if (item.expires_at && item.expires_at < today) return false;
    return true;
  });

  const hasItems = items.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-md hover:bg-accent transition-colors"
        aria-label="News & Events"
      >
        <Bell className="h-4 w-4" />
        {hasItems && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="news-modal"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="relative z-10 w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">{t('news')}</span>
                  {hasItems && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">
                      {items.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {!hasItems ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <span className="text-4xl block mb-3">🎉</span>
                    <p className="text-sm">Nothing new today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, idx) => {
                      const title = getLocalizedField(item, 'title');
                      const body = getLocalizedField(item, 'body');
                      const typeColor = TYPE_COLORS[item.type] || TYPE_COLORS.announcement;
                      return (
                        <div key={item.id} className="space-y-3">
                          {item.image_url && (
                            <div className="rounded-xl overflow-hidden aspect-video bg-muted">
                              <img src={item.image_url} alt={title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {item.emoji && <span>{item.emoji}</span>}
                              <h3 className="font-semibold text-base">{title}</h3>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${typeColor}`}>{item.type}</span>
                            {item.date && <p className="text-xs text-primary font-medium">📅 {item.date} {item.time && `🕐 ${item.time}`}</p>}
                            {body && <p className="text-sm text-muted-foreground">{body}</p>}
                          </div>
                          {idx < items.length - 1 && <div className="h-px bg-border" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
