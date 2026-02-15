import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const STORAGE_KEY = 'postura-settings';
const NOTIFICATIONS_KEY = 'postura-notifications';

interface Settings {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

const defaultSettings: Settings = {
  enabled: false,
  startHour: 9.5,
  endHour: 22.5,
};

const messages = [
  "🧘 Hora de ajustar a postura! Ombros para trás, coluna reta.",
  "💪 Lembrete: Endireite as costas e relaxe os ombros.",
  "🪑 Postura! Sente-se ereto e respire fundo.",
  "✨ Cuide da sua coluna! Ajuste sua postura agora.",
  "🌿 Momento postura: Costas retas, queixo paralelo ao chão.",
  "⚡ Atenção à postura! Pés no chão, costas apoiadas.",
];

const isNative = Capacitor.isNativePlatform();

export function useNotifications() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [scheduledTimes, setScheduledTimes] = useState<Date[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  // Load settings and scheduled times from localStorage
  useEffect(() => {
    setIsSupported(isNative || 'Notification' in window);

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
        setScheduledTimes(times);
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    }

    // Check current permission
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (isNative) {
      try {
        const result = await LocalNotifications.checkPermissions();
        setPermission(result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'default');
      } catch {
        setPermission('default');
      }
    } else if ('Notification' in window) {
      setPermission(Notification.permission as 'granted' | 'denied' | 'default');
    }
  };

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Save scheduled times to localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify({
      times: scheduledTimes.map(t => t.toISOString()),
    }));
  }, [scheduledTimes]);

  // Generate random times for notifications in Brasília timezone
  const generateRandomTimes = useCallback((startHour: number, endHour: number): Date[] => {
    const now = new Date();
    const brasiliaOffset = -3 * 60;
    const localOffset = now.getTimezoneOffset();
    const totalOffset = localOffset + brasiliaOffset;
    const brasiliaTime = new Date(now.getTime() + totalOffset * 60 * 1000);
    const currentHourInBrasilia = brasiliaTime.getHours();
    const currentMinuteInBrasilia = brasiliaTime.getMinutes();

    const times: Date[] = [];
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;
    const currentMinutesInBrasilia = currentHourInBrasilia * 60 + currentMinuteInBrasilia;

    for (let i = 0; i < 2; i++) {
      let randomMinutes: number;
      let isForTomorrow = false;

      if (currentMinutesInBrasilia < startMinutes) {
        randomMinutes = startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes));
      } else if (currentMinutesInBrasilia < endMinutes) {
        const remainingMinutes = endMinutes - currentMinutesInBrasilia;
        if (remainingMinutes > 30) {
          randomMinutes = currentMinutesInBrasilia + 5 + Math.floor(Math.random() * (remainingMinutes - 5));
        } else {
          randomMinutes = startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes));
          isForTomorrow = true;
        }
      } else {
        randomMinutes = startMinutes + Math.floor(Math.random() * (endMinutes - startMinutes));
        isForTomorrow = true;
      }

      const hours = Math.floor(randomMinutes / 60);
      const minutes = randomMinutes % 60;

      const notificationTime = new Date(now);
      if (isForTomorrow) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      notificationTime.setHours(hours, minutes, 0, 0);
      notificationTime.setTime(notificationTime.getTime() - totalOffset * 60 * 1000);

      times.push(notificationTime);
    }

    return times.sort((a, b) => a.getTime() - b.getTime());
  }, []);

  // Schedule native notifications via Capacitor
  const scheduleNativeNotifications = useCallback(async (times: Date[]) => {
    if (!isNative) return;

    try {
      // Cancel all pending
      await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }] });

      const now = new Date();
      const notifications = times
        .filter(t => t > now)
        .map((time, index) => ({
          id: index + 1,
          title: 'Lembrete de Postura',
          body: messages[Math.floor(Math.random() * messages.length)],
          schedule: { at: time, allowWhileIdle: true, exact: true },
          smallIcon: 'ic_stat_icon',
          largeIcon: 'ic_launcher',
          channelId: 'postura-reminders',
        }));

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log('Native notifications scheduled:', times.map(t => t.toLocaleTimeString()));
      }
    } catch (e) {
      console.error('Error scheduling native notifications:', e);
    }
  }, []);

  const generateAndSetTimes = useCallback(() => {
    const times = generateRandomTimes(settings.startHour, settings.endHour);
    setScheduledTimes(times);
    scheduleNativeNotifications(times);
    console.log('Scheduled notifications:', times.map(t => t.toLocaleTimeString()));
    return times;
  }, [settings.startHour, settings.endHour, generateRandomTimes, scheduleNativeNotifications]);

  // Re-schedule when app becomes visible (handles next-day rollover)
  useEffect(() => {
    if (!settings.enabled || permission !== 'granted') return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = new Date();
        const allPast = scheduledTimes.every(t => t.getTime() < now.getTime() - 60000);
        if (allPast && scheduledTimes.length > 0) {
          generateAndSetTimes();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    // Check immediately
    handleVisibility();

    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [settings.enabled, permission, scheduledTimes, generateAndSetTimes]);

  // Create notification channel on Android
  useEffect(() => {
    if (isNative) {
      LocalNotifications.createChannel({
        id: 'postura-reminders',
        name: 'Lembretes de Postura',
        description: 'Lembretes para corrigir a postura',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        vibration: true,
      }).catch(console.error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (isNative) {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      setPermission(granted ? 'granted' : 'denied');

      // Request exact alarm permission on Android 12+
      try {
        const exactStatus = await LocalNotifications.checkExactNotificationSetting();
        if (exactStatus.exact_alarm !== 'granted') {
          await LocalNotifications.changeExactNotificationSetting();
        }
      } catch (e) {
        console.log('Exact alarm permission not available:', e);
      }

      return granted;
    }

    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result as 'granted' | 'denied' | 'default');
    return result === 'granted';
  }, []);

  const enable = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return false;

    setSettings(prev => ({ ...prev, enabled: true }));
    const times = generateRandomTimes(settings.startHour, settings.endHour);
    setScheduledTimes(times);
    await scheduleNativeNotifications(times);
    return true;
  }, [requestPermission, generateRandomTimes, scheduleNativeNotifications, settings.startHour, settings.endHour]);

  const disable = useCallback(async () => {
    setSettings(prev => ({ ...prev, enabled: false }));
    if (isNative) {
      await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }] }).catch(console.error);
    }
  }, []);

  const reschedule = useCallback(() => {
    if (settings.enabled) {
      generateAndSetTimes();
    }
  }, [settings.enabled, generateAndSetTimes]);

  const testNotification = useCallback(async () => {
    const message = messages[Math.floor(Math.random() * messages.length)];

    if (isNative) {
      await LocalNotifications.schedule({
        notifications: [{
          id: 999,
          title: 'Lembrete de Postura',
          body: message,
          schedule: { at: new Date(Date.now() + 1000) },
          smallIcon: 'ic_stat_icon',
          largeIcon: 'ic_launcher',
          channelId: 'postura-reminders',
        }],
      });
    } else if (permission === 'granted') {
      new Notification('Lembrete de Postura', {
        body: message,
        icon: '/icons/icon-192.png',
      });
    }
  }, [permission]);

  return {
    permission,
    settings,
    scheduledTimes,
    isSupported,
    enable,
    disable,
    updateSettings: useCallback((newSettings: Partial<Settings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }, []),
    reschedule,
    requestPermission,
    testNotification,
  };
}
