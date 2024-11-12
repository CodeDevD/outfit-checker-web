import { Camera } from './camera.js';
import { weatherHandler } from './weather.js';
import outfitAnalyzer from './outfitAnalyzer.js';
import { checkPermissions } from './permissions.js';
import { showBotFeedback } from './ui.js';
import { testProxy } from './proxyTest.js';
import { GeolocationPermissionError } from './errors.js';
import i18n from './i18n.js';

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const video = document.getElementById('video');
const videoOverlay = document.getElementById('video-overlay');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const retryButton = document.getElementById('retryButton');
const showWeatherButton = document.getElementById('weather-toggle-button');

const camera = new Camera(video, videoOverlay, canvas);
let lastOutfitAnalysis;

const languageSelectElement = document.getElementById('languageSelect');
await i18n.init(languageSelectElement);

if (isDevelopment) {
  testProxy();
}

retryButton.addEventListener('click', () => {
  retryButton.style.display = "none";
  checkOutfit();
});

async function onForecastItemClicked(weatherData) {
  const feedback = await outfitAnalyzer.generateLlmResponseForOutfit(lastOutfitAnalysis, weatherData);
  showBotFeedback(feedback);
}

captureBtn.addEventListener('click', async () => {
  if (!(await checkPermissions())) {
    showBotFeedback('Please grant permissions.');
    return;
  }

  const imageData = await camera.captureImageWithCountdown();

  lastOutfitAnalysis = await outfitAnalyzer.analyzeOutfit(imageData);

  let weatherInfo;
  try {
    weatherInfo = await weatherHandler.displayDailyWeather(onForecastItemClicked);
    showWeatherButton.style.display = "block";
  } catch (error) {
    if (error instanceof GeolocationPermissionError) {
      return;
    }
    throw error;
  }
  const feedback = await outfitAnalyzer.generateLlmResponseForOutfit(lastOutfitAnalysis, weatherInfo.currentWeather);

  showBotFeedback(feedback);
});

showWeatherButton.addEventListener('click', weatherHandler.toggleWeatherVisibility.bind(weatherHandler));
