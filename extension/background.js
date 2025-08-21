// Background script for SecondBrain extension

// Install/update listener
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('SecondBrain extension installed');
    
    // Set default configuration
    chrome.storage.sync.set({
      dashboardUrl: '',
      supabaseUrl: '',
      supabaseAnonKey: ''
    });
    
    // Open welcome page or show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SecondBrain',
      message: 'Extension installed! Click the extension icon to get started.'
    });
  }
});

// Context menu for saving tabs (optional enhancement)
chrome.contextMenus.create({
  id: 'saveCurrentTab',
  title: 'Save current tab',
  contexts: ['page']
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'saveCurrentTab') {
    // Open popup programmatically
    chrome.action.openPopup();
  }
});

// Message handler for communication between popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveTab') {
    // Handle tab saving logic here if needed
    console.log('Saving tab:', request.tabData);
    sendResponse({ success: true });
  }
  
  if (request.action === 'getCurrentTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true; // Keep message channel open for async response
  }
});

// Badge update to show number of saved tabs (optional)
async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(['savedTabsCount']);
    const count = result.savedTabsCount || 0;
    
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Failed to update badge:', error);
  }
}

// Update badge on startup
updateBadge();

// Keyboard shortcut support
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-current-tab') {
    chrome.action.openPopup();
  }
});