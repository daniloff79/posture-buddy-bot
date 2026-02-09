import { useState, useEffect, useCallback } from 'react';

interface ScheduledNotification {
  id: string;
  time: Date;
  timeoutId?: NodeJS.Timeout;
}

const STORAGE_KEY = 'postura-settings';
const NOTIFICATIONS_KEY = 'postura-notifications';

interface Settings {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

const defaultSettings: Settings = {
  enabled: false,
  startHour: 10,
  endHour: 22,
};

const messages = [
  "🧘 Hora de ajustar a postura! Ombros para trás, coluna reta.",
  "💪 Lembrete: Endireite as costas e relaxe os ombros.",
  "🪑 Postura! Sente-se ereto e respire fundo.",
  "✨ Cuide da sua coluna! Ajuste sua postura agora.",
  "🌿 Momento postura: Costas retas, queixo paralelo ao chão.",
  "⚡ Atenção à postura! Pés no chão, costas apoiadas.",
];

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [scheduledTimes, setScheduledTimes] = useState<Date[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (savedNotifications) {
      try {
        const times = JSON.parse(savedNotifications).map((t: string) => new Date(t));
        const now = new Date();
        const validTimes = times.filter((t: Date) => t > now);
        setScheduledTimes(validTimes);
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(scheduledTimes.map(t => t.toISOString())));
  }, [scheduledTimes]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', registration);
        return registration;
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    }
    return null;
  }, []);

  const generateRandomTimes = useCallback((startHour: number, endHour: number): Date[] => {
    const now = new Date();
    const today = new Date(now);
    
    // Adjust for Brasília time (UTC-3)
    const brasiliaOffset = -3 * 60;
    const localOffset = now.getTimezoneOffset();
    const offsetDiff = (brasiliaOffset - localOffset) * 60 * 1000;
    
    const times: Date[] = [];
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;
    const range = endMinutes - startMinutes;
    
    // Generate 2 random times
    for (let i = 0; i < 2; i++) {
      const randomMinutes = startMinutes + Math.floor(Math.random() * range);
      const hours = Math.floor(randomMinutes / 60);
      const minutes = randomMinutes % 60;
      
      const notificationTime = new Date(today);
      notificationTime.setHours(hours, minutes, 0, 0);
      
      // Adjust for Brasília time
      notificationTime.setTime(notificationTime.getTime() - offsetDiff);
      
      // If time already passed today, schedule for tomorrow
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }
      
      times.push(notificationTime);
    }
    
    return times.sort((a, b) => a.getTime() - b.getTime());
  }, []);

  const scheduleNotifications = useCallback(async () => {
    const times = generateRandomTimes(settings.startHour, settings.endHour);
    setScheduledTimes(times);
    
    const registration = await navigator.serviceWorker.ready;
    
    times.forEach((time, index) => {
      const delay = time.getTime() - Date.now();
      if (delay > 0) {
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        registration.active?.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          delay,
          title: 'Lembrete de Postura',
          body: message,
        });
      }
    });
    
    return times;
  }, [settings.startHour, settings.endHour, generateRandomTimes]);

  const enable = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return false;
    
    await registerServiceWorker();
    await scheduleNotifications();
    
    setSettings(prev => ({ ...prev, enabled: true }));
    return true;
  }, [requestPermission, registerServiceWorker, scheduleNotifications]);

  const disable = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: false }));
    setScheduledTimes([]);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const reschedule = useCallback(async () => {
    if (settings.enabled) {
      await scheduleNotifications();
    }
  }, [settings.enabled, scheduleNotifications]);

  return {
    permission,
    settings,
    scheduledTimes,
    isSupported,
    enable,
    disable,
    updateSettings,
    reschedule,
    requestPermission,
  };
}
