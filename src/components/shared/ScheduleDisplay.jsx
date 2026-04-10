import React from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS = {
  Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday',
};

export default function ScheduleDisplay({ schedule }) {
  if (!schedule || typeof schedule !== 'object' || Object.keys(schedule).length === 0) return null;

  return (
    <div className="space-y-1">
      {DAYS.map((day) => {
        const row = schedule[day];
        if (!row) return null;
        return (
          <div key={day} className="flex items-center gap-2 text-sm">
            <span className="w-24 font-medium text-foreground">{DAY_LABELS[day]}</span>
            {row.closed ? (
              <span className="text-muted-foreground">Closed</span>
            ) : (
              <span className="text-muted-foreground">{row.open || '00:00'} – {row.close || '00:00'}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}