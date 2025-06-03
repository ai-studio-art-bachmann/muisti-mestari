
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
    console.log('PWA_UPDATE: Auto-updating based on user preferences.');
    applyUpdate(worker);
    return;
  }

  // Check if we should show the notification based on last check time
  if (!shouldShowUpdateNotification()) {
    console.log('PWA_UPDATE: Skipping update notification based on previous decision or frequency.');
    return;
  }

  // Prevent duplicate popups
  if (document.getElementById('update-notification')) {
    console.log('PWA_UPDATE: Update notification already visible. Skipping creation.');
    return;
  }

  console.log('PWA_UPDATE: New version available! Creating update notification.');

  const updateContainer = document.createElement('div');
  updateContainer.id = 'update-notification';
  // ... (styling for updateContainer remains the same)
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
  console.log('PWA_UPDATE: Update notification appended to body.');

  // Get buttons and checkbox from within the created container for reliability
  const updateNowButton = updateContainer.querySelector('#update-now') as HTMLButtonElement | null;
  const updateLaterButton = updateContainer.querySelector('#update-later') as HTMLButtonElement | null;
  const autoUpdateCheckbox = updateContainer.querySelector('#auto-update-checkbox') as HTMLInputElement | null;

  if (updateNowButton) {
    updateNowButton.addEventListener('click', () => {
      console.log('PWA_UPDATE: "Päivitä nyt" button clicked.');
      try {
        const autoUpdate = autoUpdateCheckbox ? autoUpdateCheckbox.checked : false;
        saveUpdatePreferences({ autoUpdate, lastDecision: 'accepted' });
        console.log('PWA_UPDATE: Preferences saved (accepted, autoUpdate:', autoUpdate, ')');
        applyUpdate(worker);
      } catch (error) {
        console.error('PWA_UPDATE: Error in "Päivitä nyt" click handler:', error);
      } finally {
        if (updateContainer.parentNode === document.body) {
          document.body.removeChild(updateContainer);
          console.log('PWA_UPDATE: Notification removed via "Päivitä nyt" finally block.');
        }
      }
    });
  } else {
    console.error('PWA_UPDATE: "Päivitä nyt" button not found in notification DOM.');
  }

  if (updateLaterButton) {
    updateLaterButton.addEventListener('click', () => {
      console.log('PWA_UPDATE: "Myöhemmin" button clicked.');
      try {
        const autoUpdate = autoUpdateCheckbox ? autoUpdateCheckbox.checked : false;
        saveUpdatePreferences({ autoUpdate, lastDecision: 'declined' });
        updateLastCheckTime();
        console.log('PWA_UPDATE: Preferences saved (declined, autoUpdate:', autoUpdate, '), last check time updated.');
      } catch (error) {
        console.error('PWA_UPDATE: Error in "Myöhemmin" click handler:', error);
      } finally {
        if (updateContainer.parentNode === document.body) {
          document.body.removeChild(updateContainer);
          console.log('PWA_UPDATE: Notification removed via "Myöhemmin" finally block.');
        }
      }
    });
  } else {
    console.error('PWA_UPDATE: "Myöhemmin" button not found in notification DOM.');
  }
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

// Module-level variable to store the deferred prompt event
let deferredInstallPromptEvent: any = null;
// Flag to ensure event listeners are set up only once
let installPromptListenersAttached = false;

export const showInstallPrompt = () => {
  const installButton = document.getElementById('install-button');

  if (!installButton) {
    console.warn('PWA install button not found (ID: install-button). Cannot initialize install prompt.');
    return;
  }

  // Function to update button visibility based on current state
  const updateButtonVisibility = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (deferredInstallPromptEvent && !isStandalone) {
      installButton.style.display = 'block';
      console.log('PWA_INSTALL: Install button VISIBLE.');
    } else {
      installButton.style.display = 'none';
      console.log(`PWA_INSTALL: Install button HIDDEN. Standalone: ${isStandalone}, Prompt available: ${!!deferredInstallPromptEvent}`);
    }
  };

  // Initially hide the button, then update based on current conditions
  installButton.style.display = 'none';
  // Check current status on initialization (e.g. if already standalone or prompt was captured before this call)
  updateButtonVisibility(); 

  if (installPromptListenersAttached) {
    console.log('PWA_INSTALL: Listeners already attached. Button visibility updated.');
    return; // Avoid re-attaching listeners
  }

  console.log('PWA_INSTALL: Setting up PWA install prompt event listeners.');

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA_INSTALL: beforeinstallprompt event fired.');
    // Prevent the browser's default install prompt on some devices
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredInstallPromptEvent = e;
    // Update the visibility of the install button
    updateButtonVisibility();
  });

  installButton.addEventListener('click', async () => {
    console.log('PWA_INSTALL: Install button clicked.');
    if (!deferredInstallPromptEvent) {
      console.log('PWA_INSTALL: No deferred install prompt available to show.');
      return;
    }

    // Disable button to prevent multiple clicks while the prompt is open
    installButton.setAttribute('disabled', 'true');
    console.log('PWA_INSTALL: Install button disabled.');

    try {
      // Show the install prompt
      deferredInstallPromptEvent.prompt();
      console.log('PWA_INSTALL: Install prompt shown to user.');

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredInstallPromptEvent.userChoice;
      console.log(`PWA_INSTALL: User choice for PWA install: ${outcome}`);

      if (outcome === 'accepted') {
        console.log('PWA_INSTALL: User accepted the PWA installation.');
        // The 'appinstalled' event will handle hiding the button and clearing the prompt event.
      } else {
        console.log('PWA_INSTALL: User dismissed the PWA installation.');
        // If dismissed, do not clear deferredInstallPromptEvent here immediately.
        // Some browsers might invalidate it, others might allow re-prompting.
        // A new 'beforeinstallprompt' event will overwrite it if one occurs.
      }
    } catch (error) {
      console.error('PWA_INSTALL: Error during PWA install prompt:', error);
    } finally {
      // Re-enable the button regardless of the outcome
      installButton.removeAttribute('disabled');
      console.log('PWA_INSTALL: Install button re-enabled.');
      // Update button visibility, as the prompt might not be available anymore (especially if dismissed)
      // or app might be in the process of being installed.
      updateButtonVisibility();
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA_INSTALL: appinstalled event fired. PWA has been installed.');
    // Clear the stored event
    deferredInstallPromptEvent = null;
    // Update the button visibility (it should hide)
    updateButtonVisibility();
  });

  installPromptListenersAttached = true;
  console.log('PWA_INSTALL: PWA install prompt listeners successfully attached.');
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
