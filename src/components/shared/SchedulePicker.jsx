import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

const DEFAULT_SCHEDULE = DAYS.reduce((acc, day) => {
  acc[day] = { open: '08:00', close: '22:00', closed: false };
  return acc;
}, {});

export function getInitialSchedule(value) {
  if (value && typeof value === 'object' && Object.keys(value).length > 0) return value;
  return DEFAULT_SCHEDULE;
}

export default function SchedulePicker({ value, onChange }) {
  const { t } = useI18n();
  const schedule = getInitialSchedule(value);

  const update = (day, field, nextValue) => {
    onChange({ ...schedule, [day]: { ...schedule[day], [field]: nextValue } });
  };

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const row = schedule[day] || { open: '08:00', close: '22:00', closed: false };

        return (
          <div key={day} className="flex items-center gap-3">
            <div className="w-24 shrink-0">
              <Label className="text-sm font-medium">{t(DAY_LABEL_KEYS[day])}</Label>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="time"
                value={row.open || ''}
                disabled={row.closed}
                onChange={(event) => update(day, 'open', event.target.value)}
                className="h-8 w-32 text-sm"
              />
              <span className="text-sm text-muted-foreground">-</span>
              <Input
                type="time"
                value={row.close || ''}
                disabled={row.closed}
                onChange={(event) => update(day, 'close', event.target.value)}
                className="h-8 w-32 text-sm"
              />
              <label className="ml-2 flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
                <Checkbox
                  checked={!!row.closed}
                  onCheckedChange={(checked) => update(day, 'closed', checked)}
                />
                {t('closed')}
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
