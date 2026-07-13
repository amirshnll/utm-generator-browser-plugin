(function (global) {
  const rawApi = global.browser || global.chrome || null;
  const isPromiseApi = typeof global.browser !== 'undefined';

  function getLastError() {
    try {
      return global.chrome && global.chrome.runtime ? global.chrome.runtime.lastError : null;
    } catch (error) {
      return null;
    }
  }

  function withChromeCallback(defaultValue, callback, fn) {
    fn(function (result) {
      if (getLastError()) {
        callback(defaultValue);
        return;
      }

      callback(result);
    });
  }

  const compat = {
    getURL(path) {
      if (rawApi && rawApi.runtime && rawApi.runtime.getURL) {
        return rawApi.runtime.getURL(path);
      }

      return path;
    },

    getUILanguage() {
      try {
        if (rawApi && rawApi.i18n && rawApi.i18n.getUILanguage) {
          return rawApi.i18n.getUILanguage() || 'en';
        }
      } catch (error) {
      }

      return 'en';
    },

    getMessage(key) {
      try {
        if (rawApi && rawApi.i18n && rawApi.i18n.getMessage) {
          return rawApi.i18n.getMessage(key) || '';
        }
      } catch (error) {
      }

      return '';
    },

    storageGet(keys, callback) {
      if (!rawApi || !rawApi.storage || !rawApi.storage.sync) {
        callback({});
        return;
      }

      if (isPromiseApi) {
        rawApi.storage.sync.get(keys).then(
          (result) => callback(result || {}),
          () => callback({})
        );
        return;
      }

      withChromeCallback({}, callback, (done) => rawApi.storage.sync.get(keys, done));
    },

    storageSet(items, callback) {
      const done = typeof callback === 'function' ? callback : function () {};

      if (!rawApi || !rawApi.storage || !rawApi.storage.sync) {
        done();
        return;
      }

      if (isPromiseApi) {
        rawApi.storage.sync.set(items).then(done, done);
        return;
      }

      withChromeCallback(null, function () {
        done();
      }, (next) => rawApi.storage.sync.set(items, next));
    },

    tabsQuery(queryInfo, callback) {
      if (!rawApi || !rawApi.tabs || !rawApi.tabs.query) {
        callback([]);
        return;
      }

      if (isPromiseApi) {
        rawApi.tabs.query(queryInfo).then(
          (tabs) => callback(tabs || []),
          () => callback([])
        );
        return;
      }

      withChromeCallback([], callback, (done) => rawApi.tabs.query(queryInfo, done));
    },

    tabsGet(tabId, callback) {
      if (!rawApi || !rawApi.tabs || !rawApi.tabs.get) {
        callback(null);
        return;
      }

      if (isPromiseApi) {
        rawApi.tabs.get(tabId).then(
          (tab) => callback(tab || null),
          () => callback(null)
        );
        return;
      }

      withChromeCallback(null, callback, (done) => rawApi.tabs.get(tabId, done));
    },

    executeScript(tabId, details, callback) {
      if (!rawApi || !rawApi.tabs || !rawApi.tabs.executeScript) {
        callback([]);
        return;
      }

      if (isPromiseApi) {
        rawApi.tabs.executeScript(tabId, details).then(
          (results) => callback(results || []),
          () => callback([])
        );
        return;
      }

      withChromeCallback([], callback, (done) => rawApi.tabs.executeScript(tabId, details, done));
    },

    openOptionsPage() {
      if (!rawApi || !rawApi.runtime || !rawApi.runtime.openOptionsPage) {
        return;
      }

      try {
        const maybePromise = rawApi.runtime.openOptionsPage();
        if (maybePromise && typeof maybePromise.catch === 'function') {
          maybePromise.catch(function () {});
        }
      } catch (error) {
      }
    }
  };

  global.ExtCompat = compat;
})(window);
