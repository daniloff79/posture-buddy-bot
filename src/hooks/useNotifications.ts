import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'postura-settings';
const NOTIFICATIONS_KEY = 'postura-notifications';
const CHECK_INTERVAL = 30000; // Check every 30 seconds

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
  const checkIntervalRef = useRef<number | null>(null);
  const notifiedTimesRef = useRef<Set<string>>(new Set());

  // Load settings and scheduled times from localStorage
  useEffect(() => {
    setIsSupported('Notification' in window);
    
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
        const data = JSON.parse(savedNotifications);
        const times = data.times?.map((t: string) => new Date(t)) || [];
        const notified = data.notified || [];
        notifiedTimesRef.current = new Set(notified);
        
        const now = new Date();
        const validTimes = times.filter((t: Date) => t > now || notified.includes(t.toISOString()));
        setScheduledTimes(validTimes);
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Save scheduled times to localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify({
      times: scheduledTimes.map(t => t.toISOString()),
      notified: Array.from(notifiedTimesRef.current)
    }));
  }, [scheduledTimes]);

  // Show notification
  const showNotification = useCallback((message: string) => {
    if (permission !== 'granted') return;

    try {
      const notification = new Notification('Lembrete de Postura', {
        body: message,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'postura-reminder',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.error('Error showing notification:', e);
    }
  }, [permission]);

  // Check if any scheduled notifications should be triggered
  const checkNotifications = useCallback(() => {
    if (!settings.enabled || permission !== 'granted') return;

    const now = new Date();
    const todayKey = now.toDateString();

    scheduledTimes.forEach((time) => {
      const timeKey = time.toISOString();
      
      // Skip if already notified
      if (notifiedTimesRef.current.has(timeKey)) return;

      // Check if it's time (within 1 minute window)
      const timeDiff = now.getTime() - time.getTime();
      if (timeDiff >= 0 && timeDiff < 60000) {
        const message = messages[Math.floor(Math.random() * messages.length)];
        showNotification(message);
        notifiedTimesRef.current.add(timeKey);
        
        // Update localStorage
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify({
          times: scheduledTimes.map(t => t.toISOString()),
          notified: Array.from(notifiedTimesRef.current)
        }));

        console.log('Notification shown at:', new Date().toLocaleTimeString());
      }
    });

    // Check if all notifications for today are done, schedule for tomorrow
    const allDone = scheduledTimes.every(t => 
      notifiedTimesRef.current.has(t.toISOString()) || t.getTime() < now.getTime() - 60000
    );

    if (allDone && scheduledTimes.length > 0) {
      // Schedule for tomorrow
      setTimeout(() => {
        generateAndSetTimes();
      }, 1000);
    }
  }, [settings.enabled, permission, scheduledTimes, showNotification]);

  // Generate random times for notifications
  const generateRandomTimes = useCallback((startHour: number, endHour: number): Date[] => {
    const now = new Date();
    
    // Get current time in Brasília (UTC-3)
    const brasiliaOffset = -3 * 60; // -3 hours in minutes
    const localOffset = now.getTimezoneOffset();
    const totalOffset = localOffset + brasiliaOffset;
    
    const brasiliaTime = new Date(now.getTime() + totalOffset * 60 * 1000);
    const currentHourInBrasilia = brasiliaTime.getHours();
    const currentMinuteInBrasilia = brasiliaTime.getMinutes();
    
    const times: Date[] = [];
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;
    const currentMinutesInBrasilia = currentHourInBrasilia * 60 + currentMinuteInBrasilia;
    
    // Generate 2 random times
    for (let i = 0; i < 2; i++) {
      let randomMinutes: number;
      let isForTomorrow = false;
      
      // If current time is before the window, schedule for today
      if (currentMinutesInBrasilia < startMinutes) {
        randomMinutes = startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes));
      } 
      // If current time is within the window, schedule for remaining time today
      else if (currentMinutesInBrasilia < endMinutes) {
        const remainingMinutes = endMinutes - currentMinutesInBrasilia;
        if (remainingMinutes > 30) {
          randomMinutes = currentMinutesInBrasilia + 5 + Math.floor(Math.random() * (remainingMinutes - 5));
        } else {
          // Not enough time today, schedule for tomorrow
          randomMinutes = startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes));
          isForTomorrow = true;
        }
      } 
      // If current time is after the window, schedule for tomorrow
      else {
        randomMinutes = startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes));
        isForTomorrow = true;
      }
      
      const hours = Math.floor(randomMinutes / 60);
      const minutes = randomMinutes % 60;
      
      // Create notification time in local timezone
      const notificationTime = new Date(now);
      if (isForTomorrow) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }
      
      // Convert Brasília time to local time
      notificationTime.setHours(hours, minutes, 0, 0);
      notificationTime.setTime(notificationTime.getTime() - totalOffset * 60 * 1000);
      
      times.push(notificationTime);
    }
    
    return times.sort((a, b) => a.getTime() - b.getTime());
  }, []);

  const generateAndSetTimes = useCallback(() => {
    const times = generateRandomTimes(settings.startHour, settings.endHour);
    notifiedTimesRef.current.clear();
    setScheduledTimes(times);
    console.log('Scheduled notifications:', times.map(t => t.toLocaleTimeString()));
    return times;
  }, [settings.startHour, settings.endHour, generateRandomTimes]);

  // Start/stop periodic check
  useEffect(() => {
    if (settings.enabled && permission === 'granted') {
      // Initial check
      checkNotifications();
      
      // Set up interval
      checkIntervalRef.current = window.setInterval(checkNotifications, CHECK_INTERVAL);
      
      // Also check on visibility change
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          checkNotifications();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    } else {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    }
  }, [settings.enabled, permission, checkNotifications]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const enable = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return false;
    
    generateAndSetTimes();
    setSettings(prev => ({ ...prev, enabled: true }));
    return true;
  }, [requestPermission, generateAndSetTimes]);

  const disable = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: false }));
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const reschedule = useCallback(() => {
    if (settings.enabled) {
      generateAndSetTimes();
    }
  }, [settings.enabled, generateAndSetTimes]);

  // Send test notification
  const testNotification = useCallback(() => {
    if (permission !== 'granted') {
      console.log('Permission not granted');
      return;
    }
    const message = messages[Math.floor(Math.random() * messages.length)];
    showNotification(message);
  }, [permission, showNotification]);

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
    testNotification,
  };
}
