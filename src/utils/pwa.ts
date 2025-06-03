
// Store update preferences in local storage
const UPDATE_PREFERENCES_KEY = 'app_update_preferences';
const LAST_UPDATE_CHECK_KEY = 'app_last_update_check';

// Get update preferences from local storage
const getUpdatePreferences = () => {
  try {
    const preferences = localStorage.getItem(UPDATE_PREFERENCES_KEY);
    return preferences ? JSON.parse(preferences) : { autoUpdate: false, lastDecision: null };
  } catch (error) {
    console.error('Error reading update preferences:', error);
    return { autoUpdate: false, lastDecision: null };
  }
};

// Save update preferences to local storage
const saveUpdatePreferences = (preferences) => {
  try {
    localStorage.setItem(UPDATE_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving update preferences:', error);
  }
};

// Check if we should show update notification based on time since last check
const shouldShowUpdateNotification = () => {
  try {
    const lastCheck = localStorage.getItem(LAST_UPDATE_CHECK_KEY);
    if (!lastCheck) return true;
    
    // Only show update notification once per day if user previously declined
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const lastCheckTime = parseInt(lastCheck, 10);
    return Date.now() - lastCheckTime > oneDayInMs;
  } catch (error) {
    console.error('Error checking last update time:', error);
    return true;
  }
};

// Update the last check time
const updateLastCheckTime = () => {
  try {
    localStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating last check time:', error);
  }
};

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker with a cache-busting query parameter
      const swUrl = `/sw.js?v=${new Date().getTime()}`;
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('Service Worker registered successfully:', registration);
      
      // Get stored preferences
      const preferences = getUpdatePreferences();
      
      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('Received SW_UPDATED message from service worker');
        }
      });
      
      // Set up update handling
      setupUpdateHandling(registration, preferences);
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Handle service worker updates
const setupUpdateHandling = (registration, preferences) => {
  // Handle updates for new service workers that appear after page load
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    console.log('New service worker found:', newWorker?.state);
    
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        console.log('Service worker state changed:', newWorker.state);
        
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          handleNewServiceWorker(newWorker, preferences);
        }
      });
    }
  });
  
  // Handle the case where a service worker is already waiting when the page loads
  if (registration.waiting && navigator.serviceWorker.controller) {
    console.log('Service worker already waiting on page load');
    handleNewServiceWorker(registration.waiting, preferences);
  }
};

// Handle a new service worker that's ready to take over
const handleNewServiceWorker = (worker, preferences) => {
  // If user has opted for auto-updates, apply the update silently
  if (preferences.autoUpdate) {
    console.log('Auto-updating based on user preferences');
    applyUpdate(worker);
    return;
  }
  
  // Check if we should show the notification based on last check time
  if (!shouldShowUpdateNotification()) {
    console.log('Skipping update notification based on previous decision');
    return;
  }
  
  // Show update notification
  console.log('New version available!');
  
  // Create custom update notification instead of using window.confirm
  const updateContainer = document.createElement('div');
  updateContainer.id = 'update-notification';
  updateContainer.style.position = 'fixed';
  updateContainer.style.top = '20px';
  updateContainer.style.left = '50%';
  updateContainer.style.transform = 'translateX(-50%)';
  updateContainer.style.backgroundColor = 'white';
  updateContainer.style.padding = '16px';
  updateContainer.style.borderRadius = '8px';
  updateContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  updateContainer.style.zIndex = '9999';
  updateContainer.style.maxWidth = '90%';
  updateContainer.style.width = '320px';
  updateContainer.style.textAlign = 'center';
  
  updateContainer.innerHTML = `
    <p style="margin: 0 0 16px 0; font-weight: bold;">Uusi versio saatavilla. Päivitä nyt?</p>
    <div style="display: flex; justify-content: space-between;">
      <button id="update-later" style="padding: 8px 16px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">Myöhemmin</button>
      <button id="update-now" style="padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">Päivitä nyt</button>
    </div>
    <label style="display: block; margin-top: 12px; font-size: 14px;">
      <input type="checkbox" id="auto-update-checkbox" ${preferences.autoUpdate ? 'checked' : ''}>
      Päivitä automaattisesti jatkossa
    </label>
  `;
  
  document.body.appendChild(updateContainer);
  
  // Update now button
  document.getElementById('update-now')?.addEventListener('click', () => {
    // Save preference
    const checkbox = document.getElementById('auto-update-checkbox') as HTMLInputElement;
    const autoUpdate = checkbox ? checkbox.checked : false;
    saveUpdatePreferences({ autoUpdate, lastDecision: 'accepted' });
    
    // Remove notification
    document.body.removeChild(updateContainer);
    
    // Apply update
    applyUpdate(worker);
  });
  
  // Update later button
  document.getElementById('update-later')?.addEventListener('click', () => {
    // Save preference
    const checkbox = document.getElementById('auto-update-checkbox') as HTMLInputElement;
    const autoUpdate = checkbox ? checkbox.checked : false;
    saveUpdatePreferences({ autoUpdate, lastDecision: 'declined' });
    
    // Update last check time
    updateLastCheckTime();
    
    // Remove notification
    document.body.removeChild(updateContainer);
  });
};

// Apply the update by sending SKIP_WAITING to the service worker
const applyUpdate = (worker) => {
  console.log('Applying update...');
  
  // Set up reload listener before sending the message
  let reloadingPage = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingPage) return;
    reloadingPage = true;
    console.log('New service worker activated, reloading page');
    window.location.reload();
  });
  
  // Send the message to skip waiting
  worker.postMessage({ type: 'SKIP_WAITING' });
};

export const showInstallPrompt = () => {
  // Simple global variable to track the install prompt
  let deferredPrompt: any = null;
  
  // Get the install button once
  const installButton = document.getElementById('install-button');
  if (!installButton) return;
  
  // Hide button by default
  installButton.style.display = 'none';
  
  // Simple check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone) {
    console.log('App is already in standalone mode');
    return; // Exit early if already installed
  }
  
  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e;
    
    // Show the button
    if (installButton) {
      installButton.style.display = 'block';
    }
  });
  
  // Set up click handler if button exists
  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      
      // Disable button during prompt
      installButton.setAttribute('disabled', 'true');
      
      // Show the prompt
      deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      
      // Reset the button
      installButton.removeAttribute('disabled');
      
      if (outcome === 'accepted') {
        // Hide button after installation
        installButton.style.display = 'none';
      }
      
      // Clear the prompt
      deferredPrompt = null;
    });
  }
  
  // Hide button when app is installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (installButton) {
      installButton.style.display = 'none';
    }
    deferredPrompt = null;
  });
};

export const checkOnlineStatus = () => {
  const updateOnlineStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    console.log('Connection status:', status);
    
    // Show/hide offline indicator
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.style.display = navigator.onLine ? 'none' : 'block';
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
};
