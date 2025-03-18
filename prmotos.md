
Improved Prompt:

You are a seasoned Chrome extension developer and AI coding assistant. Your mission is to create a lightweight, high-performance Chrome extension (using Manifest V3) that:
Automatically Detects LeetCode Problems
Monitors the DOM or URL to confirm the user is viewing a valid coding challenge.
Specifically locates and extracts data from the relevant <div> elements on the LeetCode page, such as:
Problem Description (title, description, difficulty)
Code Editor section or <div> where the user’s current solution is shown.
Examples/Test Cases
AI Assistance with a Chat Interface
Integrates with Hugging Face APIs (or another LLM-based service) to generate, refine, and discuss potential solutions.
Provides a chat-style interface (sidebar, popup, or injected UI component) that lets users:
Ask follow-up questions or request clarifications about the proposed solution.
Delve deeper into time complexity (Big O) and space complexity considerations.
Explore multiple solution approaches (e.g., brute force, optimized, etc.).
Secure, Efficient Data Handling
Extracts problem details from the DOM and securely sends them to the Hugging Face API.
Protects any API keys or credentials (e.g., via environment variables or a secure vault).
Follows best practices for minimizing permissions in manifest.json (only request what is absolutely necessary).
In-Page Solution Display
Shows AI-generated solutions and clarifications directly on the LeetCode page or in a handy popup.
Chat Window features that allow a continuous back-and-forth conversation with the AI assistant about the problem, the code, and possible optimizations.
Performance & Security
Must remain lightweight, avoiding significant overhead or performance slowdowns.
Ensures secure handling of all user data and any credentials required to access the AI API.
Uses a Manifest V3 service worker or background script for minimal resource usage.
Documentation & AI Collaboration
Clearly document all steps and highlight AI collaboration (which prompts were used, how they were refined, etc.).
Indicate which parts of the project were AI-generated or manually created.
Include best practices for code quality (e.g., ESLint/Prettier).
Deliverables
Project Structure: Manifest, content scripts, background (service worker), popup/chat UI, CSS (if needed).
Core Code Files:
manifest.json (with minimal permissions and correct matches)
content_script.js (detects the relevant LeetCode <div> elements, scrapes data, forwards to background script)
service_worker.js or background.js (handles AI API calls and message passing)
popup.html / popup.js (or another UI component) to create a chat interface
Instructions:
How to install and test the extension (e.g., load unpacked).
How to securely manage API keys.
A summary of the AI prompts and your reflections on using them.
Future Enhancements:
Support for other platforms (HackerRank, CodeSignal, etc.).
Advanced features: caching solutions, user feedback, analyzing user-submitted code, deeper conversations about algorithmic complexity.
Key Points
Clean, well-commented code with standard conventions.
Strict separation of concerns (DOM scraping vs. API requests).
Detailed example prompts for Hugging Face, including iteration strategies.
Emphasis on time complexity (O-notation) and space complexity when generating or refining solutions.
Secure handling of secrets and minimal permissions in Chrome extension development.
Use this prompt to produce:
A comprehensive, well-organized codebase adhering to Manifest V3 best practices.
A chat-enabled extension that continuously interacts with the Hugging Face API, providing solutions and deeper discussions about optimization.
Thorough documentation covering installation, testing, AI collaboration details, and future extension ideas.


second promot affter the init we should use a modal with search to match the up to date api doc into the ai assient : 


make the realted div to the ai asssient inside the file content_script.js 
cp the function  extractLeetCodeInfo to llm deepseek r1 :
this is the deffuclt div : <div class="relative inline-flex items-center justify-center text-caption px-2 py-1 gap-1 rounded-full bg-fill-secondary text-difficulty-medium dark:text-difficulty-medium">Medium</div>

the whole desbction and exmples:
<div class="elfjS" data-track-load="description_content"><p>Given a string <code>s</code>, find the length of the <strong>longest</strong> <span data-keyword="substring-nonempty" class=" cursor-pointer relative text-dark-blue-s text-sm"><button type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="radix-:rp:" data-state="closed" class=""><strong>substring</strong></button></span> without duplicate characters.</p>

the title : <div class="text-title-large font-semibold text-text-primary dark:text-text-primary"><a class="no-underline hover:text-blue-s dark:hover:text-dark-blue-s truncate cursor-text whitespace-normal hover:!text-[inherit]" href="/problems/longest-substring-without-repeating-characters/">3. Longest Substring Without Repeating Characters</a><div class="text-body ml-2 inline-flex items-center gap-2 py-1"><div class="inline-flex items-center space-x-2"></div></div></div>

the editor content : 
<div class="view-lines monaco-mouse-cursor-text" role="presentation" aria-hidden="true" data-mprt="7" style="position: absolute; font-family: Menlo, Monaco, &quot;Courier New&quot;, monospace; font-weight: normal; font-size: 13px; font-feature-settings: &quot;liga&quot; 0, &quot;calt&quot; 0; line-height: 20px; letter-spacing: 0px; width: 463px; height: 882px;"><div style="top:8px;height:20px;" class="view-line"><span><span class="mtk4">class</span><span class="mtk1">&nbsp;</span><span class="mtk9">Solution</span><span class="mtk1">:</span></span></div><div style="top:28px;height:20px;" class="view-line"><span><span class="mtk1">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="mtk4">def</span><span class="mtk1">&nbsp;</span><span class="mtk10">lengthOfLongestSubstring</span><span class="mtk1">(</span><span class="mtk13">self</span><span class="mtk1">,&nbsp;</span><span class="mtk13">s</span><span class="mtk1">:&nbsp;</span><span class="mtk9">str</span><span class="mtk1">)&nbsp;-&gt;&nbsp;</span><span class="mtk9">int</span><span class="mtk1">:</span></span></div><div style="top:48px;height:20px;" class="view-line"><span><span class="mtk1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span></div></div>
please refactor the funciton to match the nested above keepits clean code for best partice witout noisy comment  



#case when you got not frendly ui ux
fill here....



