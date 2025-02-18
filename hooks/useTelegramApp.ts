import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        requestLocation: (
          callback: (location: { latitude: number; longitude: number }) => void,
        ) => void;
      };
    };
  }
}

const useTelegramApp = () => {
  const [user, setUser] = useState<{
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
  } | null>(null);

  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    if (tg.initDataUnsafe.user) {
      setUser(tg.initDataUnsafe.user);
    }
  }, []);

  const close = () => {
    window.Telegram.WebApp.close();
  };

  const sendMessage = async (text: string) => {
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            chat: { id: user?.id },
            text: text,
          },
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const requestLocation = (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (window.Telegram.WebApp.requestLocation) {
        window.Telegram.WebApp.requestLocation(location => {
          if (location) {
            resolve(location);
          } else {
            reject(new Error('Location request was denied'));
          }
        });
      } else {
        reject(new Error('Location request is not supported in this Telegram client'));
      }
    });
  };

  return { user, close, sendMessage, requestLocation };
};

export default useTelegramApp;
