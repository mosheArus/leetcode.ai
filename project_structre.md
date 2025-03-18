graph TD
    A[manifest.json] -->|Defines| B[Content Script]
    A -->|Defines| C[Service Worker]
    A -->|Defines| D[Popup UI]
    
    B[content_script.js] -->|Extracts & Sends| C
    D[popup.html/popup.js] -->|Sends Queries| C
    C -->|Returns AI Responses| D
    
    E[(LeetCode Page)] -->|DOM Elements| B
    C -->|API Calls| F[AI Service/Hugging Face]


# manifest.json 
Purpose: Extension configuration
   Key components:
   - Permissions
   - Script declarations
   - Icon definitions
   - Extension metadata

# content_script.js
Purpose: LeetCode page monitoring
   Key functions:
   - Extracts problem title
   - Gets difficulty level
   - Captures problem description
   - Collects test cases
   - Monitors DOM changes

 # service_worker.js (Background Processing)
 Purpose: Message handling & API integration
   Key functions:
   - Stores problem information
   - Handles messages from content script
   - Processes chat requests
   - Makes API calls to AI service
   - Returns responses to popup 

# popup.html
   Purpose: Chat interface
   Components:
   - Chat message container
   - Input field
   - Send button
   Functions:
   - Displays messages
   - Handles user input
   - Communicates with service worker

Data Flow:
When user visits LeetCode:
   LeetCode Page → content_script.js → service_worker.js
   [Problem Data Extraction] → [Data Storage]

When user chats:
   popup.js → service_worker.js → AI API → service_worker.js → popup.js
   [Query] → [Processing] → [AI Response] → [Display]



Key Features:
Real-time problem detection
Dynamic DOM monitoring
Asynchronous message handling
Interactive chat interface
AI integration capability



