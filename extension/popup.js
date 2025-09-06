// Configuration and state management
let config = {
  dashboardUrl: null,
  userEmail: null,
  extensionSecret: null
};

// Load configuration from storage
async function loadConfig() {
  const result = await chrome.storage.sync.get(['dashboardUrl', 'userEmail', 'extensionSecret']);
  config = {
    dashboardUrl: result.dashboardUrl || null,
    userEmail: result.userEmail || null,
    extensionSecret: result.extensionSecret || null
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

// Auto-categorize based on URL
function autoCategorize(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com')) {
    return 'YouTube';
  } else if (urlLower.includes('linkedin.com') || urlLower.includes('indeed.com') || urlLower.includes('glassdoor.com')) {
    return 'Job Portals';
  } else if (urlLower.includes('openai.com') || urlLower.includes('anthropic.com') || urlLower.includes('huggingface.co') || urlLower.includes('gemini.google.com')) {
    return 'AI Tools';
  } else if (urlLower.includes('github.com') || urlLower.includes('stackoverflow.com') || urlLower.includes('dev.to')) {
    return 'Development';
  } else if (urlLower.includes('medium.com') || urlLower.includes('blog') || urlLower.includes('news')) {
    return 'Blogs';
  }
  
  return 'Uncategorized';
}

// Fetch categories from API
async function fetchCategories() {
  if (!config.dashboardUrl || !config.userEmail) return [];
  
  try {
    const response = await fetch(`${config.dashboardUrl}/api/categories?email=${encodeURIComponent(config.userEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(config.extensionSecret ? { 'x-extension-secret': config.extensionSecret } : {})
      }
    });

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data.categories) ? data.categories : [];
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
  
  return [];
}

// Populate category dropdown
async function populateCategories(currentTab) {
  const categorySelect = document.getElementById('category');
  const autoCategory = autoCategorize(currentTab.url);
  
  // Clear existing options
  categorySelect.innerHTML = '';
  
  // Add default uncategorized option
  const defaultOption = document.createElement('option');
  defaultOption.value = 'Uncategorized';
  defaultOption.textContent = 'Uncategorized';
  categorySelect.appendChild(defaultOption);
  
  // Add common categories
  const commonCategories = ['AI Tools', 'Job Portals', 'YouTube', 'Blogs', 'Development', 'Learning', 'Games'];
  
  // Fetch user's existing categories
  const userCategories = await fetchCategories();
  
  // Combine and deduplicate categories
  const allCategories = [...new Set([...commonCategories, ...userCategories])]
    .filter(cat => cat !== 'Uncategorized')
    .sort();
  
  // Add all categories to dropdown
  allCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  
  // Set auto-suggested category
  if (allCategories.includes(autoCategory)) {
    categorySelect.value = autoCategory;
  }
}

// Save tab to database via API
async function saveTabToDatabase(tabData) {
  try {
    const response = await fetch(`${config.dashboardUrl}/api/save-tab`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.extensionSecret ? { 'x-extension-secret': config.extensionSecret } : {})
      },
      body: JSON.stringify({
        ...tabData,
        userEmail: config.userEmail
      })
    });

    if (!response.ok) {
      let errorText = 'Failed to save';
      try {
        const errorData = await response.json();
        errorText = errorData.error || errorText;
      } catch {
        errorText = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorText);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to save tab:', error);
    throw error;
  }
}

// Initialize popup
async function initPopup() {
  const isConfigured = await loadConfig();

  if (!isConfigured) {
    document.getElementById('saveSection').style.display = 'none';
    document.getElementById('configSection').style.display = 'block';

    // Load saved values if they exist
    if (config.dashboardUrl) {
      document.getElementById('dashboardUrl').value = config.dashboardUrl;
    }
    if (config.userEmail) {
      document.getElementById('userEmail').value = config.userEmail;
    }
    if (config.extensionSecret) {
      document.getElementById('extensionSecret').value = config.extensionSecret;
    }

    return;
  }

  // Load current tab information
  try {
    const tab = await getCurrentTab();

    // Set tab title (editable)
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = tab.title || 'Untitled';
    titleInput.className = 'tab-title-input';
    titleInput.style.cssText = `
      width: 100%;
      border: none;
      background: transparent;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      padding: 2px 0;
      margin-bottom: 2px;
    `;
    
    const titleElement = document.getElementById('tabTitle');
    titleElement.innerHTML = '';
    titleElement.appendChild(titleInput);

    // Set tab URL (display only)
    document.getElementById('tabUrl').textContent = tab.url;

    // Set favicon
    const favicon = getFaviconUrl(tab.url);
    if (favicon) {
      const favEl = document.getElementById('tabFavicon');
      favEl.addEventListener('error', () => { favEl.style.display = 'none'; }, { once: true });
      favEl.src = favicon;
    }

    // Populate categories
    await populateCategories(tab);

  } catch (error) {
    console.error('Failed to load tab info:', error);
    showStatus('Failed to load tab information', 'error');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', initPopup);

// Save configuration
document.getElementById('saveConfig')?.addEventListener('click', async () => {
  const dashboardUrl = document.getElementById('dashboardUrl').value.trim();
  const userEmail = document.getElementById('userEmail').value.trim();
  const extensionSecret = document.getElementById('extensionSecret')?.value?.trim() || null;

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

  // Validate email
  if (!userEmail.includes('@')) {
    showStatus('Please enter a valid email', 'error');
    return;
  }

  config.dashboardUrl = dashboardUrl;
  config.userEmail = userEmail;
  config.extensionSecret = extensionSecret;

  await saveConfig();
  showStatus('Configuration saved!', 'success');

  // Reload popup to show save section
  setTimeout(() => {
    window.location.reload();
  }, 1500);
});

// Open dashboard
document.getElementById('openDashboard')?.addEventListener('click', () => {
  if (config.dashboardUrl) {
    chrome.tabs.create({ url: config.dashboardUrl });
  }
});

// Save tab
document.getElementById('saveTab')?.addEventListener('click', async () => {
  const saveBtn = document.getElementById('saveTab');
  const originalText = saveBtn.innerHTML;

  try {
    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<div class="loading"></div> Saving...';

    const tab = await getCurrentTab();
    const titleInput = document.querySelector('.tab-title-input');
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();

    const tabData = {
      url: tab.url,
      title: titleInput ? titleInput.value.trim() : (tab.title || 'Untitled'),
      category,
      description: description || null,
      favicon: getFaviconUrl(tab.url),
      created_at: new Date().toISOString()
    };

    // Validate required fields
    if (!tabData.title.trim()) {
      throw new Error('Title cannot be empty');
    }

    await saveTabToDatabase(tabData);

    // Show success state
    saveBtn.innerHTML = '<span class="saved-icon">✓</span> Saved to Dashboard!';
    saveBtn.style.background = '#10b981';

    showStatus('Website saved successfully! Check your dashboard to see it.', 'success');

    // Reset form
    document.getElementById('description').value = '';

    // Reset button after delay
    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
      saveBtn.style.background = '';
    }, 2000);

  } catch (error) {
    console.error('Save failed:', error);
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
    showStatus(`Failed to save: ${error.message}`, 'error');
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