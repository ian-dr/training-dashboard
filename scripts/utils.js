// Utility Functions

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format a date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to readable string (e.g., "Jan 15, 2025")
 * @param {Date|string} date
 * @returns {string}
 */
function formatDateReadable(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a timestamp to readable date and time
 * @param {number} timestamp
 * @returns {string}
 */
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const dateStr = formatDateReadable(date);
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} at ${timeStr}`;
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {string} type - 'success' or 'error'
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, duration);
}

// Add slideOut animation
if (!document.querySelector('style#toast-animation')) {
  const style = document.createElement('style');
  style.id = 'toast-animation';
  style.textContent = `
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Show a confirmation dialog
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirm</h3>
        </div>
        <p>${message}</p>
        <div class="btn-group mt-3">
          <button class="btn btn-danger" id="confirm-yes">Yes</button>
          <button class="btn btn-outline" id="confirm-no">No</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const cleanup = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('#confirm-yes').addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    modal.querySelector('#confirm-no').addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
        resolve(false);
      }
    });
  });
}

/**
 * Show loading overlay
 */
function showLoading() {
  if (document.querySelector('.loading-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="loading"></div>';
  document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    document.body.removeChild(overlay);
  }
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Download a file
 * @param {string} content
 * @param {string} filename
 * @param {string} type
 */
function downloadFile(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Safely parse JSON
 * @param {string} jsonString
 * @param {*} defaultValue
 * @returns {*}
 */
function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('JSON parse error:', e);
    return defaultValue;
  }
}

/**
 * Validate required fields in an object
 * @param {Object} obj
 * @param {Array<string>} requiredFields
 * @returns {boolean}
 */
function validateRequired(obj, requiredFields) {
  for (const field of requiredFields) {
    if (!obj[field]) {
      return false;
    }
  }
  return true;
}

/**
 * Clone an object deeply
 * @param {*} obj
 * @returns {*}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get query parameter from URL
 * @param {string} param
 * @returns {string|null}
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Set query parameter in URL without reload
 * @param {string} param
 * @param {string} value
 */
function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format minutes to hours and minutes
 * @param {number} minutes
 * @returns {string}
 */
function formatMinutesToHours(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

/**
 * Auto-resize textarea to fit content
 * @param {HTMLTextAreaElement} textarea
 */
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * Initialize all textareas with auto-resize
 */
function initAutoResizeTextareas() {
  document.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('input', function() {
      autoResizeTextarea(this);
    });
    // Initial resize
    autoResizeTextarea(textarea);
  });
}

/**
 * Dark Mode - Always On
 */
function initTheme() {
  // Always set to dark mode
  document.documentElement.setAttribute('data-theme', 'dark');
}

// Auto-initialize theme on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
}
