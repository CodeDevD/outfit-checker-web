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
const $whatsappButton = $('#whatsappButton');
const $copyButton = $('#copyButton');
const $closePopup = $('#closePopup');
const $outfitCheckerLink = $('#outfitCheckerLink');
const $aboutLink = $('#aboutLink');
const $sideMenu = $('#sideMenu');

const camera = new Camera($video[0], $videoOverlay[0], $canvas[0]);

let lastOutfitAnalysis;

$(document).ready(async function () {
  initializeLanguageDropdown();
  initializeMenuToggle();
  initializeGoToOutfitChecker();
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

function initializeGoToOutfitChecker() {
  const outfitCheckerHtmlContent = $mainContent.html();
  $outfitCheckerLink.click(function () {
    $sideMenu.toggleClass('menu-open');
    $mainContent.html(outfitCheckerHtmlContent);
    i18n.loadLanguage(i18n.getCurrentLanguage());
  })
}

function initializeMenuToggle() {
  $menuButton.click(function () {
    $sideMenu.toggleClass('menu-open');
  });
}

function initializeSharePopup() {
  $shareLink.click(function () {
    $sideMenu.toggleClass('menu-open');
    $sharePopup.css('display', 'flex');;
    $shareUrl.val(window.location.href);
  });

  $closePopup.click(function () {
    $sharePopup.css('display', 'none');
  });

  $copyButton.click(function () {
    $shareUrl.select();
    document.execCommand('copy');
    $copyButton.text(i18n.getText('copied'));
  });

  $whatsappButton.click(function () {
    const url = $shareUrl.val();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    window.open(whatsappUrl, '_blank');
  });
}

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
      console.error('Error loading about page:', error);
      $mainContent.innerHTML = '<p>Error loading about page.</p>';
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

$captureBtn.on('click', async () => {
  if (!(await checkPermissions())) {
    showBotFeedback(i18n.getText('request_permissions'));

    await sleep(1000);;
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
