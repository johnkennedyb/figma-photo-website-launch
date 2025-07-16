import { api } from './api';

const VAPID_PUBLIC_KEY = 'BAaXeuOTaOAs2jkBdpbr6-MHM5Wn3cdObyVZ9pXqMHZb5m2XfEO_9Qekb_snYvFpfbjW1lJ22uuYaiSBbHbccfo';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPushNotifications = async (token: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported by this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');

    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return; // Already subscribed
    }

    const permission = await window.Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission for notifications was denied.');
      return;
    }

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    await api.post('/notifications/subscribe', { subscription }, {
      headers: { 'x-auth-token': token },
    });

  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
  }
};
