class I18n {
  static messages = null;
  static currentLanguage = 'en';

  static async init() {
    try {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      let language = 'en';

      if (browserAPI.storage && browserAPI.storage.sync) {
        const result = await browserAPI.storage.sync.get('language');
        language =
          result.language ||
          (browserAPI.i18n ? browserAPI.i18n.getUILanguage() : 'en') ||
          'en';
      } else {
        const languageSelect = document.getElementById('language');
        language =
          (languageSelect ? languageSelect.value : null) ||
          localStorage.getItem('language') ||
          'en';
      }

      language = language.split('-')[0];
      await I18n.setLanguage(language);
    } catch (error) {
      I18n.setLanguage('en');
    }
  }

  static async setLanguage(language) {
    try {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      I18n.currentLanguage = (language || 'en').split('-')[0];

      await I18n.loadMessages(I18n.currentLanguage);

      let directionality = 'ltr';
      if (
        I18n.messages &&
        I18n.messages.directionality &&
        I18n.messages.directionality.message
      ) {
        directionality = I18n.messages.directionality.message;
      } else if (browserAPI.i18n) {
        const firefoxDir = browserAPI.i18n.getMessage('directionality');
        if (firefoxDir) directionality = firefoxDir;
      } else if (
        I18n.currentLanguage === 'ar' ||
        I18n.currentLanguage === 'fa' ||
        I18n.currentLanguage === 'he'
      ) {
        directionality = 'rtl';
      }

      document.body.setAttribute('dir', directionality);

      const elements = document.querySelectorAll('[data-i18n]');
      elements.forEach((element) => {
        const key = element.getAttribute('data-i18n');
        const message = I18n.getMessage(key);
        if (message) {
          element.textContent = message;
        }
      });

      const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
      placeholders.forEach((element) => {
        const key = element.getAttribute('data-i18n-placeholder');
        const message = I18n.getMessage(key);
        if (message) {
          element.setAttribute('placeholder', message);
        }
      });

      const languageSelect = document.getElementById('language');
      if (languageSelect) {
        languageSelect.value = I18n.currentLanguage;
      }
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }

  static async loadMessages(language) {
    try {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
      const path = `_locales/${language}/messages.json`;
      const url =
        browserAPI.runtime && browserAPI.runtime.getURL
          ? browserAPI.runtime.getURL(path)
          : path;

      const res = await fetch(url);
      if (res.ok) {
        I18n.messages = await res.json();
      } else {
        I18n.messages = null;
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      I18n.messages = null;
    }
  }

  static getMessage(key) {
    try {
      const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

      if (
        I18n.messages &&
        I18n.messages[key] &&
        typeof I18n.messages[key].message === 'string'
      ) {
        return I18n.messages[key].message;
      }

      if (browserAPI.i18n) {
        return browserAPI.i18n.getMessage(key) || key;
      }
    } catch (error) {
    }
    return key;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  I18n.init();
});
