document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const typingIndicator = document.getElementById('typing-indicator');
  const errorMessage = document.getElementById('error-message');
  const settingsBtn = document.getElementById('settings-btn');
  
  // Current AI message element for streaming updates
  let currentAiMessageDiv = null;

  // Set up listener for streaming messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "stream_chunk") {
      // Append chunk to the current AI message
      if (currentAiMessageDiv) {
        // Collect the full message as we stream
        if (!currentAiMessageDiv.dataset.fullMessage) {
          currentAiMessageDiv.dataset.fullMessage = '';
        }
        currentAiMessageDiv.dataset.fullMessage += message.chunk;
        
        // Format and display the message with any code blocks
        const fullMessage = currentAiMessageDiv.dataset.fullMessage;
        currentAiMessageDiv.innerHTML = formatMessageWithCode(fullMessage);
        addCopyButtonsToCodeBlocks(currentAiMessageDiv);
        
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    } else if (message.action === "stream_complete") {
      // Stream is complete, re-enable input
      hideTypingIndicator();
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    } else if (message.action === "stream_error") {
      // Handle error
      hideTypingIndicator();
      showError(message.error || 'Error processing response');
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  });

  chrome.storage.local.get(['leetcodeProblemInfo'], (result) => {
    if (result.leetcodeProblemInfo) {
      console.log('Retrieved problem info:', result.leetcodeProblemInfo);
      appendMessage(`Hello! I'm your LeetCode AI Assistant. I'm here to help you with "${result.leetcodeProblemInfo}". Ask me about problem-solving strategies, code optimization, or explanations for this challenge!`, 'ai');
    }
    else{
      appendMessage(`Hello! I'm your LeetCode AI Assistant please refresh the page`, 'ai');
    }
  });

  function appendMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    // Check if the message contains code blocks
    if (sender === 'ai' && (message.includes('```') || message.includes('`'))) {
      // Process markdown-style code blocks
      messageDiv.innerHTML = formatMessageWithCode(message);
      // Add copy buttons to code blocks
      addCopyButtonsToCodeBlocks(messageDiv);
    } else {
      messageDiv.textContent = message;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function formatMessageWithCode(message) {
    // Replace code blocks with formatted HTML
    let formatted = message;
    
    // Handle multi-line code blocks with language specification
    formatted = formatted.replace(/```(\w*)([\s\S]*?)```/g, (match, language, code) => {
      const langClass = language ? ` class="language-${language}"` : '';
      return `<div class="code-block-container">
                <pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>
              </div>`;
    });
    
    // Handle inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    return formatted;
  }
  
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  function addCopyButtonsToCodeBlocks(messageDiv) {
    const codeBlocks = messageDiv.querySelectorAll('.code-block-container');
    codeBlocks.forEach(block => {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        const code = block.querySelector('code').textContent;
        navigator.clipboard.writeText(code)
          .then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy: ', err);
          });
      });
      block.appendChild(copyBtn);
    });
  }

  function showTypingIndicator() {
    typingIndicator.classList.add('active');
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function hideTypingIndicator() {
    typingIndicator.classList.remove('active');
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    setTimeout(() => {
      errorMessage.classList.remove('visible');
    }, 5000);
  }

  async function sendMessage() {
    const query = chatInput.value.trim();
    if (!query) return;

    // Disable input and button while processing
    chatInput.disabled = true;
    sendBtn.disabled = true;

    // Clear input and append user message
    chatInput.value = '';
    appendMessage(query, 'user');
    showTypingIndicator();

    // Create AI message container for streaming updates
    currentAiMessageDiv = document.createElement('div');
    currentAiMessageDiv.className = 'chat-message ai';
    // Use a placeholder for streaming content that will be processed later
    const contentPlaceholder = document.createElement('span');
    currentAiMessageDiv.appendChild(contentPlaceholder);
    chatContainer.appendChild(currentAiMessageDiv);
    
    try {
      // Just send the message, no callback for streaming
      chrome.runtime.sendMessage({ action: 'chat_request', query: query });
      
      // Note: No callback here - we'll receive streaming updates via the message listener
    } catch (error) {
      hideTypingIndicator();
      showError('Error communicating with AI. Please check your API key in settings.');
      console.error('Error:', error);
      
      // Re-enable input and button
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  // Event Listeners
  sendBtn.addEventListener('click', sendMessage);
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Focus input on popup open
  chatInput.focus();
}); 