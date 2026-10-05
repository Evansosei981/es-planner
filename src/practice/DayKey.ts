export const DayKey = {
  getTodayKey(): string {
    return this.fromDate(new Date());
  },

  getYesterdayKey(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.fromDate(d);
  },

  fromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  isConsecutive(prevKey: string, currentKey: string): boolean {
    const prev = new Date(prevKey).getTime();
    const curr = new Date(currentKey).getTime();
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }
};
