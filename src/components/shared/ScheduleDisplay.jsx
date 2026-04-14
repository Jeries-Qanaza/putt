import React from 'react';
import { useI18n } from '@/lib/i18n';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_LABEL_KEYS = {
  Sun: 'sunday',
  Mon: 'monday',
  Tue: 'tuesday',
  Wed: 'wednesday',
  Thu: 'thursday',
  Fri: 'friday',
  Sat: 'saturday',
};

export default function ScheduleDisplay({ schedule }) {
  const { t } = useI18n();

  if (!schedule || typeof schedule !== 'object' || Object.keys(schedule).length === 0) return null;

  return (
    <div className="space-y-1">
      {DAYS.map((day) => {
        const row = schedule[day];
        if (!row) return null;

        return (
          <div key={day} className="flex items-center gap-2 text-sm">
            <span className="w-24 font-medium text-foreground">{t(DAY_LABEL_KEYS[day])}</span>
            {row.closed ? (
              <span className="text-muted-foreground">{t('closed')}</span>
            ) : (
              <span className="text-muted-foreground">{row.open || '00:00'} - {row.close || '00:00'}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
