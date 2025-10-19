document.addEventListener('DOMContentLoaded', () => {
  const utmForm = document.getElementById('utmForm');
  const urlInput = document.getElementById('url');
  const urlError = document.getElementById('urlError');
  const utmSourceInput = document.getElementById('utmSource');
  const utmMediumInput = document.getElementById('utmMedium');
  const utmCampaignInput = document.getElementById('utmCampaign');
  const utmTermInput = document.getElementById('utmTerm');
  const utmContentInput = document.getElementById('utmContent');
  const gclidInput = document.getElementById('gclid');
  const gtmDebugInput = document.getElementById('gtmDebug');
  const customParamsContainer = document.getElementById('customParamsContainer');
  const addCustomParamButton = document.getElementById('addCustomParamButton');
  const generateButton = document.getElementById('generateButton');
  const resultContainer = document.getElementById('resultContainer');
  const generatedLinkInput = document.getElementById('generatedLink');
  const copyButton = document.getElementById('copyButton');
  const copiedMessage = document.getElementById('copiedMessage');
  const historyList = document.getElementById('historyList');
  const noHistory = document.getElementById('noHistory');
  const clearHistoryButton = document.getElementById('clearHistoryButton');
  const settingsButton = document.getElementById('settingsButton');
  const getCurrentUrlButton = document.getElementById('getCurrentUrlButton');
  const lowercaseParamsCheckbox = document.getElementById('lowercaseParams');
  const exportHistoryButton = document.getElementById('exportHistoryButton');

  loadLanguageSettings();

  let customParamCounter = 0;
  loadSavedCustomParams();
  loadHistory();

  utmForm.addEventListener('submit', handleFormSubmit);
  addCustomParamButton.addEventListener('click', addCustomParam);
  copyButton.addEventListener('click', copyGeneratedLink);
  clearHistoryButton.addEventListener('click', clearHistory);
  settingsButton.addEventListener('click', openSettings);
  getCurrentUrlButton.addEventListener('click', getCurrentTabUrl);
  exportHistoryButton.addEventListener('click', exportHistory);

  function loadLanguageSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get('language', (result) => {
        const language = result.language || (chrome.i18n ? chrome.i18n.getUILanguage() : 'en') || 'en';
        I18n.setLanguage(language);
      });
    } else {
      const language = localStorage.getItem('language') || 'en';
      I18n.setLanguage(language);
    }
  }

  function getCurrentTabUrl() {
    try {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          const tab = tabs[0];
          if (!tab.url || tab.status === "loading") {
            chrome.tabs.get(tab.id, (updatedTab) => {
              if (updatedTab && updatedTab.url) {
                processTabUrl(updatedTab.url);
              } else {
                chrome.tabs.executeScript(tab.id, {
                  code: 'window.location.href'
                }, (results) => {
                  if (results && results[0]) {
                    processTabUrl(results[0]);
                  } else {
                  }
                });
              }
            });
          } else if (tab.url) {
            processTabUrl(tab.url);
          }
        } else {
        }
      });
    } catch (error) {
    }
  }

  function processTabUrl(currentUrl) {
    urlInput.value = currentUrl;

    try {
      const url = new URL(currentUrl);

      const utmSource = url.searchParams.get('utm_source');
      const utmMedium = url.searchParams.get('utm_medium');
      const utmCampaign = url.searchParams.get('utm_campaign');
      const utmTerm = url.searchParams.get('utm_term');
      const utmContent = url.searchParams.get('utm_content');
      const gclid = url.searchParams.get('gclid');
      const gtmDebug = url.searchParams.get('gtm_debug');

      if (utmSource) utmSourceInput.value = utmSource;
      if (utmMedium) utmMediumInput.value = utmMedium;
      if (utmCampaign) utmCampaignInput.value = utmCampaign;
      if (utmTerm) utmTermInput.value = utmTerm;
      if (utmContent) utmContentInput.value = utmContent;
      if (gclid) gclidInput.value = gclid;
      if (gtmDebug) gtmDebugInput.value = gtmDebug;

      const customParams = [];
      url.searchParams.forEach((value, key) => {
        if (!['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gtm_debug'].includes(key)) {
          customParams.push({ name: key, value: value });
        }
      });

      while (customParamsContainer.firstChild) {
        customParamsContainer.removeChild(customParamsContainer.firstChild);
      }
      customParamCounter = 0;

      customParams.forEach(param => {
        addCustomParam(param);
      });
    } catch (e) {
    }
  }

  function isValidUrl(url) {
    try {
      if (!url.match(/^https?:\/\//i)) {
        url = 'http://' + url;
      }

      const urlObj = new URL(url);
      return urlObj.hostname.includes('.');
    } catch (e) {
      return false;
    }
  }

  function normalizeUrl(url) {
    if (!url.match(/^https?:\/\//i)) {
      return 'https://' + url;
    }
    return url;
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const url = urlInput.value.trim();

    if (!isValidUrl(url)) {
      urlError.classList.add('visible');
      return;
    }

    urlError.classList.remove('visible');
    const generatedUrl = generateUtmLink();
    resultContainer.style.display = 'block';
    generatedLinkInput.value = generatedUrl;

    saveToHistory(generatedUrl);
  }

  function generateUtmLink() {
    let baseUrl = urlInput.value.trim();
    baseUrl = normalizeUrl(baseUrl);
    const url = new URL(baseUrl);
    const lowercase = lowercaseParamsCheckbox.checked;

    if (utmSourceInput.value.trim()) {
      const value = lowercase ? utmSourceInput.value.trim().toLowerCase() : utmSourceInput.value.trim();
      url.searchParams.set('utm_source', value);
    }

    if (utmMediumInput.value.trim()) {
      const value = lowercase ? utmMediumInput.value.trim().toLowerCase() : utmMediumInput.value.trim();
      url.searchParams.set('utm_medium', value);
    }

    if (utmCampaignInput.value.trim()) {
      const value = lowercase ? utmCampaignInput.value.trim().toLowerCase() : utmCampaignInput.value.trim();
      url.searchParams.set('utm_campaign', value);
    }

    if (utmTermInput.value.trim()) {
      const value = lowercase ? utmTermInput.value.trim().toLowerCase() : utmTermInput.value.trim();
      url.searchParams.set('utm_term', value);
    }

    if (utmContentInput.value.trim()) {
      const value = lowercase ? utmContentInput.value.trim().toLowerCase() : utmContentInput.value.trim();
      url.searchParams.set('utm_content', value);
    }

    if (gclidInput.value.trim()) {
      const value = lowercase ? gclidInput.value.trim().toLowerCase() : gclidInput.value.trim();
      url.searchParams.set('gclid', value);
    }

    if (gtmDebugInput.value.trim()) {
      const value = lowercase ? gtmDebugInput.value.trim().toLowerCase() : gtmDebugInput.value.trim();
      url.searchParams.set('gtm_debug', value);
    }

    const customParams = document.querySelectorAll('.custom-param-container');
    customParams.forEach(container => {
      const nameInput = container.querySelector('.custom-param-name');
      const valueInput = container.querySelector('.custom-param-value');

      if (nameInput && valueInput && nameInput.value.trim() && valueInput.value.trim()) {
        const name = nameInput.value.trim();
        const value = lowercase ? valueInput.value.trim().toLowerCase() : valueInput.value.trim();
        url.searchParams.set(name, value);
      }
    });

    const generatedUrl = url.toString();
    if (generatedUrl.length > 255) {
      showLongUrlWarning();
    }

    return generatedUrl;
  }

  function addCustomParam(param = {}) {
    const container = document.createElement('div');
    container.className = 'custom-param-container';
    container.id = `customParam${customParamCounter}`;

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'input-field custom-param-input custom-param-name';
    nameInput.placeholder = I18n.getMessage('customParamNamePlaceholder');
    nameInput.value = param.name || '';

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'input-field custom-param-input custom-param-value';
    valueInput.placeholder = I18n.getMessage('customParamValuePlaceholder');
    valueInput.value = param.value || '';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'button remove-param-button';
    removeButton.innerHTML = '&times;';
    removeButton.addEventListener('click', () => {
      customParamsContainer.removeChild(container);
    });

    container.appendChild(nameInput);
    container.appendChild(valueInput);
    container.appendChild(removeButton);

    customParamsContainer.appendChild(container);
    customParamCounter++;
  }

  function loadSavedCustomParams() {
    chrome.storage.sync.get('customParams', (result) => {
      const customParams = result.customParams || [];
      customParams.forEach(param => {
        addCustomParam(param);
      });
    });
  }

  function copyGeneratedLink() {
    generatedLinkInput.select();
    document.execCommand('copy');

    copiedMessage.classList.add('visible');
    setTimeout(() => {
      copiedMessage.classList.remove('visible');
    }, 2000);
  }

  function showLongUrlWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.innerHTML = `
      <p>${I18n.getMessage('longUrlWarningMessage')}</p>
      <ul>
        <li><a href="https://bitly.com" target="_blank" rel="noopener noreferrer nofollow">Bitly</a></li>
        <li><a href="https://tinyurl.com" target="_blank" rel="noopener noreferrer nofollow">TinyURL</a></li>
        <li><a href="https://rebrandly.com" target="_blank" rel="noopener noreferrer nofollow">Rebrandly</a></li>
      </ul>
    `;

    resultContainer.parentNode.insertBefore(warningDiv, resultContainer.nextSibling);

    setTimeout(() => {
      if (warningDiv.parentNode) {
        warningDiv.parentNode.removeChild(warningDiv);
      }
    }, 10000);
  }

  function exportHistory() {
    const existingOptions = document.querySelector('.export-options');
    if (existingOptions) {
      existingOptions.parentNode.removeChild(existingOptions);
      return;
    }

    chrome.storage.sync.get('history', (result) => {
      const history = result.history || [];

      if (history.length === 0) {
        alert('No history to export');
        return;
      }

      const exportOptions = document.createElement('div');
      exportOptions.className = 'export-options';
      exportOptions.innerHTML = `
        <div class="export-title">Export Format</div>
        <button type="button" id="exportJson" class="button button-secondary">JSON</button>
        <button type="button" id="exportCsv" class="button button-secondary">CSV</button>
        <button type="button" id="cancelExport" class="button">Cancel</button>
      `;

      exportHistoryButton.parentNode.insertBefore(exportOptions, exportHistoryButton.nextSibling);

      document.getElementById('exportJson').addEventListener('click', () => {
        exportAsJson(history);
        exportOptions.parentNode.removeChild(exportOptions);
      });

      document.getElementById('exportCsv').addEventListener('click', () => {
        exportAsCsv(history);
        exportOptions.parentNode.removeChild(exportOptions);
      });

      document.getElementById('cancelExport').addEventListener('click', () => {
        exportOptions.parentNode.removeChild(exportOptions);
      });
    });
  }

  function exportAsJson(history) {
    const jsonData = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `utm-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function exportAsCsv(history) {
    let csvContent = 'URL,Timestamp\n';

    history.forEach(item => {
      const timestamp = new Date(item.timestamp).toLocaleString();
      csvContent += `"${item.link}","${timestamp}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `utm-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function saveToHistory(link) {
    chrome.storage.sync.get('history', (result) => {
      let history = result.history || [];

      history.unshift({
        link: link,
        timestamp: Date.now()
      });

      if (history.length > 10) {
        history = history.slice(0, 10);
      }

      chrome.storage.sync.set({ history: history }, () => {
        updateHistoryDisplay(history);
      });
    });
  }
  function loadHistory() {
    chrome.storage.sync.get('history', (result) => {
      const history = result.history || [];
      updateHistoryDisplay(history);
    });
  }

  function updateHistoryDisplay(history) {
    while (historyList.firstChild && historyList.firstChild !== noHistory) {
      historyList.removeChild(historyList.firstChild);
    }

    if (history.length === 0) {
      noHistory.style.display = 'block';
      return;
    }

    noHistory.style.display = 'none';

    history.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.dataset.index = index;

      const linkText = document.createElement('div');
      linkText.className = 'history-link';
      linkText.textContent = item.link;
      linkText.title = item.link;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'history-actions';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'button button-icon';
      copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
      copyBtn.title = I18n.getMessage('copyButton');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(item.link).then(() => {
          const originalInnerHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
          setTimeout(() => {
            copyBtn.innerHTML = originalInnerHTML;
          }, 1000);
        });
      });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'button button-icon';
      editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
      editBtn.title = 'Edit';
      editBtn.addEventListener('click', () => {
        editHistoryItem(index, item);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'button button-icon';
      deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16"><path fill="#fff" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
      deleteBtn.title = 'Delete';
      deleteBtn.style.backgroundColor = '#b00020';

      deleteBtn.addEventListener('click', () => {
        deleteHistoryItem(index);
      });

      actionsDiv.appendChild(copyBtn);
      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      historyItem.appendChild(linkText);
      historyItem.appendChild(actionsDiv);

      historyList.insertBefore(historyItem, noHistory);
    });
  }

  function editHistoryItem(index, item) {
    try {
      const url = new URL(item.link);

      urlInput.value = url.origin + url.pathname;

      utmSourceInput.value = '';
      utmMediumInput.value = '';
      utmCampaignInput.value = '';
      utmTermInput.value = '';
      utmContentInput.value = '';
      gclidInput.value = '';
      gtmDebugInput.value = '';

      while (customParamsContainer.firstChild) {
        customParamsContainer.removeChild(customParamsContainer.firstChild);
      }
      customParamCounter = 0;

      const utmSource = url.searchParams.get('utm_source');
      const utmMedium = url.searchParams.get('utm_medium');
      const utmCampaign = url.searchParams.get('utm_campaign');
      const utmTerm = url.searchParams.get('utm_term');
      const utmContent = url.searchParams.get('utm_content');
      const gclid = url.searchParams.get('gclid');
      const gtmDebug = url.searchParams.get('gtm_debug');

      if (utmSource) utmSourceInput.value = utmSource;
      if (utmMedium) utmMediumInput.value = utmMedium;
      if (utmCampaign) utmCampaignInput.value = utmCampaign;
      if (utmTerm) utmTermInput.value = utmTerm;
      if (utmContent) utmContentInput.value = utmContent;
      if (gclid) gclidInput.value = gclid;
      if (gtmDebug) gtmDebugInput.value = gtmDebug;

      const standardParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gtm_debug'];
      url.searchParams.forEach((value, key) => {
        if (!standardParams.includes(key)) {
          addCustomParam({ name: key, value: value });
        }
      });

      window.scrollTo(0, 0);

      const message = document.createElement('div');
      message.className = 'info-message';
      message.textContent = 'Editing link from history. Generate to update.';
      utmForm.insertBefore(message, utmForm.firstChild);

      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 5000);

      deleteHistoryItem(index, false);
    } catch (e) {
    }
  }

  function deleteHistoryItem(index, updateDisplay = true) {
    chrome.storage.sync.get('history', (result) => {
      let history = result.history || [];

      if (index >= 0 && index < history.length) {
        history.splice(index, 1);

        chrome.storage.sync.set({ history: history }, () => {
          if (updateDisplay) {
            updateHistoryDisplay(history);
          }
        });
      }
    });
  }

  function clearHistory() {
    chrome.storage.sync.set({ history: [] }, () => {
      updateHistoryDisplay([]);
    });
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }
});