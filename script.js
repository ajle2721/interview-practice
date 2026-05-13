document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentQuestion = null;
    let history = JSON.parse(localStorage.getItem('interview_history')) || [];
    let apiKey = localStorage.getItem('gemini_api_key') || '';
    let recognition = null;
    let isRecording = false;
    let currentRecorder = null; // 'alice' or 'jason'

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        // Define handlers once
        recognition.onresult = (event) => {
            if (!currentRecorder) return;
            
            const preview = document.getElementById(`${currentRecorder}-transcript`);
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            if (preview) {
                preview.textContent = (finalTranscript || preview.textContent !== 'Listening...' ? preview.textContent : '') + interimTranscript;
                // If we have final transcript, we append it to the textarea
                if (finalTranscript) {
                    const textarea = document.getElementById(`${currentRecorder}-answer`);
                    const existing = textarea.value.trim();
                    textarea.value = existing ? existing + ' ' + finalTranscript : finalTranscript;
                    // Also update preview to show what's been captured
                    preview.textContent = finalTranscript;
                }
            }
        };

        recognition.onend = () => {
            resetRecordingUI();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                alert('麥克風權限被拒絕，請在瀏覽器設定中開啟。');
            } else if (event.error === 'network') {
                alert('網路連線錯誤，請檢查網路狀態。');
            }
            resetRecordingUI();
        };
    } else {
        console.warn('Speech recognition not supported in this browser.');
    }

    // Elements
    const drawBtn = document.getElementById('draw-btn');
    const redrawBtn = document.getElementById('redraw-btn');
    const saveBtn = document.getElementById('save-btn');
    const categoryFilter = document.getElementById('category-filter');
    const questionCard = document.getElementById('question-card');
    const questionText = document.getElementById('question-text');
    const questionCategory = document.getElementById('question-category');
    const aliceAnswer = document.getElementById('alice-answer');
    const jasonAnswer = document.getElementById('jason-answer');
    const historyList = document.getElementById('history-list');
    const historyCount = document.getElementById('history-count');

    // Modal & Settings Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveSettings = document.getElementById('save-settings');
    const closeSettings = document.getElementById('close-settings');
    const exportBtn = document.getElementById('export-btn');
    const importInput = document.getElementById('import-input');

    // Initialize UI
    renderHistory();
    apiKeyInput.value = apiKey;

    // Event Listeners
    drawBtn.addEventListener('click', drawQuestion);
    redrawBtn.addEventListener('click', drawQuestion);
    saveBtn.addEventListener('click', saveEntry);

    // Modal Controls
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettings.addEventListener('click', () => {
        apiKey = apiKeyInput.value.trim();
        localStorage.setItem('gemini_api_key', apiKey);
        settingsModal.classList.add('hidden');
        alert('Settings saved!');
    });

    // Data Management
    exportBtn.addEventListener('click', exportHistory);
    importInput.addEventListener('change', importHistory);

    // Recording Controls
    document.querySelectorAll('.record-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleRecording(btn.dataset.user, btn));
    });

    // AI Summary Controls
    document.querySelectorAll('.ai-btn').forEach(btn => {
        btn.addEventListener('click', () => summarizeWithAI(btn.dataset.user, btn));
    });

    function drawQuestion() {
        const category = categoryFilter.value;
        let pool = QUESTIONS;

        if (category !== 'all') {
            pool = QUESTIONS.filter(q => q.category === category);
        }

        if (pool.length === 0) {
            alert('No questions found in this category.');
            return;
        }

        const randomIndex = Math.floor(Math.random() * pool.length);
        currentQuestion = pool[randomIndex];

        // Update UI
        questionText.textContent = currentQuestion.question;
        questionCategory.textContent = currentQuestion.category;
        
        // Reset answers
        aliceAnswer.value = '';
        jasonAnswer.value = '';

        // Show card
        questionCard.classList.remove('hidden');
        
        // Scroll to card
        questionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function saveEntry() {
        if (!currentQuestion) return;

        const entry = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            timestamp: new Date().getTime(),
            question: currentQuestion.question,
            category: currentQuestion.category,
            alice: aliceAnswer.value.trim(),
            jason: jasonAnswer.value.trim()
        };

        if (!entry.alice && !entry.jason) {
            alert('Please enter at least one answer focus.');
            return;
        }

        // Add to history
        history.unshift(entry);
        localStorage.setItem('interview_history', JSON.stringify(history));

        // Feedback & UI Update
        alert('紀錄已儲存！');
        questionCard.classList.add('hidden');
        renderHistory();
    }

    function renderHistory() {
        historyCount.textContent = `${history.length} records`;

        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-state">尚無紀錄</div>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-date">${item.date} • <span class="badge" style="font-size: 0.7rem; padding: 0.2rem 0.6rem;">${item.category}</span></div>
                <div class="history-q-text">${item.question}</div>
                <div class="history-answers">
                    <div class="h-ans-box">
                        <h4>Alice</h4>
                        <div class="h-ans-content">${item.alice || '<span style="color: #ccc">N/A</span>'}</div>
                    </div>
                    <div class="h-ans-box">
                        <h4>Jason</h4>
                        <div class="h-ans-content">${item.jason || '<span style="color: #ccc">N/A</span>'}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // --- Recording & AI Logic ---

    function toggleRecording(user, btn) {
        if (!recognition) {
            alert('Your browser does not support Speech Recognition.');
            return;
        }

        if (isRecording) {
            recognition.stop();
            return;
        }

        // Start Recording
        try {
            currentRecorder = user;
            isRecording = true;
            
            // Update UI for the specific button
            btn.classList.add('recording');
            btn.textContent = '⏹ 停止錄音';
            
            const preview = document.getElementById(`${user}-transcript`);
            if (preview) {
                preview.classList.remove('hidden');
                preview.textContent = 'Listening...';
            }

            recognition.lang = detectLanguagePreference();
            recognition.start();
        } catch (err) {
            console.error('Failed to start recognition:', err);
            resetRecordingUI();
        }
    }

    function resetRecordingUI() {
        isRecording = false;
        document.querySelectorAll('.record-btn').forEach(btn => {
            btn.classList.remove('recording');
            btn.textContent = '🎤';
        });
        
        // Hide previews if they are just "Listening..."
        document.querySelectorAll('.transcript-preview').forEach(p => {
            if (p.textContent === 'Listening...' || !p.textContent) {
                p.classList.add('hidden');
            }
        });
        
        currentRecorder = null;
    }

    function detectLanguagePreference() {
        // Just a helper, usually browser handles locale but we can hint
        return navigator.language.startsWith('zh') ? 'zh-TW' : 'en-US';
    }

    async function summarizeWithAI(user, btn) {
        const textarea = document.getElementById(`${user}-answer`);
        const text = textarea.value.trim();

        if (!text) {
            alert('Please speak or type something first.');
            return;
        }

        if (!apiKey) {
            alert('Please enter your Gemini API Key in Settings (⚙️ icon) first.');
            settingsModal.classList.remove('hidden');
            return;
        }

        btn.disabled = true;
        btn.textContent = '⌛ Summarizing...';

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are an expert interview coach. I will provide a messy transcript or notes of a behavioral interview answer. 
                            Please structure it into a professional STAR+R framework (Situation, Task, Action, Result, Reflection).
                            
                            Also, provide a short section at the end called "Coach Feedback" to point out what is missing or how to make the answer more impactful.
                            
                            IMPORTANT RULES:
                            1. Use the SAME language as the input. If I speak Chinese, output Chinese. If English, output English.
                            2. Keep it concise but impact-oriented.
                            3. Format with clear headings: Situation, Task, Action, Result, Reflection, and Coach Feedback.
                            
                            Input Text:
                            "${text}"`
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                textarea.value = data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response from AI');
            }
        } catch (error) {
            console.error('AI Error:', error);
            alert('AI Summarization failed. Check your API key or connection.');
        } finally {
            btn.disabled = false;
            btn.textContent = '✨ AI STAR';
        }
    }

    function exportHistory() {
        if (history.length === 0) {
            alert('No history to export.');
            return;
        }
        const dataStr = JSON.stringify(history, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `interview_history_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function importHistory(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!Array.isArray(importedData)) throw new Error('Invalid format');
                
                if (confirm(`Do you want to merge ${importedData.length} records into your current history?`)) {
                    // Simple merge: append and sort by timestamp
                    const combined = [...history, ...importedData];
                    // Remove duplicates by ID (timestamp)
                    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                    // Sort newest first
                    unique.sort((a, b) => b.id - a.id);
                    
                    history = unique;
                    localStorage.setItem('interview_history', JSON.stringify(history));
                    renderHistory();
                    alert('History imported successfully!');
                }
            } catch (err) {
                alert('Import failed. Please check the file format.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }
});
