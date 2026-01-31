
import { UserProfile } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyBRHre4A6Ag2XTdEy8asNzoBEloOhl3NvTUHEM1Z74SMuS2YfjryEwzN1p3_NSnf1bwA/exec';

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
        userId: user?.uid || 'anonymous',
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
      // Google Apps Script принимает POST запросы.
      // Используем no-cors для fire-and-forget, так как нам не важен ответ,
      // и это решает проблемы с CORS в браузере при отправке на script.google.com.
      
      // Отправляем каждый ивент или батч. 
      // Простой вариант для GAS: отправляем батч как одну строку.
      const payload = JSON.stringify(batch);

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain', // Важно для избежания preflight OPTIONS запроса
        },
        body: payload,
      });

    } catch (error) {
      console.warn('Failed to send analytics batch:', error);
      // Опционально: вернуть в очередь при ошибке сети, но для "тихой" аналитики можно пропустить
    } finally {
      this.isProcessing = false;
    }
  }
}

export const analytics = new AnalyticsService();