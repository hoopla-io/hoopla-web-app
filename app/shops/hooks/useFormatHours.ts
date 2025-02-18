interface WorkingHours {
  weekDay: string;
  openAt: string;
  closeAt: string;
}

export function useFormatHours() {
  const formatWorkingHours = (hours: WorkingHours[]) => {
    const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = hours.find(h => h.weekDay === today);
    return todayHours ? `${todayHours.openAt} - ${todayHours.closeAt}` : 'Closed';
  };

  return { formatWorkingHours };
}
