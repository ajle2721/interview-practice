document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentQuestion = null;
    let history = JSON.parse(localStorage.getItem('interview_history')) || [];
    let apiKey = localStorage.getItem('gemini_api_key') || '';
    let recognition = null;
    let isRecording = false;
    let currentRecorder = null; // 'alice' or 'jason'
    let timerInterval = null;
    let timerSeconds = 0;

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
            let msg = '語音辨識錯誤：' + event.error;
            if (event.error === 'not-allowed') {
                msg = '麥克風權限被拒絕。請檢查瀏覽器設定，確保已允許此網頁使用麥克風。';
            } else if (event.error === 'network') {
                msg = '網路連線錯誤，語音辨識需要網路連線。';
            } else if (event.error === 'no-speech') {
                msg = '沒聽清楚，請再試一次。';
                return; // Don't alert for silence
            }
            alert(msg);
            resetRecordingUI();
        };

        // Check if we are on HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            alert('警告：語音辨識在非 HTTPS 連線下可能無法運作。請確保網址以 https:// 開頭。');
        }
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
    const timerDisplay = document.getElementById('recording-timer');

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
        updateDebugLink();
        settingsModal.classList.add('hidden');
        alert('Settings saved!');
    });

    function updateDebugLink() {
        const link = document.getElementById('check-models-link');
        if (apiKey) {
            link.href = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            link.style.display = 'inline';
        } else {
            link.style.display = 'none';
        }
    }

    // Initialize debug link
    updateDebugLink();

    // Data Management
    exportBtn.addEventListener('click', exportHistory);
    importInput.addEventListener('change', importHistory);
    historyList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-history-btn');
        if (deleteBtn) {
            e.stopPropagation(); // Prevent expanding the card
            deleteEntry(deleteBtn.dataset.id);
        }
    });

    function deleteEntry(id) {
        if (confirm('確定要刪除這筆紀錄嗎？')) {
            history = history.filter(item => item.id != id);
            localStorage.setItem('interview_history', JSON.stringify(history));
            renderHistory();
        }
    }

    function formatMarkdown(text) {
        if (!text) return '';
        // Simple markdown parsing for the preview
        return text
            .replace(/### (.*)/g, '<h5 style="margin: 1rem 0 0.5rem 0; color: var(--primary);">$1</h5>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/- (.*)/g, '<li style="margin-left: 1.2rem;">$1</li>')
            .replace(/\n/g, '<br>');
    }

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
            alice: {
                raw: aliceAnswer.dataset.original || aliceAnswer.value.trim(),
                processed: aliceAnswer.value.trim()
            },
            jason: {
                raw: jasonAnswer.dataset.original || jasonAnswer.value.trim(),
                processed: jasonAnswer.value.trim()
            }
        };

        if (!entry.alice.processed && !entry.jason.processed) {
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

        historyList.innerHTML = history.map(item => {
            const aliceData = typeof item.alice === 'object' ? item.alice : { raw: '', processed: item.alice };
            const jasonData = typeof item.jason === 'object' ? item.jason : { raw: '', processed: item.jason };

            return `
            <div class="history-item collapsed" onclick="handleItemClick(event, this)">
                <div class="history-header">
                    <div class="history-date">
                        <span>${item.date} • <span class="badge" style="font-size: 0.7rem; padding: 0.2rem 0.6rem;">${item.category}</span></span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <button class="delete-history-btn" data-id="${item.id}" title="Delete Record">🗑️</button>
                </div>
                <div class="history-q-text">${item.question}</div>
                <div class="history-answers">
                    <div class="h-ans-box">
                        <div class="h-ans-header">
                            <h4>Alice</h4>
                            <div class="tab-group">
                                <button class="tab-btn active" onclick="event.stopPropagation(); switchTab(this, 'processed')">✨ AI</button>
                                <button class="tab-btn" onclick="event.stopPropagation(); switchTab(this, 'raw')">📝 原</button>
                            </div>
                        </div>
                        <div class="h-ans-content processed">${aliceData.processed ? formatMarkdown(aliceData.processed) : '<span style="color: #ccc">N/A</span>'}</div>
                        <div class="h-ans-content raw hidden">${aliceData.raw ? formatMarkdown(aliceData.raw) : '<span style="color: #ccc">N/A</span>'}</div>
                    </div>
                    <div class="h-ans-box">
                        <div class="h-ans-header">
                            <h4>Jason</h4>
                            <div class="tab-group">
                                <button class="tab-btn active" onclick="event.stopPropagation(); switchTab(this, 'processed')">✨ AI</button>
                                <button class="tab-btn" onclick="event.stopPropagation(); switchTab(this, 'raw')">📝 原</button>
                            </div>
                        </div>
                        <div class="h-ans-content processed">${jasonData.processed ? formatMarkdown(jasonData.processed) : '<span style="color: #ccc">N/A</span>'}</div>
                        <div class="h-ans-content raw hidden">${jasonData.raw ? formatMarkdown(jasonData.raw) : '<span style="color: #ccc">N/A</span>'}</div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    // Handle item click for expansion, but ignore if clicking buttons
    window.handleItemClick = (event, el) => {
        if (event.target.closest('button')) return;
        el.classList.toggle('collapsed');
    };

    window.switchTab = (btn, type) => {
        const box = btn.closest('.h-ans-box');
        const btns = box.querySelectorAll('.tab-btn');
        const contents = box.querySelectorAll('.h-ans-content');
        
        btns.forEach(b => b.classList.toggle('active', b === btn));
        contents.forEach(c => c.classList.toggle('hidden', !c.classList.contains(type)));
    };

    // --- Recording & AI Logic ---

    function toggleRecording(user, btn) {
        if (!recognition) {
            alert('您的瀏覽器不支援語音辨識。請嘗試使用 Chrome 或 Safari。');
            return;
        }

        if (isRecording) {
            try {
                recognition.stop();
            } catch (err) {
                console.error('Stop recognition error:', err);
                resetRecordingUI();
            }
            return;
        }

        // Start Recording
        try {
            currentRecorder = user;
            isRecording = true;
            
            // 1. Immediate UI Feedback
            btn.classList.add('recording');
            btn.textContent = '⏹ 停止錄音';
            
            const preview = document.getElementById(`${user}-transcript`);
            if (preview) {
                preview.classList.remove('hidden');
                preview.textContent = '正在聽取中 (Listening)...';
            }

            // 2. Start Timer
            startTimer();
            
            // 3. Start Recognition
            recognition.lang = detectLanguagePreference();
            recognition.start();
        } catch (err) {
            console.error('Failed to start recording:', err);
            // If it fails to start, reset everything
            alert('錄音啟動失敗，請確保已授權麥克風權限。');
            resetRecordingUI();
        }
    }

    function startTimer() {
        stopTimer();
        timerSeconds = 0;
        updateTimerUI();
        if (timerDisplay) timerDisplay.classList.remove('hidden');
        
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerUI();
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (timerDisplay) {
            timerDisplay.classList.add('hidden');
        }
    }

    function updateTimerUI() {
        if (!timerDisplay) return;
        const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
        const secs = (timerSeconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
        
        // Visual indicators
        timerDisplay.classList.remove('warning', 'danger');
        if (timerSeconds >= 180) {
            timerDisplay.classList.add('danger');
        } else if (timerSeconds >= 120) {
            timerDisplay.classList.add('warning');
        }
    }

    function resetRecordingUI() {
        isRecording = false;
        stopTimer();
        document.querySelectorAll('.record-btn').forEach(btn => {
            btn.classList.remove('recording');
            btn.textContent = '🎤';
        });
        
        // Hide previews if they are just "Listening..." or equivalent
        document.querySelectorAll('.transcript-preview').forEach(p => {
            if (p.textContent.includes('Listening') || p.textContent.includes('聽取中') || !p.textContent) {
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

        const endpoints = ['v1beta', 'v1'];
        const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];

        let lastError = null;
        let success = false;

        outerLoop:
        for (const v of endpoints) {
            for (const model of models) {
                try {
                    console.log(`Checking: ${v} / ${model}...`);
                    const url = `https://generativelanguage.googleapis.com/${v}/models/${model}:generateContent?key=${apiKey}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: `You are a STRICT and professional interview coach.
                            Question Asked: "${currentQuestion ? currentQuestion.question : 'N/A'}"
                            
                            Input Answer Text:
                            "${text}"
                            
                            YOUR TASKS:
                            1. STRICT RELEVANCE CHECK: Be very critical. Does the user explain HOW they solved the problem? If they only talk about feelings or high-level philosophy without concrete prioritization methods, give a low relevance score.
                            2. RATINGS (0-10): Provide scores for:
                               - 切題度 (Relevance): Does it answer the "how" of the question?
                               - 具體度 (Specificity): Are there real examples or details?
                               - 影響力 (Impact): Is there a clear, positive result?
                            3. COACH'S CRITIQUE: Provide direct, honest feedback on what is missing.
                            4. SUGGESTED STAR+R REWRITE: 
                               - Rewrite the answer in a natural, conversational, but professional tone (as if the candidate is speaking).
                               - Keep it concise and impactful.
                            
                            IMPORTANT RULES:
                            1. Use the SAME language as the input (Traditional Chinese or English).
                            2. Use clear Markdown headers.
                            3. Use the following format:
                            
                            ### 📊 綜合評分
                            - 切題度: X/10 (理由)
                            - 具體度: X/10 (理由)
                            - 影響力: X/10 (理由)
                            
                            ### 💡 教練點評
                            [指出缺點與改進方向]
                            
                            ### ✨ 建議回答 (口語化 STAR+R)
                            [自然且精簡的回答範例]
                            
                            ### 🚀 進階建議
                            [1-2 個讓回答更強大的技巧]`

                                }]
                            }]
                        })
                    });

                    const data = await response.json();
                    
                    if (!response.ok) {
                        const errorDetails = data.error?.message || 'Unknown API error';
                        console.warn(`${v}/${model} failed:`, errorDetails);
                        lastError = errorDetails;
                        continue; 
                    }

            if (data.candidates && data.candidates[0].content.parts[0].text) {
                // Store original text before replacing
                textarea.dataset.original = text;
                textarea.value = data.candidates[0].content.parts[0].text;
                success = true;
                        console.log(`Success! Using: ${v} / ${model}`);
                        break outerLoop;
                    }
                } catch (error) {
                    console.error(`Network or fetch error for ${v}/${model}:`, error);
                    lastError = error.message;
                }
            }
        }

        if (!success) {
            alert(`AI 總結失敗。最後一次錯誤：${lastError}\n\n這通常代表您的 API Key 尚未啟動或模型在您的區域暫時不可用。`);
        }
        
        btn.disabled = false;
        btn.textContent = '✨ AI STAR';
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
