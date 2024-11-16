import { Camera } from './camera.js';
import { weatherHandler } from './weather.js';
import outfitAnalyzer from './outfitAnalyzer.js';
import { checkPermissions } from './permissions.js';
import { showBotFeedback } from './ui.js';
import { testProxy } from './proxyTest.js';
import { GeolocationPermissionError } from './errors.js';
import i18n from './i18n.js';

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// DOM elements
const $mainContent = $("#main-content");
const $video = $('#video');
const $videoOverlay = $('#video-overlay');
const $canvas = $('#canvas');
const $captureBtn = $('#captureBtn');
const $retryButton = $('#retryButton');
const $showWeatherButton = $('#weather-toggle-button');
const $menuButton = $('#menuButton');
const $languageDropdown = $('#languageDropdown');
const $dropdownItems = $('.dropdown-item');
const $shareLink = $('#shareLink');
const $sharePopup = $('#sharePopup');
const $shareUrl = $('#shareUrl');
const $copyButton = $('#copyButton');
const $closePopup = $('#closePopup');
const $aboutLink = $('#aboutLink');
const $sideMenu = $('#sideMenu');

const camera = new Camera($video[0], $videoOverlay[0], $canvas[0]);

let lastOutfitAnalysis;

$(document).ready(async function () {
  initializeLanguageDropdown();
  initializeMenuToggle();
  initializeSharePopup();
  initializeAboutPage();
});

async function initializeLanguageDropdown() {
  $languageDropdown.text((await i18n.getAndInitLanguage()).toUpperCase());

  $dropdownItems.click(async function () {
    const lang = $(this).data('lang');
    $languageDropdown.text(lang.toUpperCase());
    await i18n.changeLanguage(lang);
  });
}

function initializeMenuToggle() {
  $menuButton.click(function () {
    $sideMenu.toggleClass('menu-open');
  });
}

function initializeSharePopup() {
  $shareLink.click(function () {
    $sideMenu.toggleClass('menu-open');
    $sharePopup.fadeIn();
    $shareUrl.val(window.location.href);
  });

  $closePopup.click(function () {
    $sharePopup.fadeOut();
  });

  // URL kopieren
  $copyButton.click(function () {
    $shareUrl.select();
    document.execCommand('copy');
    alert('URL kopiert!'); 
  });
}

// Funktion zum Anzeigen der "About"-Seite
function initializeAboutPage() {
  $aboutLink.click(async function () {
      event.preventDefault();
      $sideMenu.toggleClass('menu-open');

      try {
          const response = await fetch('about.html');
          if (!response.ok) {
              throw new Error(`HTTP-Fehler: ${response.status}`);
          }
          const aboutContent = await response.text();
          $mainContent.html(aboutContent);
          i18n.loadLanguage(i18n.getCurrentLanguage());
      } catch (error) {
          console.error('Fehler beim Laden der About-Seite:', error);
          $mainContent.innerHTML = '<p>Fehler beim Laden der About-Seite.</p>';
      }
  });
}

if (isDevelopment) {
  testProxy();
}

$retryButton.on('click', () => {
  $retryButton.hide();
  checkOutfit();
});

async function onForecastItemClicked(weatherData) {
  const feedback = await outfitAnalyzer.generateLlmResponseForOutfit(lastOutfitAnalysis, weatherData);
  showBotFeedback(feedback);
}

$captureBtn.on('click', async () => {
  if (!(await checkPermissions())) {
    showBotFeedback('Please grant permissions.');
    return;
  }

  const imageData = await camera.captureImageWithCountdown();
  lastOutfitAnalysis = await outfitAnalyzer.analyzeOutfit(imageData);

  let weatherInfo;
  try {
    weatherInfo = await weatherHandler.displayDailyWeather(onForecastItemClicked);
    $showWeatherButton.show();
  } catch (error) {
    if (error instanceof GeolocationPermissionError) {
      return;
    }
    throw error;
  }

  const feedback = await outfitAnalyzer.generateLlmResponseForOutfit(lastOutfitAnalysis, weatherInfo.currentWeather);
  showBotFeedback(feedback);
});

$showWeatherButton.on('click', weatherHandler.toggleWeatherVisibility.bind(weatherHandler));
