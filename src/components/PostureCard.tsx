import { motion } from 'framer-motion';
import { Bell, BellOff, Clock, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/hooks/useNotifications';
import { useState, useEffect } from 'react';

export function PostureCard() {
  const {
    permission,
    settings,
    scheduledTimes,
    isSupported,
    enable,
    disable,
    reschedule,
    testNotification,
  } = useNotifications();

  const [isEnabling, setIsEnabling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleToggle = async () => {
    if (settings.enabled) {
      disable();
    } else {
      setIsEnabling(true);
      await enable();
      setIsEnabling(false);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isSupported) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Seu navegador não suporta notificações push.
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto space-y-4"
    >
      {/* Main Control Card */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={settings.enabled ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`p-3 rounded-xl ${
                settings.enabled ? 'gradient-primary shadow-glow' : 'bg-muted'
              }`}
            >
              {settings.enabled ? (
                <Bell className="w-6 h-6 text-primary-foreground" />
              ) : (
                <BellOff className="w-6 h-6 text-muted-foreground" />
              )}
            </motion.div>
            <div>
              <h2 className="font-display font-semibold text-lg">Lembretes</h2>
              <p className="text-sm text-muted-foreground">
                {settings.enabled ? 'Ativo' : 'Desativado'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleToggle}
            disabled={isEnabling}
          />
        </div>

        {permission === 'denied' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm mb-4"
          >
            Notificações bloqueadas. Habilite nas configurações do navegador.
          </motion.div>
        )}

        {settings.enabled && scheduledTimes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Próximos lembretes:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scheduledTimes.map((time, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-secondary text-center"
                >
                  <span className="font-display font-semibold text-lg">
                    {formatTime(time)}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={reschedule}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Novos horários
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testNotification}
                className="flex-1"
              >
                <Bell className="w-4 h-4 mr-2" />
                Testar
              </Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Install Prompt */}
      {!isInstalled && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Instalar app</p>
                <p className="text-xs text-muted-foreground">
                  Acesso rápido na tela inicial
                </p>
              </div>
              <Button size="sm" onClick={handleInstall}>
                Instalar
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-4 bg-secondary/50">
          <p className="text-sm text-muted-foreground text-center">
            2 lembretes em horários aleatórios entre{' '}
            <span className="font-semibold text-foreground">10h</span> e{' '}
            <span className="font-semibold text-foreground">22h</span> (horário de Brasília)
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
