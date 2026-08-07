'use client';

import { Calendar, Filter } from 'lucide-react';
import { subDays, format } from 'date-fns';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
  onDateChange: (start: string, end: string) => void;
  onGroupByChange: (group: 'day' | 'week' | 'month') => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  groupBy,
  onDateChange,
  onGroupByChange,
}: DateRangePickerProps) {
  const handlePreset = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    onDateChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-xl border shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Calendar className="h-4 w-4 text-primary" />
        <span>Period:</span>
      </div>

      <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => handlePreset(7)}
          className="px-3 py-1 text-xs font-medium rounded-md hover:bg-background transition-all"
        >
          Last 7d
        </button>
        <button
          type="button"
          onClick={() => handlePreset(30)}
          className="px-3 py-1 text-xs font-medium rounded-md bg-background shadow-xs transition-all"
        >
          Last 30d
        </button>
        <button
          type="button"
          onClick={() => handlePreset(90)}
          className="px-3 py-1 text-xs font-medium rounded-md hover:bg-background transition-all"
        >
          Last 90d
        </button>
        <button
          type="button"
          onClick={() => handlePreset(365)}
          className="px-3 py-1 text-xs font-medium rounded-md hover:bg-background transition-all"
        >
          1 Year
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm ml-auto">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="border rounded-md px-2 py-1 text-xs bg-background focus:ring-1 focus:ring-primary outline-hidden"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="border rounded-md px-2 py-1 text-xs bg-background focus:ring-1 focus:ring-primary outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 ml-2 border-l pl-3">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as any)}
            className="border rounded-md px-2 py-1 text-xs bg-background focus:ring-1 focus:ring-primary outline-hidden"
          >
            <option value="day">By Day</option>
            <option value="week">By Week</option>
            <option value="month">By Month</option>
          </select>
        </div>
      </div>
    </div>
  );
}
