import { convertBase64ToUint8Array } from '..';
import CONFIG from '../../config';
import { subscribePushNotification, unsubscribePushNotification } from '../../data/api';

export function isNotificationAvailable() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Notification API unsupported.');
    return false;
  }

  if (isNotificationGranted()) {
    return true;
  }

  const status = await Notification.requestPermission();

  if (status === 'denied') {
    alert('Izin notifikasi ditolak.');
    return false;
  }

  if (status === 'default') {
    alert('Izin notifikasi ditutup atau diabaikan.');
    return false;
  }

  return true;
}

export async function getPushSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('getPushSubscription error:', error);
    return null;
  }
}

export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(CONFIG.VAPID_API_KEY),
  };
}

export async function subscribe() {
  if (!isNotificationAvailable()) {
    alert('Browser tidak mendukung Notification API atau Service Worker.');
    return false;
  }

  if (!(await requestNotificationPermission())) {
    return false;
  }

  if (await isCurrentPushSubscriptionAvailable()) {
    alert('Sudah berlangganan push notification.');
    return true;
  }

  console.log('Mulai berlangganan push notification...');

  const failureSubscribeMessage = 'Langganan push notification gagal diaktifkan.';
  const successSubscribeMessage = 'Langganan push notification berhasil diaktifkan.';

  let pushSubscription = null;

  try {
    const registration = await navigator.serviceWorker.ready;
    pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());

    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await subscribePushNotification({ endpoint, keys });

    if (!response.ok) {
      console.error('subscribe: response:', response);
      alert(failureSubscribeMessage);

      // Undo subscribe to push notification if subscription was successful
      if (pushSubscription) {
        try {
          await pushSubscription.unsubscribe();
        } catch (unsubscribeError) {
          console.error('Error unsubscribing after failed API call:', unsubscribeError);
        }
      }

      return;
    }

    alert(successSubscribeMessage);
    return true;
  } catch (error) {
    console.error('subscribe: error:', error);
    alert(failureSubscribeMessage);

    // Undo subscribe to push notification only if subscription was successful
    if (pushSubscription) {
      try {
        await pushSubscription.unsubscribe();
      } catch (unsubscribeError) {
        console.error('Error unsubscribing after subscription error:', unsubscribeError);
      }
    }
    return false;
  }

  return false;
}

export async function unsubscribe() {
  const failureUnsubscribeMessage = 'Langganan push notification gagal dinonaktifkan.';
  const successUnsubscribeMessage = 'Langganan push notification berhasil dinonaktifkan.';

  try {
    const pushSubscription = await getPushSubscription();

    if (!pushSubscription) {
      alert('Tidak bisa memutus langganan push notification karena belum berlangganan sebelumnya.');
      return false;
    }

    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await unsubscribePushNotification({ endpoint });

    if (!response.ok) {
      alert(failureUnsubscribeMessage);
      console.error('unsubscribe: response:', response);
      return false;
    }

    const unsubscribed = await pushSubscription.unsubscribe();

    if (!unsubscribed) {
      alert(failureUnsubscribeMessage);
      // Try to re-subscribe to server if local unsubscription failed
      try {
        await subscribePushNotification({ endpoint, keys });
      } catch (resubscribeError) {
        console.error('Error re-subscribing after failed local unsubscription:', resubscribeError);
      }
      return false;
    }

    alert(successUnsubscribeMessage);
    return true;
  } catch (error) {
    alert(failureUnsubscribeMessage);
    console.error('unsubscribe: error:', error);
    return false;
  }
}