document.addEventListener('DOMContentLoaded', () => {
  const languageSelect = document.getElementById('language');
  const saveButton = document.getElementById('saveButton');
  const exportButton = document.getElementById('exportButton');
  const customParamName = document.getElementById('customParamName');
  const customParamValue = document.getElementById('customParamValue');
  const addCustomParamButton = document.getElementById('addCustomParamButton');
  const savedCustomParams = document.getElementById('savedCustomParams');

  const currentYear = document.getElementById('currentYear');
  currentYear.textContent = new Date().getFullYear();

  loadSettings();
  loadSavedCustomParams();

  saveButton.addEventListener('click', saveSettings);
  exportButton.addEventListener('click', exportSettings);
  addCustomParamButton.addEventListener('click', addCustomParam);

  function addParamToUI(name, value) {
    const paramItem = document.createElement('div');
    paramItem.className = 'custom-param-item';

    const paramNameSpan = document.createElement('span');
    paramNameSpan.textContent = name;

    const paramValueSpan = document.createElement('span');
    paramValueSpan.textContent = value;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-param';
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', function () {
      paramItem.remove();

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get('customParams', (result) => {
          let customParams = result.customParams || [];
          customParams = customParams.filter(param => param.name !== name);
          chrome.storage.sync.set({ customParams });
        });
      } else {
        const customParamsStr = localStorage.getItem('customParams');
        let customParams = customParamsStr ? JSON.parse(customParamsStr) : [];
        customParams = customParams.filter(param => param.name !== name);
        localStorage.setItem('customParams', JSON.stringify(customParams));
      }
    });

    paramItem.appendChild(paramNameSpan);
    paramItem.appendChild(paramValueSpan);
    paramItem.appendChild(deleteButton);
    savedCustomParams.appendChild(paramItem);
  }

  function loadSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get('language', (result) => {
          const language = result.language || (chrome.i18n ? chrome.i18n.getUILanguage() : 'en') || 'en';
          languageSelect.value = language;
        });
      } else {
        const language = localStorage.getItem('language') || 'en';
        languageSelect.value = language;
      }
    } catch (error) {
      languageSelect.value = 'en';
    }
  }

  function saveSettings() {
    const language = languageSelect.value;

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ language: language }, () => {
          I18n.setLanguage(language);

          showSuccessMessage();
        });
      } else {
        localStorage.setItem('language', language);
        I18n.setLanguage(language);
        showSuccessMessage();
      }
    } catch (error) {
      localStorage.setItem('language', language);
      I18n.setLanguage(language);
      showSuccessMessage();
    }
  }

  function showSuccessMessage() {
    let successMessage = document.querySelector('.success-message');

    if (!successMessage) {
      successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = I18n.getMessage('saveButton') + '!';

      const main = document.querySelector('.main');
      main.insertBefore(successMessage, main.firstChild);
    }

    successMessage.classList.add('visible');

    setTimeout(() => {
      successMessage.classList.remove('visible');
    }, 3000);
  }

  function addCustomParam() {
    const name = customParamName.value.trim();
    const value = customParamValue.value.trim();

    if (!name) {
      return;
    }

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get('customParams', (result) => {
          let customParams = result.customParams || [];

          const existingIndex = customParams.findIndex(param => param.name === name);

          if (existingIndex !== -1) {
            customParams[existingIndex].value = value;
          } else {
            customParams.push({ name, value });
          }

          chrome.storage.sync.set({ customParams }, () => {
            addParamToUI(name, value);

            customParamName.value = '';
            customParamValue.value = '';
          });
        });
      } else {
        const customParamsStr = localStorage.getItem('customParams');
        let customParams = customParamsStr ? JSON.parse(customParamsStr) : [];

        const existingIndex = customParams.findIndex(param => param.name === name);

        if (existingIndex !== -1) {
          customParams[existingIndex].value = value;
        } else {
          customParams.push({ name, value });
        }

        localStorage.setItem('customParams', JSON.stringify(customParams));

        addParamToUI(name, value);

        customParamName.value = '';
        customParamValue.value = '';
      }
    } catch (error) {
    }
  }

  function loadSavedCustomParams() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get('customParams', (result) => {
          const customParams = result.customParams || [];

          savedCustomParams.innerHTML = '';

          customParams.forEach((param) => {
            addParamToUI(param.name, param.value);
          });
        });
      } else {
        const customParamsStr = localStorage.getItem('customParams');
        const customParams = customParamsStr ? JSON.parse(customParamsStr) : [];

        savedCustomParams.innerHTML = '';

        customParams.forEach((param) => {
          addParamToUI(param.name, param.value);
        });
      }
    } catch (error) {
      savedCustomParams.innerHTML = '';
    }
  }

  function exportSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['language', 'customParams'], (result) => {
          const settings = {
            language: result.language || 'en',
            customParams: result.customParams || []
          };

          const dataStr = JSON.stringify(settings, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

          const exportFileDefaultName = 'utm-settings.json';

          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
        });
      } else {
        const settings = {
          language: localStorage.getItem('language') || 'en',
          customParams: JSON.parse(localStorage.getItem('customParams') || '[]')
        };

        const dataStr = JSON.stringify(settings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'utm-settings.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  function updateCustomParamsDisplay(customParams) {
    savedCustomParams.innerHTML = '';

    customParams.forEach((param) => {
      const paramItem = document.createElement('div');
      paramItem.className = 'saved-param-item';

      const paramName = document.createElement('div');
      paramName.className = 'param-name';
      paramName.textContent = param.name;

      const paramValue = document.createElement('div');
      paramValue.className = 'param-value';
      paramValue.textContent = param.value;

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'delete-button';
      deleteButton.textContent = I18n.getMessage('deleteButton');
      deleteButton.addEventListener('click', () => {
        deleteCustomParam(param.name);
      });

      paramItem.appendChild(paramName);
      paramItem.appendChild(paramValue);
      paramItem.appendChild(deleteButton);

      savedCustomParams.appendChild(paramItem);
    });
  }

  function deleteCustomParam(name) {
    chrome.storage.sync.get('customParams', (result) => {
      let customParams = result.customParams || [];

      customParams = customParams.filter(param => param.name !== name);

      chrome.storage.sync.set({ customParams: customParams }, () => {
        updateCustomParamsDisplay(customParams);
      });
    });
  }
});