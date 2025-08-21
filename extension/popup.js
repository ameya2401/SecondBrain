// Configuration and state management
let config = {
  dashboardUrl: null,
  supabaseUrl: null,
  supabaseAnonKey: null,
  userEmail: null
};

// Load configuration from storage
async function loadConfig() {
  const result = await chrome.storage.sync.get(['dashboardUrl', 'supabaseUrl', 'supabaseAnonKey', 'userEmail']);
  config = {
    dashboardUrl: result.dashboardUrl || null,
    supabaseUrl: result.supabaseUrl || null,
    supabaseAnonKey: result.supabaseAnonKey || null,
    userEmail: result.userEmail || null
  };
  
  return config.dashboardUrl && config.userEmail;
}

// Save configuration to storage
async function saveConfig() {
  await chrome.storage.sync.set(config);
}

// Get current tab information
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Get favicon URL
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

// Show status message
function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

// Save tab to database via API
async function saveTabToDatabase(tabData) {
  try {
    const response = await fetch(`${config.dashboardUrl}/api/save-tab`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional: add shared secret header if configured on server
        // 'x-extension-secret': '...'
      },
      body: JSON.stringify(tabData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to save tab:', error);
    
    // Fallback: Save to local storage
    const savedTabs = JSON.parse(localStorage.getItem('savedTabs') || '[]');
    savedTabs.unshift({ ...tabData, id: Date.now().toString() });
    localStorage.setItem('savedTabs', JSON.stringify(savedTabs.slice(0, 1000))); // Keep last 1000
    
    return { success: true, fallback: true };
  }
}

// Initialize popup
async function initPopup() {
  const isConfigured = await loadConfig();
  
  if (!isConfigured) {
    document.getElementById('saveSection').style.display = 'none';
    document.getElementById('configSection').style.display = 'block';
    
    // Load saved dashboard URL if exists
    const dashboardUrl = document.getElementById('dashboardUrl');
    if (config.dashboardUrl) {
      dashboardUrl.value = config.dashboardUrl;
    }
    
    return;
  }

  // Load current tab information
  try {
    const tab = await getCurrentTab();
    
    document.getElementById('tabTitle').textContent = tab.title || 'Untitled';
    document.getElementById('tabUrl').textContent = tab.url;
    
    const favicon = getFaviconUrl(tab.url);
    if (favicon) {
      document.getElementById('tabFavicon').src = favicon;
    }

    // Auto-categorize based on URL
    const category = document.getElementById('category');
    const url = tab.url.toLowerCase();
    
    if (url.includes('youtube.com')) {
      category.value = 'YouTube';
    } else if (url.includes('linkedin.com') || url.includes('indeed.com') || url.includes('glassdoor.com')) {
      category.value = 'Job Portals';
    } else if (url.includes('openai.com') || url.includes('anthropic.com') || url.includes('huggingface.co')) {
      category.value = 'AI Tools';
    } else if (url.includes('github.com') || url.includes('stackoverflow.com') || url.includes('dev.to')) {
      category.value = 'Development';
    } else if (url.includes('medium.com') || url.includes('blog') || url.includes('news')) {
      category.value = 'Blogs';
    }

    // If email and dashboard configured, fetch categories from dashboard API
    if (config.dashboardUrl && config.userEmail) {
      try {
        const resp = await fetch(`${config.dashboardUrl}/api/categories?email=${encodeURIComponent(config.userEmail)}`);
        if (resp.ok) {
          const data = await resp.json();
          const categories = Array.isArray(data.categories) ? data.categories : [];
          const select = document.getElementById('category');
          // Keep current value, repopulate options
          const current = select.value;
          select.innerHTML = '';
          const defaultOption = document.createElement('option');
          defaultOption.value = 'Uncategorized';
          defaultOption.textContent = 'Uncategorized';
          select.appendChild(defaultOption);
          categories.forEach((c) => {
            if (c && c !== 'Uncategorized') {
              const opt = document.createElement('option');
              opt.value = c;
              opt.textContent = c;
              select.appendChild(opt);
            }
          });
          // Restore selection if present
          if (categories.includes(current)) select.value = current;
        }
      } catch (e) {
        // Ignore population errors silently
      }
    }

  } catch (error) {
    console.error('Failed to load tab info:', error);
    showStatus('Failed to load tab information', 'error');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', initPopup);

document.getElementById('saveConfig')?.addEventListener('click', async () => {
  const dashboardUrl = document.getElementById('dashboardUrl').value.trim();
  const userEmail = document.getElementById('userEmail').value.trim();
  
  if (!dashboardUrl) {
    showStatus('Please enter a dashboard URL', 'error');
    return;
  }
  if (!userEmail) {
    showStatus('Please enter your account email', 'error');
    return;
  }

  // Validate URL
  try {
    new URL(dashboardUrl);
  } catch {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  // For demo purposes, we'll set default Supabase config
  // In production, these would be fetched from your dashboard or set during setup
  config.dashboardUrl = dashboardUrl;
  config.userEmail = userEmail;
  
  await saveConfig();
  showStatus('Configuration saved!', 'success');
  
  // Reload popup to show save section
  setTimeout(() => {
    window.location.reload();
  }, 1500);
});

document.getElementById('openDashboard')?.addEventListener('click', () => {
  if (config.dashboardUrl) {
    chrome.tabs.create({ url: config.dashboardUrl });
  }
});

document.getElementById('saveTab')?.addEventListener('click', async () => {
  const saveBtn = document.getElementById('saveTab');
  const originalText = saveBtn.innerHTML;
  
  try {
    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<div class="loading"></div> Saving...';

    const tab = await getCurrentTab();
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();

    const tabData = {
      url: tab.url,
      title: tab.title || 'Untitled',
      category,
      description: description || null,
      favicon: getFaviconUrl(tab.url),
      created_at: new Date().toISOString()
    };

    const result = await saveTabToDatabase({ ...tabData, userEmail: config.userEmail });
    
    if (result.success) {
      // Show success state
      saveBtn.innerHTML = '<span class="saved-icon">✓</span> Saved!';
      saveBtn.style.background = '#10b981';
      
      if (result.fallback) {
        showStatus('Tab saved locally (dashboard offline)', 'success');
      } else {
        showStatus('Tab saved successfully!', 'success');
      }
      
      // Reset form
      document.getElementById('description').value = '';
      
      // Reset button after delay
      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
        saveBtn.style.background = '';
      }, 2000);
    }
  } catch (error) {
    console.error('Save failed:', error);
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    showStatus('Failed to save tab. Please try again.', 'error');
  }
});

// Auto-resize popup based on content
function resizePopup() {
  const body = document.body;
  const height = body.scrollHeight;
  document.body.style.height = `${Math.min(height, 600)}px`;
}

// Call resize after content loads
setTimeout(resizePopup, 100);