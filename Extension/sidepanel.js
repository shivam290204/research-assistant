const sunIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const moonIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['researchNotes', 'theme'], function(result) {
        if(result.researchNotes) {
            document.getElementById('notes').value = result.researchNotes;
        }
        if (result.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('themeToggleBtn').innerHTML = sunIcon;
        } else {
            document.getElementById('themeToggleBtn').innerHTML = moonIcon;
        }
    });

    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);

    const actionButtons = document.querySelectorAll('.actions button, #translateBtn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const operation = e.currentTarget.getAttribute('data-op');
            processSelection(operation);
        });
    });
});

async function processSelection(operation) {
    try {
        const [tab] = await chrome.tabs.query({ active:true, currentWindow: true});
        if (!tab) return;
        
        const [{ result }] = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: () => window.getSelection().toString()
        });

        if(!result || result.trim() === '') {
            showResult('Please select some text on the webpage first.');
            return;
        }

        let payload = { content: result, operation: operation };
        
        if (operation === 'translate') {
            payload.language = document.getElementById('languageSelect').value;
        }

        showLoading();

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if(!response.ok){
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        showResult(formatOutput(text));

    } catch (error) {
        showResult(`Error: ${error.message}. Make sure your backend server is running.`);
    }
}

function saveNotes() {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes}, function() {
        const btn = document.getElementById('saveNotesBtn');
        const originalText = btn.innerText;
        btn.innerText = 'Saved!';
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    });
}

function showLoading() {
    document.getElementById('results').innerHTML = `<div class="result-item"><div class="result-content" style="color: #64748b; font-style: italic;">Processing...</div></div>`;
}

function formatOutput(text) {
    // Escape standard text to prevent HTML injection
    let formattedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Bold specific markers from LLM response
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return formattedText;
}

function showResult(content){
    document.getElementById('results').innerHTML = `<div class="result-item"><div class="result-content">${content}</div></div>`;
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggleBtn').innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
    chrome.storage.local.set({ 'theme': newTheme });
}