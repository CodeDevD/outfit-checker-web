import { showBotFeedback } from './ui.js';

export function getLocation(retryButton) {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        const currentPosition = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        resolve(currentPosition);
      }, function (error) {
        if (error.code === error.PERMISSION_DENIED) {
          showBotFeedback(getText('geolocation_permission_denied_response'));
          retryButton.style.display = 'block'
          reject(new GeolocationPermissionError("Geolocation permission was denied."));
        } else {
          reject("Geolocation error: " + error.message);
        }
      });
    } else {
      reject("Geolocation is not supported.");
    }
  });
}