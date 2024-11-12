class I18n {
  #translations = {};
  #currentLanguage = 'de';
  #i18nPath = 'assets/i18n/';

  // Singleton pattern to ensure only one instance
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
      if (this.#translations[key]) {
        element.textContent = this.#translations[key];
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

  // Returns the currently selected language
  getCurrentLanguage() {
    return this.#currentLanguage;
  }

  // Changes the language if it differs from the current language
  async changeLanguage(lang) {
    if (lang !== this.#currentLanguage) {
      await this.loadLanguage(lang);
    }
  }

  // Initializes the language selection UI and loads the user's preferred language
  async init(languageSelectElement) {
    const savedLang = localStorage.getItem('language');
    const userLang = savedLang || navigator.language.slice(0, 2);
    const defaultLang = userLang === 'de' ? 'de' : 'en';

    await this.loadLanguage(defaultLang);

    languageSelectElement.value = defaultLang;

    languageSelectElement.addEventListener('change', async (event) => {
      const selectedLanguage = event.target.value;
      localStorage.setItem('language', selectedLanguage);
      await this.changeLanguage(selectedLanguage);
    });
  }
}

// Export a single instance of the I18n class
const i18n = new I18n();
export default i18n;
