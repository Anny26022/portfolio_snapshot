import React, { useEffect, useState } from 'react';

interface Holiday {
  holidayDate: string;
  purpose: string;
}

const NSEHolidayBanner: React.FC<{ holidays: Holiday[] }> = ({ holidays }) => {
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const currentYear = today.getFullYear();

    const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

    for (const holiday of holidays) {
      const hDate = new Date(holiday.holidayDate);
      if (hDate.getFullYear() !== currentYear) continue; // Only current year
      if (isWeekend(hDate)) continue; // skip weekends

      // Today is a holiday
      if (
        hDate.getFullYear() === today.getFullYear() &&
        hDate.getMonth() === today.getMonth() &&
        hDate.getDate() === today.getDate()
      ) {
        setBanner(`Market Holiday Today: ${holiday.purpose} (${holiday.holidayDate})`);
        return;
      }

      // Tomorrow is a holiday
      if (
        hDate.getFullYear() === tomorrow.getFullYear() &&
        hDate.getMonth() === tomorrow.getMonth() &&
        hDate.getDate() === tomorrow.getDate()
      ) {
        setBanner(`Market Holiday Tomorrow: ${holiday.purpose} (${holiday.holidayDate})`);
        return;
      }
    }
    setBanner(null);
  }, [holidays]);

  if (!banner) return null;
  return (
    <div className="w-full bg-yellow-200 text-yellow-900 text-center py-2 font-semibold shadow">
      {banner}
    </div>
  );
};

export default NSEHolidayBanner; 