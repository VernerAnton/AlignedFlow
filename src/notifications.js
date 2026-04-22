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
  if ('serviceWorker' in navigator) {
    // serviceWorker.ready resolves once SW is active, even before the page is "controlled"
    // SW showNotification is required for OS-level toast notifications on Windows/Android
    navigator.serviceWorker.ready.then(reg => {
      return reg.showNotification(title, { body, icon: '/icon.jpg', badge: '/icon.jpg' });
    }).catch(() => {
      try { new Notification(title, { body }); } catch (_) {}
    });
  } else {
    try { new Notification(title, { body }); } catch (_) {}
  }
}
