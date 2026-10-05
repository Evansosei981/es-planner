export const PracticeNotificationHelper = {
  /**
   * Requests permission for system web notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  /**
   * Sends the Daily Practice notification
   */
  sendPracticeReminder(questionsCount: number): boolean {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      new Notification('🦈 Your Daily Practice is ready!', {
        body: `${questionsCount} questions are waiting for you. Complete today's challenge to maintain your streak! 🔥`,
        icon: '/assistant_avatar.png',
        badge: '/assistant_avatar.png',
        tag: 'daily-practice-reminder'
      });
      return true;
    } catch (e) {
      console.error('Notification error:', e);
      return false;
    }
  }
};
