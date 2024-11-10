let currentLanguage = 'de';
const i18nPath = 'assets/i18n/';

let translations = {};

export async function loadLanguage(lang) {
  try {
    const response = await fetch(`${i18nPath}${lang}.json`);
    translations = await response.json();
    updateTexts(translations);
    currentLanguage = lang;
    console.log(`Sprache geladen: ${lang}`);
  } catch (error) {
    console.error("Fehler beim Laden der Sprachdatei:", error);
  }
}

function updateTexts(translations) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });
}

export function getText(key, placeholders = {}) {
    let text = translations[key] || key;
  
    for (const [placeholder, value] of Object.entries(placeholders)) {
      text = text.replace(`{${placeholder}}`, value);
    }
  
    return text;
  }

export function getCurrentLanguage() {
  return currentLanguage;
}

export function changeLanguage(lang) {
  if (lang !== currentLanguage) {
    loadLanguage(lang);
  }
}
