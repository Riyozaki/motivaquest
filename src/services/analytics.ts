
import { UserProfile } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyibXkrpjTcaGb23jx_WosICwTx3jL8RYGYayNh3ypi6Vaz2nRUaKVTuhb1oEAFELgTJw/exec';

interface AnalyticsEvent {
  timestamp: string;
  eventType: string;
  userId: string;
  username: string;
  details: string; // JSON string
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private isProcessing = false;
  private flushInterval: any = null;
  private BATCH_SIZE = 5;
  private FLUSH_DELAY = 2000;

  constructor() {
    this.startAutoFlush();
  }

  private startAutoFlush() {
    if (this.flushInterval) return;
    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.FLUSH_DELAY);
  }

  public track(eventType: string, user: UserProfile | null, data: Record<string, any> = {}) {
    try {
      const event: AnalyticsEvent = {
        timestamp: new Date().toISOString(),
        eventType,
        userId: user?.email || user?.uid || 'anonymous', // Changed to prefer email for sheets
        username: user?.username || 'Guest',
        details: JSON.stringify(data),
      };

      this.queue.push(event);

      // Если очередь большая, отправляем немедленно
      if (this.queue.length >= this.BATCH_SIZE) {
        this.flush();
      }
    } catch (e) {
      console.warn('Analytics track error (silent):', e);
    }
  }

  private async flush() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = [...this.queue];
    this.queue = []; // Очищаем очередь

    try {
      // Используем action='analytics' если скрипт это поддерживает, или просто отправляем массив
      // Так как структура скрипта изменилась, лучше обернуть в стандартный формат API
      const payload = JSON.stringify({
        action: 'analyticsBatch',
        events: batch
      });

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain', 
        },
        body: payload,
      });

    } catch (error) {
      console.warn('Failed to send analytics batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const analytics = new AnalyticsService();