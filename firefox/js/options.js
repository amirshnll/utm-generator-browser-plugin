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

  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

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

      browserAPI.storage.sync.get('customParams').then(result => {
        let customParams = result.customParams || [];
        customParams = customParams.filter(param => param.name !== name);
        browserAPI.storage.sync.set({ customParams });
      }).catch(() => {
        const customParamsStr = localStorage.getItem('customParams');
        let customParams = customParamsStr ? JSON.parse(customParamsStr) : [];
        customParams = customParams.filter(param => param.name !== name);
        localStorage.setItem('customParams', JSON.stringify(customParams));
      });
    });

    paramItem.appendChild(paramNameSpan);
    paramItem.appendChild(paramValueSpan);
    paramItem.appendChild(deleteButton);
    savedCustomParams.appendChild(paramItem);
  }

  function loadSettings() {
    browserAPI.storage.sync.get('language').then(result => {
      const language = result.language || (browser.i18n ? browser.i18n.getUILanguage() : 'en');
      languageSelect.value = language;
      Array.from(languageSelect.options).forEach(option => {
        option.selected = (option.value === language);
      });
    }).catch(() => {
      const language = localStorage.getItem('language') || 'en';
      languageSelect.value = language;
      Array.from(languageSelect.options).forEach(option => {
        option.selected = (option.value === language);
      });
    });
  }

  function saveSettings() {
    const language = languageSelect.value;
    browserAPI.storage.sync.set({ language }).then(() => {
      if (typeof I18n !== 'undefined') I18n.setLanguage(language);
      showSuccessMessage();
    }).catch(() => {
      localStorage.setItem('language', language);
      if (typeof I18n !== 'undefined') I18n.setLanguage(language);
      showSuccessMessage();
    });
  }

  function showSuccessMessage() {
    let successMessage = document.querySelector('.success-message');

    if (!successMessage) {
      successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = (typeof I18n !== 'undefined' ? I18n.getMessage('saveButton') : 'Saved') + '!';
      const main = document.querySelector('.main');
      main.insertBefore(successMessage, main.firstChild);
    }

    successMessage.classList.add('visible');
    setTimeout(() => successMessage.classList.remove('visible'), 3000);
  }

  function addCustomParam() {
    const name = customParamName.value.trim();
    const value = customParamValue.value.trim();
    if (!name) return;

    browserAPI.storage.sync.get('customParams').then(result => {
      let customParams = result.customParams || [];
      const existingIndex = customParams.findIndex(param => param.name === name);

      if (existingIndex !== -1) customParams[existingIndex].value = value;
      else customParams.push({ name, value });

      browserAPI.storage.sync.set({ customParams }).then(() => {
        addParamToUI(name, value);
        customParamName.value = '';
        customParamValue.value = '';
      });
    }).catch(() => {
      const customParamsStr = localStorage.getItem('customParams');
      let customParams = customParamsStr ? JSON.parse(customParamsStr) : [];
      const existingIndex = customParams.findIndex(param => param.name === name);
      if (existingIndex !== -1) customParams[existingIndex].value = value;
      else customParams.push({ name, value });
      localStorage.setItem('customParams', JSON.stringify(customParams));
      addParamToUI(name, value);
      customParamName.value = '';
      customParamValue.value = '';
    });
  }

  function loadSavedCustomParams() {
    browserAPI.storage.sync.get('customParams').then(result => {
      const customParams = result.customParams || [];
      savedCustomParams.innerHTML = '';
      customParams.forEach(param => addParamToUI(param.name, param.value));
    }).catch(() => {
      const customParamsStr = localStorage.getItem('customParams');
      const customParams = customParamsStr ? JSON.parse(customParamsStr) : [];
      savedCustomParams.innerHTML = '';
      customParams.forEach(param => addParamToUI(param.name, param.value));
    });
  }

  function exportSettings() {
    browserAPI.storage.sync.get(['language', 'customParams']).then(result => {
      const settings = {
        language: result.language || 'en',
        customParams: result.customParams || []
      };
      const dataStr = JSON.stringify(settings, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = 'utm-settings.json';
      link.click();
    }).catch(() => {
      const settings = {
        language: localStorage.getItem('language') || 'en',
        customParams: JSON.parse(localStorage.getItem('customParams') || '[]')
      };
      const dataStr = JSON.stringify(settings, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = 'utm-settings.json';
      link.click();
    });
  }

  function updateCustomParamsDisplay(customParams) {
    savedCustomParams.innerHTML = '';
    customParams.forEach(param => {
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
      deleteButton.textContent = typeof I18n !== 'undefined' ? I18n.getMessage('deleteButton') : 'Delete';
      deleteButton.addEventListener('click', () => deleteCustomParam(param.name));

      paramItem.appendChild(paramName);
      paramItem.appendChild(paramValue);
      paramItem.appendChild(deleteButton);
      savedCustomParams.appendChild(paramItem);
    });
  }

  function deleteCustomParam(name) {
    browserAPI.storage.sync.get('customParams').then(result => {
      let customParams = result.customParams || [];
      customParams = customParams.filter(param => param.name !== name);
      browserAPI.storage.sync.set({ customParams }).then(() => {
        updateCustomParamsDisplay(customParams);
      });
    });
  }
});
