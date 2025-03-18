document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');
  const togglePasswordBtn = document.getElementById('togglePassword');

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyInput.setAttribute('type', type);
    togglePasswordBtn.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
  });

  // Save options to chrome.storage
  function saveOptions() {
    const apiKey = apiKeyInput.value.trim();
    const status = document.getElementById('status');

    // Show loading state
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    chrome.storage.sync.set({
      huggingface_api_key: apiKey
    }, function() {
      // Update status to let user know options were saved
      status.textContent = 'Settings saved successfully!';
      status.className = 'status success';
      status.style.display = 'block';

      // Reset button state
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings';

      // Hide status after 3 seconds
      setTimeout(function() {
        status.style.display = 'none';
      }, 3000);
    });
  }

  // Restore options from chrome.storage
  function restoreOptions() {
    chrome.storage.sync.get({
      huggingface_api_key: ''
    }, function(items) {
      apiKeyInput.value = items.huggingface_api_key;
    });
  }

  // Event Listeners
  saveButton.addEventListener('click', saveOptions);

  // Save on Enter key
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveOptions();
    }
  });

  // Validate API key format before saving
  apiKeyInput.addEventListener('input', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey && !apiKey.startsWith('hf_')) {
      status.textContent = 'Warning: API key should start with "hf_"';
      status.className = 'status error';
      status.style.display = 'block';
    } else {
      status.style.display = 'none';
    }
  });

  // Restore options when page loads
  restoreOptions();

  // Focus API key input on page load
  apiKeyInput.focus();
}); 