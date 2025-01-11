class I18n {
  #translations = {};
  #currentLanguage = 'de';
  #i18nPath = 'assets/i18n/';

  static instance;

  constructor() {
    if (I18n.instance) {
      return I18n.instance;
    }
    I18n.instance = this;
  }

  // Loads the specified language file and updates the texts
  async loadLanguage(lang) {
    try {
      const response = await fetch(`${this.#i18nPath}${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load language file for: ${lang}`);
      }
      this.#translations = await response.json();
      this.#updateTexts();
      this.#currentLanguage = lang;
      console.log(`Language loaded: ${lang}`);
    } catch (error) {
      console.error("Error loading language file:", error);
    }
  }

  // Updates text content of elements with the corresponding translation
  #updateTexts() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.getAttribute('data-i18n');
      const translation = key.split('.').reduce((obj, keyPart) => obj && obj[keyPart], this.#translations);
      if (translation) {
        element.textContent = translation;
      }
    });
  }

  // Retrieves a translated text by key, supports placeholders
  getText(key, placeholders = {}) {
    let text = this.#translations[key] || key;

    for (const [placeholder, value] of Object.entries(placeholders)) {
      text = text.replace(`{${placeholder}}`, value);
    }

    return text;
  }

  async getAndInitLanguage() {
    const savedLang = await i18n.getSavedLanguage();
    await i18n.loadLanguage(savedLang);
    return savedLang;
  }

  // Returns the currently selected language
  getCurrentLanguage() {
    return this.#currentLanguage;
  }

  getSavedLanguage() {
    const savedLang = localStorage.getItem('language');
    const userLang = savedLang || navigator.language.slice(0, 2);
    const lang = userLang === 'de' ? 'de' : 'en';
    return lang
  }

  // Changes the language if it differs from the current language
  async changeLanguage(lang) {
    if (lang !== this.#currentLanguage) {
      await this.loadLanguage(lang);
      localStorage.setItem('language', lang);
    }
  }
}

// Export a single instance of the I18n class
const i18n = new I18n();
export default i18n;
