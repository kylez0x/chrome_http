document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggle-proxy');
    const saveButton = document.getElementById('save-config');
    const statusDiv = document.getElementById('proxy-status');
    const hostInput = document.getElementById('proxy-host');
    const portInput = document.getElementById('proxy-port');
    const usernameInput = document.getElementById('proxy-username');
    const passwordInput = document.getElementById('proxy-password');
    
    // 加载当前配置
    loadConfig();
    
    // 保存配置
    saveButton.addEventListener('click', function() {
      const config = {
        host: hostInput.value.trim(),
        port: parseInt(portInput.value) || 0,
        username: usernameInput.value.trim(),
        password: passwordInput.value.trim()
      };
      
      // 验证配置
      if (!config.host || !config.port) {
        alert('请输入代理服务器地址和端口！');
        return;
      }
      
      // 保存配置
      chrome.storage.local.set({proxyConfig: config}, function() {
        alert('配置已保存！');
      });
    });
    
    // 切换代理状态
    toggleButton.addEventListener('click', function() {
      chrome.storage.local.get(['proxyEnabled', 'proxyConfig'], function(result) {
        const config = result.proxyConfig || {};
        
        // 检查是否有配置
        if (!result.proxyEnabled && (!config.host || !config.port)) {
          alert('请先配置代理服务器信息！');
          return;
        }
        
        const newState = !result.proxyEnabled;
        chrome.storage.local.set({proxyEnabled: newState}, function() {
          updateUI(newState);
          // 发送消息给后台脚本更新代理设置
          chrome.runtime.sendMessage({action: 'toggleProxy', enabled: newState});
        });
      });
    });
    
    // 加载配置并更新UI
    function loadConfig() {
      chrome.storage.local.get(['proxyEnabled', 'proxyConfig'], function(result) {
        const enabled = result.proxyEnabled || false;
        const config = result.proxyConfig || {};
        
        // 更新表单
        hostInput.value = config.host || '';
        portInput.value = config.port || '';
        usernameInput.value = config.username || '';
        passwordInput.value = config.password || '';
        
        // 更新状态
        updateUI(enabled);
      });
    }
    
    // 更新UI状态
    function updateUI(enabled) {
      statusDiv.textContent = '代理状态: ' + (enabled ? '已启用' : '未启用');
      statusDiv.style.backgroundColor = enabled ? '#e6f4ea' : '#f1f1f1';
      toggleButton.textContent = enabled ? '禁用代理' : '启用代理';
      toggleButton.style.backgroundColor = enabled ? '#db4437' : '#4285f4';
    }
  });