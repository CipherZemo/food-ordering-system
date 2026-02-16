import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const TimeTracker = ({ startTime, label = 'Time' }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = Math.floor((now - start) / 1000); // seconds
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    const minutes = elapsed / 60;
    if (minutes < 15) return 'text-green-600 bg-green-50';
    if (minutes < 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50 animate-pulse';
  };

  const minutes = Math.floor(elapsed / 60);

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getColorClass()}`}>
      <Clock size={14} />
      <span>
        {label}: {minutes} min
      </span>
    </div>
  );
};

export default TimeTracker;