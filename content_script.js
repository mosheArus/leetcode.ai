(function() {
  // Check if the current URL is a LeetCode problem page
  function isLeetCodeProblemPage() {
    return window.location.href.includes('/problems/');
  }

  // Function to extract problem information from the LeetCode page
  function extractLeetCodeInfo() {
    try {
      const title = document.querySelector('.text-title-large a')?.textContent.trim() || '';
      const difficulty = document.querySelector('[class*="text-difficulty"]')?.textContent.trim() || '';

      // Extract the description from the LeetCode page and clean html tags
      const htmlString = document.querySelector('[data-track-load="description_content"]')?.innerHTML.trim() || '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;
      const description = tempDiv.textContent.trim();
    
      
      return { title, difficulty, description };
    } catch (error) {
      console.error('Error extracting LeetCode info:', error);
      return {};
    }
  }

  // Debounce function to avoid sending messages too frequently
  let debounceTimer;
  function debounce(callback, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(callback, delay);
  }

  // Function to send problem data if it qualifies as a LeetCode problem page
  function sendProblemData(action) {
    if (!isLeetCodeProblemPage()) return;
    const info = extractLeetCodeInfo();
    if (info.title) {
      chrome.runtime.sendMessage({ action, data: info });
    }
  }

  // Send problem data once the DOM content is loaded
  document.addEventListener('DOMContentLoaded', () => {
    sendProblemData('leetcode_problem_detected');
  });

  // Use MutationObserver to monitor dynamic changes in the DOM
  const observer = new MutationObserver(() => {
    debounce(() => {
      sendProblemData('leetcode_problem_updated');
    }, 300);
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
