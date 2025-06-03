
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
  // Store the deferredPrompt at module level to prevent garbage collection
  let deferredPrompt: any = null;
  let installButtonAttached = false;
  let checkInstalledIntervalId: number | null = null;
  
  // Detect iOS device (which has different install behavior)
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };
  
  // More robust detection of standalone mode across browsers
  const isInStandaloneMode = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true // iOS Safari
    );
  };
  
  // Track installation state in localStorage to prevent flickering
  const isAppInstalled = () => {
    try {
      return (
        localStorage.getItem('app_installed') === 'true' ||
        isInStandaloneMode() ||
        document.referrer.includes('android-app://')
      );
    } catch {
      return false;
    }
  };
  
  // Setup button visibility with iOS-specific handling
  const setupInstallButton = () => {
    const installButton = document.getElementById('install-button');
    if (!installButton) return;
    
    // Don't show install button if already installed
    if (isAppInstalled()) {
      console.log('App appears to be installed, hiding install button');
      installButton.style.display = 'none';
      // Stop checking for installed status if we detect it's installed
      if (checkInstalledIntervalId) {
        window.clearInterval(checkInstalledIntervalId);
        checkInstalledIntervalId = null;
      }
      return;
    }
    
    // Special case for iOS which doesn't support beforeinstallprompt
    if (isIOS()) {
      console.log('iOS device detected, showing iOS install instructions');
      installButton.style.display = 'block';
      
      // For iOS, change button to show special instructions
      if (!installButtonAttached) {
        installButtonAttached = true;
        installButton.addEventListener('click', () => {
          // Either show a modal with iOS install instructions or change button text
          alert('Asenna sovellus napauttamalla Jaa-kuvaketta ja valitsemalla "Lisää Koti-näyttöön"');
        });
      }
      return;
    }
    
    // For other platforms that support beforeinstallprompt
    if (deferredPrompt) {
      console.log('Install prompt available, showing install button');
      installButton.style.display = 'block';
      
      // Only attach listener once to prevent multiple handlers
      if (!installButtonAttached) {
        installButtonAttached = true;
        installButton.addEventListener('click', handleInstallClick);
      }
    } else {
      // Hide if no prompt available
      installButton.style.display = 'none';
    }
  };
  
  // Handle installation click
  const handleInstallClick = async () => {
    const installButton = document.getElementById('install-button');
    if (!deferredPrompt || !installButton) return;
    
    // Disable button during prompt to prevent multiple clicks
    installButton.setAttribute('disabled', 'true');
    installButton.textContent = 'Asennetaan...';
    
    try {
      // Log for debugging
      console.log('Showing install prompt to user');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        localStorage.setItem('app_installed', 'true');
        installButton.style.display = 'none';
        
        // Ensure we refresh display state after installation
        setTimeout(() => {
          if (isInStandaloneMode()) {
            // If now in standalone mode, might want to reload for full PWA experience
            window.location.reload();
          }
        }, 1000);
      } else {
        // Re-enable button if declined
        installButton.removeAttribute('disabled');
        installButton.textContent = 'Asenna sovellus';
      }
    } catch (err) {
      console.error('Installation prompt error:', err);
      installButton.removeAttribute('disabled');
      installButton.textContent = 'Asenna sovellus';
    }
    
    deferredPrompt = null;
  };
  
  // Periodically check if app has been installed
  // This helps catch cases where the appinstalled event might not fire
  const startInstalledCheck = () => {
    if (checkInstalledIntervalId) return; // Already running
    
    checkInstalledIntervalId = window.setInterval(() => {
      if (isAppInstalled()) {
        console.log('App installation detected by interval check');
        const installButton = document.getElementById('install-button');
        if (installButton) installButton.style.display = 'none';
        
        // Stop checking once installed
        if (checkInstalledIntervalId) {
          window.clearInterval(checkInstalledIntervalId);
          checkInstalledIntervalId = null;
        }
      }
    }, 2000) as unknown as number;
  };
  
  // Check installed status when page loads
  if (isAppInstalled()) {
    console.log('App already installed on page load');
  } else {
    // Start checking periodically
    startInstalledCheck();
  }
  
  // Initial setup
  setupInstallButton();
  
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;
    
    // Setup button when prompt is available
    setupInstallButton();
  });

  // Monitor display mode changes
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    console.log('Display mode changed, matches standalone:', e.matches);
    if (e.matches) {
      localStorage.setItem('app_installed', 'true');
    }
    setupInstallButton();
  });

  window.addEventListener('appinstalled', (e) => {
    console.log('PWA was installed', e);
    localStorage.setItem('app_installed', 'true');
    deferredPrompt = null;
    setupInstallButton();
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
