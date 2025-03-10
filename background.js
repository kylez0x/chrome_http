// 存储代理配置
let proxyConfig = {
    enabled: false,
    server: '',
    port: '',
    username: '',
    password: ''
  };
  

  chrome.storage.local.get(['proxyConfig'], (result) => {
    if (result.proxyConfig) {
      proxyConfig = result.proxyConfig;
      if (proxyConfig.enabled) {
        applyProxySettings();
      }
    }
  });
  

  function applyProxySettings() {
    if (!proxyConfig.enabled || !proxyConfig.server || !proxyConfig.port) {

      chrome.proxy.settings.clear({ scope: 'regular' });
      return;
    }
  

    const config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "http",
          host: proxyConfig.server,
          port: parseInt(proxyConfig.port)
        },
        bypassList: []
      }
    };
  
    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      console.log('代理设置已应用');
    });
  }
  

  chrome.webRequest.onAuthRequired.addListener(
    (details, callback) => {
      if (proxyConfig.enabled && proxyConfig.username && proxyConfig.password) {
        callback({
          authCredentials: {
            username: proxyConfig.username,
            password: proxyConfig.password
          }
        });
      } else {
        callback();
      }
    },
    { urls: ["<all_urls>"] },
    ['asyncBlocking']
  );
  

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateProxy') {
      proxyConfig = message.config;

      chrome.storage.local.set({ proxyConfig });
      
      if (proxyConfig.enabled) {
        applyProxySettings();
      } else {
        chrome.proxy.settings.clear({ scope: 'regular' });
      }
      
      sendResponse({ success: true });
    } else if (message.action === 'getProxyConfig') {
      sendResponse({ config: proxyConfig });
    } else if (message.action === 'toggleProxy') {
      if (message.enabled) {
        enableProxy();
      } else {
        disableProxy();
      }
    }
    return true;
  });

// 初始化代理设置
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({
    proxyEnabled: false,
    proxyConfig: {
      host: '',
      port: 0,
      username: '',
      password: ''
    }
  });
});

// 启用代理
function enableProxy() {
  chrome.storage.local.get(['proxyConfig'], function(result) {
    const config = result.proxyConfig;
    if (config && config.host && config.port) {
      chrome.proxy.settings.set({
        value: {
          mode: 'fixed_servers',
          rules: {
            singleProxy: {
              scheme: 'http',
              host: config.host,
              port: parseInt(config.port)
            },
            bypassList: []
          }
        },
        scope: 'regular'
      }, function() {
        console.log('代理已启用:', config.host + ':' + config.port);
      });
      
      // 设置认证处理器
      if (config.username && config.password) {
        setupAuthHandler(config);
      }
    }
  });
}

// 禁用代理
function disableProxy() {
  chrome.proxy.settings.set({
    value: {mode: "direct"},
    scope: 'regular'
  }, function() {
    console.log('代理已禁用');
  });
  
  // 移除认证处理器
  removeAuthHandler();
}

// 设置认证处理器
function setupAuthHandler(config) {
  // 移除旧的处理器（如果存在）
  removeAuthHandler();
  
  // 添加新的处理器
  chrome.webRequest.onAuthRequired.addListener(
    authHandler,
    {urls: ["<all_urls>"]},
    ['blocking']
  );
  
  console.log('认证处理器已设置');
}

// 移除认证处理器
function removeAuthHandler() {
  if (chrome.webRequest.onAuthRequired.hasListener(authHandler)) {
    chrome.webRequest.onAuthRequired.removeListener(authHandler);
    console.log('认证处理器已移除');
  }
}

// 认证处理函数
function authHandler(details) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['proxyConfig'], function(result) {
      const config = result.proxyConfig || {};
      resolve({
        authCredentials: {
          username: config.username || '',
          password: config.password || ''
        }
      });
    });
  });
}