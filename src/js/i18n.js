class I18n {
  static messages = null;
  static currentLanguage = 'en';

  static init() {
    try {
      if (window.ExtCompat) {
        window.ExtCompat.storageGet('language', (result) => {
          let language = result.language || window.ExtCompat.getUILanguage() || 'en';
          language = language.split('-')[0];
          I18n.setLanguage(language);
        });
      } else {
        const languageSelect = document.getElementById('language');
        const language = languageSelect ? languageSelect.value : (localStorage.getItem('language') || 'en');
        I18n.setLanguage(language);
      }
    } catch (error) {
      I18n.setLanguage('en');
    }
  }

  static async setLanguage(language) {
    try {
      I18n.currentLanguage = (language || 'en').split('-')[0];

      await I18n.loadMessages(I18n.currentLanguage);

      let directionality = 'ltr';
      if (I18n.messages && I18n.messages.directionality && I18n.messages.directionality.message) {
        directionality = I18n.messages.directionality.message;
      } else if (window.ExtCompat) {
        const browserDir = window.ExtCompat.getMessage('directionality');
        if (browserDir) directionality = browserDir;
      } else if (I18n.currentLanguage === 'ar' || I18n.currentLanguage === 'fa') {
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
    }
  }

  static async loadMessages(language) {
    try {
      const path = `_locales/${language}/messages.json`;
      const url = window.ExtCompat ? window.ExtCompat.getURL(path) : path;

      const res = await fetch(url);
      if (res.ok) {
        I18n.messages = await res.json();
      } else {
        I18n.messages = null;
      }
    } catch (error) {
      I18n.messages = null;
    }
  }

  static getMessage(key) {
    try {
      if (I18n.messages && I18n.messages[key] && typeof I18n.messages[key].message === 'string') {
        return I18n.messages[key].message;
      }

      if (window.ExtCompat) {
        return window.ExtCompat.getMessage(key) || key;
      }
    } catch (error) {
      // ignore
    }
    return key;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  I18n.init();
});
