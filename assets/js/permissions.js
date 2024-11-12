import i18n from './i18n.js';
import { showBotFeedback } from './ui.js';

export async function checkPermissions() {
  try {
    const cameraPermission = await navigator.permissions.query({ name: 'camera' });
    const locationPermission = await navigator.permissions.query({ name: 'geolocation' });
    return cameraPermission.state === 'granted' && locationPermission.state === 'granted';
  } catch (error) {
    showBotFeedback(i18n.getText('error_checking_permissions'));
    return false;
  }
}
