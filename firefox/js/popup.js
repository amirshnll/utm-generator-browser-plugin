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

  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

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
    browserAPI.storage.sync.get('language').then(result => {
      const language = result.language || (browserAPI.i18n ? browserAPI.i18n.getUILanguage() : 'en');
      I18n.setLanguage(language);
    }).catch(() => {
      const language = localStorage.getItem('language') || 'en';
      I18n.setLanguage(language);
    });
  }

  async function getCurrentTabUrl() {
    try {
      const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0 && tabs[0].url) {
        processTabUrl(tabs[0].url);
      }
    } catch (err) {
      console.error('Error getting tab URL:', err);
    }
  }

  function processTabUrl(currentUrl) {
    urlInput.value = currentUrl;
    try {
      const url = new URL(currentUrl);
      const params = url.searchParams;
      const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gtm_debug'];
      const inputs = {
        utm_source: utmSourceInput,
        utm_medium: utmMediumInput,
        utm_campaign: utmCampaignInput,
        utm_term: utmTermInput,
        utm_content: utmContentInput,
        gclid: gclidInput,
        gtm_debug: gtmDebugInput
      };

      keys.forEach(k => {
        const v = params.get(k);
        if (v && inputs[k]) inputs[k].value = v;
      });

      const customParams = [];
      params.forEach((value, key) => {
        if (!keys.includes(key)) {
          customParams.push({ name: key, value });
        }
      });

      customParamsContainer.innerHTML = '';
      customParamCounter = 0;
      customParams.forEach(addCustomParam);
    } catch (e) { }
  }

  function isValidUrl(url) {
    try {
      if (!url.match(/^https?:\/\//i)) url = 'http://' + url;
      const urlObj = new URL(url);
      return urlObj.hostname.includes('.');
    } catch {
      return false;
    }
  }

  function normalizeUrl(url) {
    if (!url.match(/^https?:\/\//i)) return 'https://' + url;
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
    let baseUrl = normalizeUrl(urlInput.value.trim());
    const url = new URL(baseUrl);
    const lowercase = lowercaseParamsCheckbox.checked;

    const setParam = (input, name) => {
      if (input.value.trim()) {
        const value = lowercase ? input.value.trim().toLowerCase() : input.value.trim();
        url.searchParams.set(name, value);
      }
    };

    setParam(utmSourceInput, 'utm_source');
    setParam(utmMediumInput, 'utm_medium');
    setParam(utmCampaignInput, 'utm_campaign');
    setParam(utmTermInput, 'utm_term');
    setParam(utmContentInput, 'utm_content');
    setParam(gclidInput, 'gclid');
    setParam(gtmDebugInput, 'gtm_debug');

    document.querySelectorAll('.custom-param-container').forEach(c => {
      const name = c.querySelector('.custom-param-name')?.value.trim();
      const value = c.querySelector('.custom-param-value')?.value.trim();
      if (name && value) url.searchParams.set(name, lowercase ? value.toLowerCase() : value);
    });

    const finalUrl = url.toString();
    if (finalUrl.length > 255) showLongUrlWarning();
    return finalUrl;
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

    container.append(nameInput, valueInput, removeButton);
    customParamsContainer.appendChild(container);
    customParamCounter++;
  }

  async function loadSavedCustomParams() {
    try {
      const result = await browserAPI.storage.sync.get('customParams');
      const params = result.customParams || [];
      params.forEach(addCustomParam);
    } catch { }
  }

  function copyGeneratedLink() {
    generatedLinkInput.select();
    document.execCommand('copy');
    copiedMessage.classList.add('visible');
    setTimeout(() => copiedMessage.classList.remove('visible'), 2000);
  }

  function showLongUrlWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.innerHTML = `
      <p>This URL is very long (over 255 characters). Consider using a URL shortener service like:</p>
      <ul>
        <li><a href="https://bitly.com" target="_blank" rel="noopener noreferrer nofollow">Bitly</a></li>
        <li><a href="https://tinyurl.com" target="_blank" rel="noopener noreferrer nofollow">TinyURL</a></li>
        <li><a href="https://rebrandly.com" target="_blank" rel="noopener noreferrer nofollow">Rebrandly</a></li>
      </ul>
    `;
    resultContainer.parentNode.insertBefore(warningDiv, resultContainer.nextSibling);
    setTimeout(() => warningDiv.remove(), 10000);
  }

  // ===== History =====
  async function exportHistory() {
    const existingOptions = document.querySelector('.export-options');
    if (existingOptions) {
      existingOptions.remove();
      return;
    }

    const result = await browserAPI.storage.sync.get('history');
    const history = result.history || [];

    if (!history.length) {
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
      exportOptions.remove();
    });
    document.getElementById('exportCsv').addEventListener('click', () => {
      exportAsCsv(history);
      exportOptions.remove();
    });
    document.getElementById('cancelExport').addEventListener('click', () => {
      exportOptions.remove();
    });
  }

  function exportAsJson(history) {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utm-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAsCsv(history) {
    let csv = 'URL,Timestamp\n';
    history.forEach(h => {
      csv += `"${h.link}","${new Date(h.timestamp).toLocaleString()}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utm-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveToHistory(link) {
    const result = await browserAPI.storage.sync.get('history');
    let history = result.history || [];
    history.unshift({ link, timestamp: Date.now() });
    if (history.length > 10) history = history.slice(0, 10);
    await browserAPI.storage.sync.set({ history });
    updateHistoryDisplay(history);
  }

  async function loadHistory() {
    const result = await browserAPI.storage.sync.get('history');
    updateHistoryDisplay(result.history || []);
  }

  function updateHistoryDisplay(history) {
    while (historyList.firstChild && historyList.firstChild !== noHistory)
      historyList.removeChild(historyList.firstChild);

    if (!history.length) {
      noHistory.style.display = 'block';
      return;
    }

    noHistory.style.display = 'none';
    history.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.dataset.index = i;

      const linkDiv = document.createElement('div');
      linkDiv.className = 'history-link';
      linkDiv.textContent = item.link;

      const actions = document.createElement('div');
      actions.className = 'history-actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'button button-icon';
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', () => navigator.clipboard.writeText(item.link));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'button button-icon';
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', () => deleteHistoryItem(i));

      actions.append(copyBtn, deleteBtn);
      div.append(linkDiv, actions);
      historyList.insertBefore(div, noHistory);
    });
  }

  async function deleteHistoryItem(index) {
    const result = await browserAPI.storage.sync.get('history');
    let history = result.history || [];
    history.splice(index, 1);
    await browserAPI.storage.sync.set({ history });
    updateHistoryDisplay(history);
  }

  async function clearHistory() {
    await browserAPI.storage.sync.set({ history: [] });
    updateHistoryDisplay([]);
  }

  function openSettings() {
    browserAPI.runtime.openOptionsPage();
  }
});
