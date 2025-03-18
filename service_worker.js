// service_worker.js

let latestProblemInfo = null;

async function getApiKey() {
  try {
    const result = await chrome.storage.sync.get(['huggingface_api_key']);
    return result.huggingface_api_key;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "leetcode_problem_detected" || message.action === "leetcode_problem_updated") {
    latestProblemInfo = message.data;
    chrome.storage.local.set({ 'leetcodeProblemInfo': message.data.title });
  } else if (message.action === "chat_request") {
    const userQuery = message.query;
    
    const problemContext = latestProblemInfo
      ? `Title: ${latestProblemInfo.title}\nDifficulty: ${latestProblemInfo.difficulty}\nDescription: ${latestProblemInfo.description}`
      : "No problem context available.";

    const messages = [
      { 
        role: "system", 
        content: "You are an expert LeetCode problem solver. Provide optimal solutions with best time/space complexity, clean code, and clear explanations." 
      },
      { role: "system", content: problemContext },
      { role: "user", content: userQuery }
    ];

    const payload = {
      model: "meta-llama/Llama-3.2-3B-Instruct",
      messages,
      max_tokens: 500,
      stream: true
    };

    getApiKey().then(async (apiKey) => {
      if (!apiKey) {
        chrome.runtime.sendMessage({
          action: "stream_error",
          error: "API key not configured. Please set up your Hugging Face API key in the extension settings and refresh the page."
        });
        return;
      }

      try {
        const response = await fetch("https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-3B-Instruct/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'API request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = "";
        let buffer = "";

        async function processStream() {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                // Process any remaining data in buffer
                if (buffer) {
                  processLine(buffer);
                }
                chrome.runtime.sendMessage({
                  action: "stream_complete",
                  answer: fullAnswer
                });
                return;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              const lines = buffer.split('\n');
              buffer = lines.pop() || "";

              for (const line of lines) {
                processLine(line);
              }
            }
          } catch (error) {
            chrome.runtime.sendMessage({
              action: "stream_error",
              error: error.message
            });
          }
        }

        function processLine(line) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') return;

            try {
              const chunkData = JSON.parse(jsonStr);
              
              if (chunkData.error) {
                throw new Error(chunkData.error.message);
              }

              if (chunkData.choices?.[0]?.delta?.content) {
                const contentChunk = chunkData.choices[0].delta.content;
                fullAnswer += contentChunk;
                
                chrome.runtime.sendMessage({
                  action: "stream_chunk",
                  chunk: contentChunk,
                  fullResponse: fullAnswer
                });
              }
            } catch (e) {
              console.error("Error processing chunk:", e, "Data:", jsonStr);
              chrome.runtime.sendMessage({
                action: "stream_error",
                error: `Data parsing error: ${e.message}`
              });
            }
          }
        }

        processStream();
      } catch (error) {
        chrome.runtime.sendMessage({
          action: "stream_error",
          error: error.message
        });
      }
    });

    return true;
  }
});