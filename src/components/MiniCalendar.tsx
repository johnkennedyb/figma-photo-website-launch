import React from 'react';

interface Props {
  date: Date;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MiniCalendar: React.FC<Props> = ({ date }) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const selectedDay = date.getDate();

  // first day of the month (0=Sun..6=Sat)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let currentDay = 1 - firstDayOfMonth; // may be negative -> leading blanks

  while (currentDay <= daysInMonth) {
    const week: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (currentDay < 1 || currentDay > daysInMonth) {
        week.push(null);
      } else {
        week.push(currentDay);
      }
      currentDay++;
    }
    weeks.push(week);
  }

  return (
    <div className="inline-block bg-white rounded-lg p-4 shadow-sm">
      <div className="text-center mb-2 font-medium">
        {date.toLocaleString('default', { month: 'long' })} {year}
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-600 mb-1">
        {dayNames.map(d => (
          <div key={d} className="text-center font-semibold">
            {d[0]}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {weeks.flat().map((day, idx) => (
          <div
            key={idx}
            className={`h-6 w-6 flex items-center justify-center rounded-full ${day === selectedDay ? 'bg-teal-600 text-white' : 'text-gray-700'}`}
          >
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniCalendar;
