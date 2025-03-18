document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const typingIndicator = document.getElementById('typing-indicator');
  const errorMessage = document.getElementById('error-message');
  const settingsBtn = document.getElementById('settings-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const solveBtn = document.getElementById('solve-btn');
  
  // Current AI message element for streaming updates
  let currentAiMessageDiv = null;

  // Initialize theme
  chrome.storage.local.get(['darkTheme'], (result) => {
    if (result.darkTheme) {
      document.documentElement.classList.add('dark-theme');
    }
  });

  // Theme toggle functionality
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-theme');
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    chrome.storage.local.set({ darkTheme: isDarkTheme });
  });

  // Auto-resize textarea
  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  }

  chatInput.addEventListener('input', adjustTextareaHeight);

  // "Solve This" button functionality
  solveBtn.addEventListener('click', () => {
    // Clear any existing input
    chatInput.value = '';
    
    // Send a pre-defined message to solve the current problem
    const solveMessage = "Please solve this LeetCode problem step by step. Provide a detailed explanation of your approach, the algorithm, and the code solution.";
    
    // Append user message
    appendMessage(solveMessage, 'user');
    
    // Disable input and button while processing
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    showTypingIndicator();
    
    // Create AI message container for streaming updates
    currentAiMessageDiv = document.createElement('div');
    currentAiMessageDiv.className = 'chat-message ai';
    const contentPlaceholder = document.createElement('span');
    currentAiMessageDiv.appendChild(contentPlaceholder);
    chatContainer.appendChild(currentAiMessageDiv);
    
    try {
      // Send the message to background script
      chrome.runtime.sendMessage({ action: 'chat_request', query: solveMessage });
    } catch (error) {
      hideTypingIndicator();
      showError('Error communicating with AI. Please check your API key in settings.');
      console.error('Error:', error);
      
      // Re-enable input and button
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  });

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
      // Add hover effects
      addHoverEffectsToCodeBlocks();
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
    
    // Handle inline code with copyable feature
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code copyable" title="Click to copy">$1</code>');
    
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
    // Add copy button to multi-line code blocks
    const codeBlocks = messageDiv.querySelectorAll('.code-block-container');
    
    if (codeBlocks.length > 1) {
      // If there are multiple code blocks, add a "Copy All" button
      const copyAllBtn = document.createElement('button');
      copyAllBtn.className = 'copy-all-btn';
      copyAllBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy All Code';
      copyAllBtn.addEventListener('click', () => {
        const allCode = Array.from(codeBlocks)
          .map(block => block.querySelector('code').textContent)
          .join('\n\n');
        
        navigator.clipboard.writeText(allCode)
          .then(() => {
            // Visual feedback
            copyAllBtn.classList.add('copied');
            copyAllBtn.innerHTML = '<svg class="copy-success-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied All!';
            
            // Reset after delay
            setTimeout(() => {
              copyAllBtn.classList.remove('copied');
              copyAllBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy All Code';
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy all code:', err);
          });
      });
      
      // Insert at the beginning of the message div (before the first code block)
      if (messageDiv.firstChild) {
        messageDiv.insertBefore(copyAllBtn, messageDiv.firstChild);
      } else {
        messageDiv.appendChild(copyAllBtn);
      }
    }
    
    // Add individual copy buttons to each code block
    codeBlocks.forEach(block => {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
      copyBtn.title = "Copy code";
      
      copyBtn.addEventListener('click', () => {
        const code = block.querySelector('code').textContent;
        navigator.clipboard.writeText(code)
          .then(() => {
            // Visual feedback - animation
            block.classList.add('highlight-animation');
            setTimeout(() => block.classList.remove('highlight-animation'), 1500);
            
            // Update button state
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<svg class="copy-success-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            copyBtn.title = "Copied!";
            
            // Reset after delay
            setTimeout(() => {
              copyBtn.classList.remove('copied');
              copyBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
              copyBtn.title = "Copy code";
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy:', err);
          });
      });
      
      block.appendChild(copyBtn);
    });
    
    // Make inline code copyable
    const inlineCodeElements = messageDiv.querySelectorAll('.inline-code.copyable');
    inlineCodeElements.forEach(code => {
      code.addEventListener('click', () => {
        const textToCopy = code.textContent;
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            // Flash effect
            const originalBackground = window.getComputedStyle(code).backgroundColor;
            code.style.backgroundColor = 'var(--copy-btn-success-bg)';
            
            // Show temporary tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'copy-tooltip';
            tooltip.textContent = 'Copied!';
            code.appendChild(tooltip);
            
            // Reset after delay
            setTimeout(() => {
              code.style.backgroundColor = originalBackground;
              if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
              }
            }, 1500);
          })
          .catch(err => {
            console.error('Failed to copy inline code:', err);
          });
      });
    });
  }
  
  // Keyboard shortcut support for copying code
  document.addEventListener('keydown', (e) => {
    // Ctrl+C or Cmd+C when code block is focused/selected
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      const selection = window.getSelection();
      if (selection.toString().length > 0) {
        // Check if selection is within a code block
        let node = selection.anchorNode;
        while (node && node !== document) {
          if (node.classList && 
              (node.classList.contains('code-block-container') || 
               node.classList.contains('inline-code'))) {
            // Let browser handle the copy
            return;
          }
          node = node.parentNode;
        }
      }
    }
    
    // Alt+C (or Option+C on Mac) to copy the last or currently focused code block
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      
      // Find the last or focused code block
      const focusedElement = document.activeElement;
      let targetCodeBlock = null;
      
      if (focusedElement && 
          (focusedElement.closest('.code-block-container') || 
           focusedElement.classList.contains('inline-code'))) {
        // User has focused a code element
        targetCodeBlock = focusedElement.closest('.code-block-container') || focusedElement;
      } else {
        // Get the last code block in the chat
        const allCodeBlocks = document.querySelectorAll('.code-block-container');
        if (allCodeBlocks.length > 0) {
          targetCodeBlock = allCodeBlocks[allCodeBlocks.length - 1];
        }
      }
      
      if (targetCodeBlock) {
        // Trigger the copy action
        const codeText = targetCodeBlock.classList.contains('inline-code') 
          ? targetCodeBlock.textContent 
          : targetCodeBlock.querySelector('code').textContent;
        
        navigator.clipboard.writeText(codeText)
          .then(() => {
            // Show feedback
            if (targetCodeBlock.classList.contains('inline-code')) {
              const originalBackground = window.getComputedStyle(targetCodeBlock).backgroundColor;
              targetCodeBlock.style.backgroundColor = 'var(--copy-btn-success-bg)';
              
              // Show temporary tooltip
              const tooltip = document.createElement('div');
              tooltip.className = 'copy-tooltip';
              tooltip.textContent = 'Copied!';
              tooltip.style.animation = 'fadeInOut 1.5s ease forwards';
              targetCodeBlock.appendChild(tooltip);
              
              setTimeout(() => {
                targetCodeBlock.style.backgroundColor = originalBackground;
                if (tooltip && tooltip.parentNode) {
                  tooltip.parentNode.removeChild(tooltip);
                }
              }, 1500);
            } else {
              // For code blocks
              targetCodeBlock.classList.add('highlight-animation');
              const copyBtn = targetCodeBlock.querySelector('.copy-btn');
              if (copyBtn) {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<svg class="copy-success-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
                copyBtn.title = "Copied!";
                
                setTimeout(() => {
                  targetCodeBlock.classList.remove('highlight-animation');
                  copyBtn.classList.remove('copied');
                  copyBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
                  copyBtn.title = "Copy code";
                }, 1500);
              }
            }
          })
          .catch(err => {
            console.error('Failed to copy via keyboard shortcut:', err);
          });
      }
    }
    
    // Alt+A (or Option+A on Mac) to copy all code blocks in the last AI message
    if (e.altKey && e.key === 'a') {
      e.preventDefault();
      
      // Find the last AI message
      const aiMessages = document.querySelectorAll('.chat-message.ai');
      if (aiMessages.length > 0) {
        const lastAiMessage = aiMessages[aiMessages.length - 1];
        const codeBlocks = lastAiMessage.querySelectorAll('.code-block-container');
        
        if (codeBlocks.length > 0) {
          // Copy all code from the last AI message
          const allCode = Array.from(codeBlocks)
            .map(block => block.querySelector('code').textContent)
            .join('\n\n');
          
          navigator.clipboard.writeText(allCode)
            .then(() => {
              // Show feedback by flashing all code blocks
              codeBlocks.forEach(block => {
                block.classList.add('highlight-animation');
                setTimeout(() => block.classList.remove('highlight-animation'), 1500);
              });
              
              // Show feedback toast
              const toast = document.createElement('div');
              toast.className = 'copy-toast';
              toast.textContent = 'All code copied!';
              document.body.appendChild(toast);
              
              setTimeout(() => {
                if (toast && toast.parentNode) {
                  toast.parentNode.removeChild(toast);
                }
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy all code via keyboard shortcut:', err);
            });
        }
      }
    }
  });
  
  // Add hover effect to code blocks
  function addHoverEffectsToCodeBlocks() {
    document.querySelectorAll('.code-block-container, .inline-code').forEach(element => {
      element.addEventListener('mouseenter', () => {
        if (element.classList.contains('code-block-container')) {
          const copyBtn = element.querySelector('.copy-btn');
          if (copyBtn) copyBtn.style.opacity = '1';
        }
      });
      
      element.addEventListener('mouseleave', () => {
        if (element.classList.contains('code-block-container')) {
          const copyBtn = element.querySelector('.copy-btn');
          if (copyBtn && !copyBtn.classList.contains('copied')) {
            copyBtn.style.opacity = '0.7';
          }
        }
      });
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
    chatInput.style.height = '40px'; // Reset height after clearing
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

  // Reset textarea height when cleared
  chatInput.addEventListener('keyup', () => {
    if (chatInput.value === '') {
      chatInput.style.height = '40px';
    }
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Focus input on popup open
  chatInput.focus();
}); 