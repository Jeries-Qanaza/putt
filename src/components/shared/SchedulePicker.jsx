import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_LABELS = {
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
};

const DEFAULT_SCHEDULE = DAYS.reduce((acc, d) => {
  acc[d] = { open: '08:00', close: '22:00', closed: false };
  return acc;
}, {});

export function getInitialSchedule(value) {
  if (value && typeof value === 'object' && Object.keys(value).length > 0) return value;
  return DEFAULT_SCHEDULE;
}

export default function SchedulePicker({ value, onChange }) {
  const schedule = getInitialSchedule(value);

  const update = (day, field, val) => {
    onChange({ ...schedule, [day]: { ...schedule[day], [field]: val } });
  };

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const row = schedule[day] || { open: '08:00', close: '22:00', closed: false };
        return (
          <div key={day} className="flex items-center gap-3">
            <div className="w-24 shrink-0">
              <Label className="text-sm font-medium">{DAY_LABELS[day]}</Label>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="time"
                value={row.open || ''}
                disabled={row.closed}
                onChange={(e) => update(day, 'open', e.target.value)}
                className="w-32 text-sm h-8"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="time"
                value={row.close || ''}
                disabled={row.closed}
                onChange={(e) => update(day, 'close', e.target.value)}
                className="w-32 text-sm h-8"
              />
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer ml-2">
                <Checkbox
                  checked={!!row.closed}
                  onCheckedChange={(v) => update(day, 'closed', v)}
                />
                Closed
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}