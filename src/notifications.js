// notifications.js — PWA browser notification utility for AlignedFlow

let permissionGranted = false;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return;
  }
  if (Notification.permission === 'denied') return;
  const result = await Notification.requestPermission();
  permissionGranted = result === 'granted';
}

export function sendNotification(title, body) {
  if (!permissionGranted || !('Notification' in window)) return;
  // Prefer service worker notification (works when app is backgrounded)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, { body, icon: '/icon.jpg', badge: '/icon.jpg' });
    });
  } else {
    new Notification(title, { body });
  }
}
