/* ============================================
   LUMINA — AI Study Companion
   Interactive Features
   ============================================ */

// === Particle Canvas Background ===
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createParticles() {
    particles = [];
    const count = Math.floor((canvas.width * canvas.height) / 15000);
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            color: ['#f4a261', '#7c5cfc', '#2a9d8f', '#e76f51'][Math.floor(Math.random() * 4)]
        });
    }
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                const opacity = (1 - dist / 120) * 0.15;
                ctx.strokeStyle = `rgba(244, 162, 97, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    // Draw particles
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, p.color + '40');
        gradient.addColorStop(1, p.color + '00');
        ctx.fillStyle = gradient;
        ctx.fill();
    });

    animationId = requestAnimationFrame(drawParticles);
}

resizeCanvas();
createParticles();
drawParticles();

window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
});

// === Theme Toggle ===
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);

    // Update particle visibility
    canvas.style.opacity = next === 'light' ? '0.3' : '0.6';
});

// === Navbar Scroll Effect ===
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    if (scroll > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScroll = scroll;
});

// === Smooth Scroll Navigation ===
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        const offset = 80;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

// Nav link active state on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Nav links click handler
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href').substring(1);
        scrollToSection(href);
    });
});

// === Animated Counter Stats ===
function animateCounter(element, target) {
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(start + (target - start) * easeOut);

        if (target >= 1000000) {
            element.textContent = (value / 1000000).toFixed(1) + 'M+';
        } else if (target >= 1000) {
            element.textContent = value.toLocaleString() + '+';
        } else {
            element.textContent = value + '%';
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Trigger counter animation when hero is visible
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = document.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                animateCounter(stat, target);
            });
            statObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statObserver.observe(heroStats);
}

// === Chat Functionality ===
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

// Track conversation history for context
let chatHistory = [];

function addMessage(text, isUser) {
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'message-user' : 'message-ai'}`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`;
    avatar.textContent = isUser ? 'You' : 'L';

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isUser ? 'user-bubble' : 'glass-bubble'}`;
    bubble.innerHTML = text;

    if (isUser) {
        message.appendChild(bubble);
        message.appendChild(avatar);
    } else {
        message.appendChild(avatar);
        message.appendChild(bubble);
    }

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}

function formatAIResponse(text) {
    // Convert markdown-like formatting to HTML
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold **text**
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic *text*
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Code `text`
        .replace(/`(.+?)`/g, '<code style="background:rgba(244,162,97,0.15);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Bullet points
        .replace(/<br>[-•]\s/g, '<br>&nbsp;&nbsp;• ');

    return html;
}

// Typing dots CSS (inject once)
if (!document.getElementById('typing-style')) {
    const style = document.createElement('style');
    style.id = 'typing-style';
    style.textContent = `
        .typing-dots { display: flex; gap: 4px; padding: 4px 0; }
        .typing-dots span {
            width: 8px; height: 8px;
            background: var(--accent-1);
            border-radius: 50%;
            animation: typing-bounce 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message message-ai';
    indicator.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar ai-avatar';
    avatar.textContent = 'L';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble glass-bubble';
    bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';

    indicator.appendChild(avatar);
    indicator.appendChild(bubble);
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message to UI
    addMessage(text, true);
    chatInput.value = '';

    // Disable input while waiting
    chatInput.disabled = true;
    chatSend.disabled = true;
    chatSend.style.opacity = '0.5';

    // Show typing indicator
    showTypingIndicator();

    try {
        // Call the real AI backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: chatHistory
            })
        });

        const data = await response.json();

        removeTypingIndicator();

        if (data.reply) {
            addMessage(formatAIResponse(data.reply), false);
            // Save to history for context
            chatHistory.push({ role: 'user', content: text });
            chatHistory.push({ role: 'assistant', content: data.reply });
        } else if (data.error) {
            addMessage("Sorry, I couldn't process that. " + data.error, false);
        }
    } catch (err) {
        removeTypingIndicator();
        addMessage("I'm having trouble connecting right now. Please try again in a moment. 🌟", false);
    } finally {
        // Re-enable input
        chatInput.disabled = false;
        chatSend.disabled = false;
        chatSend.style.opacity = '';
        chatInput.focus();
    }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Suggestion chips — send immediately on click
document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.textContent;
        sendMessage();
    });
});

// Chat history items
document.querySelectorAll('.chat-history-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.chat-history-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});

// === Flashcard System ===
let flashcardDeck = [];
let currentCardIndex = 0;

const fcGenInput = document.getElementById('fc-gen-input');
const fcGenCount = document.getElementById('fc-gen-count');
const fcGenerateBtn = document.getElementById('fc-generate-btn');
const fcDeckSingle = document.getElementById('flashcard-deck-single');
const fcControls = document.getElementById('flashcard-controls');
const fcCounter = document.getElementById('fc-counter');
const fcPrevBtn = document.getElementById('fc-prev-btn');
const fcNextBtn = document.getElementById('fc-next-btn');
const fcLoading = document.getElementById('fc-loading');
const fcEmptyState = document.getElementById('fc-empty-state');

function renderCurrentCard() {
    if (flashcardDeck.length === 0) {
        fcDeckSingle.innerHTML = '';
        fcControls.style.display = 'none';
        fcEmptyState.style.display = 'block';
        fcCounter.textContent = '0 / 0 cards';
        return;
    }

    fcEmptyState.style.display = 'none';
    fcControls.style.display = 'flex';
    fcCounter.textContent = `${currentCardIndex + 1} / ${flashcardDeck.length} cards`;

    const card = flashcardDeck[currentCardIndex];
    const cardEl = document.createElement('div');
    cardEl.className = 'flashcard card-enter';
    cardEl.setAttribute('data-flipped', 'false');
    cardEl.innerHTML = `
        <div class="flashcard-inner">
            <div class="flashcard-front glass">
                <div class="fc-category">${escapeHtml(card.category || 'Study')}</div>
                <div class="fc-question">${escapeHtml(card.question)}</div>
                <div class="fc-hint">Click to reveal answer</div>
                <div class="fc-flip-icon">↻</div>
            </div>
            <div class="flashcard-back glass">
                <div class="fc-category">Answer</div>
                <div class="fc-answer">${card.answerHtml || escapeHtml(card.answer)}</div>
                <div class="fc-confidence">
                    <span>How well did you know this?</span>
                    <div class="confidence-btns">
                        <button class="conf-btn conf-again">Again</button>
                        <button class="conf-btn conf-hard">Hard</button>
                        <button class="conf-btn conf-good">Good</button>
                        <button class="conf-btn conf-easy">Easy</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Click to flip
    cardEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('conf-btn')) {
            e.stopPropagation();
            // Mark card as rated, auto-advance
            const rating = e.target.textContent;
            cardEl.style.opacity = '0.4';
            setTimeout(() => {
                if (currentCardIndex < flashcardDeck.length - 1) {
                    navigateCard(1);
                } else {
                    // Show completion
                    fcDeckSingle.innerHTML = `
                        <div class="fc-complete glass" style="text-align:center;padding:48px;border-radius:var(--radius-lg)">
                            <div style="font-size:3rem;margin-bottom:16px">🎉</div>
                            <h3 style="font-family:var(--font-heading);font-size:1.4rem;margin-bottom:8px">Deck Complete!</h3>
                            <p style="color:var(--text-secondary);margin-bottom:20px">You reviewed all ${flashcardDeck.length} flashcards.</p>
                            <button class="btn-primary" onclick="resetFlashcardDeck()">Study Again</button>
                        </div>
                    `;
                    fcCounter.textContent = `${flashcardDeck.length} / ${flashcardDeck.length} cards — done!`;
                }
            }, 500);
            return;
        }
        const flipped = cardEl.getAttribute('data-flipped') === 'true';
        cardEl.setAttribute('data-flipped', !flipped);
    });

    fcDeckSingle.innerHTML = '';
    fcDeckSingle.appendChild(cardEl);
}

function navigateCard(direction) {
    const newIndex = currentCardIndex + direction;
    if (newIndex < 0 || newIndex >= flashcardDeck.length) return;

    const oldCard = fcDeckSingle.querySelector('.flashcard');
    if (oldCard) {
        oldCard.classList.add(direction > 0 ? 'card-exit-left' : 'card-exit-right');
        setTimeout(() => {
            currentCardIndex = newIndex;
            renderCurrentCard();
        }, 280);
    } else {
        currentCardIndex = newIndex;
        renderCurrentCard();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.resetFlashcardDeck = function() {
    currentCardIndex = 0;
    renderCurrentCard();
};

async function generateFlashcards() {
    const topic = fcGenInput.value.trim();
    if (!topic) {
        fcGenInput.focus();
        fcGenInput.style.borderColor = 'var(--accent-2)';
        setTimeout(() => { fcGenInput.style.borderColor = ''; }, 1500);
        return;
    }

    const count = parseInt(fcGenCount.value);

    // Show loading with dynamic message
    fcDeckSingle.innerHTML = '';
    fcControls.style.display = 'none';
    fcEmptyState.style.display = 'none';
    fcLoading.style.display = 'block';
    fcGenerateBtn.disabled = true;
    fcGenerateBtn.style.opacity = '0.5';

    const fcLoadingText = document.getElementById('fc-loading-text');
    let loadingSeconds = 0;
    const loadingInterval = setInterval(() => {
        loadingSeconds += 2;
        if (loadingSeconds < 10) {
            fcLoadingText.textContent = 'Generating your flashcards...';
        } else if (loadingSeconds < 30) {
            fcLoadingText.textContent = 'The AI is thinking deeply about your topic...';
        } else if (loadingSeconds < 50) {
            fcLoadingText.textContent = 'Almost there, preparing your cards...';
        } else {
            fcLoadingText.textContent = 'The free AI service is rate-limited, please be patient...';
        }
    }, 2000);

    try {
        const response = await fetch('/api/flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, count })
        });

        const data = await response.json();
        fcLoading.style.display = 'none';
        clearInterval(loadingInterval);

        if (data.flashcards && data.flashcards.length > 0) {
            // Process cards: convert markdown in answers to HTML
            flashcardDeck = data.flashcards.map(c => ({
                question: c.question,
                answer: c.answer,
                answerHtml: c.answer
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>'),
                category: c.category || topic
            }));
            currentCardIndex = 0;
            renderCurrentCard();
        } else if (data.error) {
            showError(data.error);
        } else {
            showError('No flashcards were generated. Please try a different topic.');
        }
    } catch (err) {
        fcLoading.style.display = 'none';
        clearInterval(loadingInterval);
        showError('Could not connect to the server. Please try again.');
    } finally {
        clearInterval(loadingInterval);
        fcGenerateBtn.disabled = false;
        fcGenerateBtn.style.opacity = '';
    }
}

function showError(msg) {
    fcDeckSingle.innerHTML = `
        <div class="glass" style="text-align:center;padding:40px;border-radius:var(--radius-lg);max-width:400px">
            <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
            <p style="color:var(--text-secondary);margin-bottom:16px">${escapeHtml(msg)}</p>
            <button class="btn-ghost" onclick="document.getElementById('fc-gen-input').focus()">Try again</button>
        </div>
    `;
}

fcGenerateBtn.addEventListener('click', generateFlashcards);
fcGenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateFlashcards();
});

document.querySelectorAll('.fc-gen-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
        fcGenInput.value = btn.dataset.topic;
        generateFlashcards();
    });
});

fcPrevBtn.addEventListener('click', () => navigateCard(-1));
fcNextBtn.addEventListener('click', () => navigateCard(1));

// Keyboard navigation for flashcards
document.addEventListener('keydown', (e) => {
    // Only if flashcard section is visible and has cards
    if (flashcardDeck.length === 0) return;
    const flashcardSection = document.getElementById('flashcards');
    const rect = flashcardSection.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;

    if (e.key === 'ArrowLeft') navigateCard(-1);
    if (e.key === 'ArrowRight') navigateCard(1);
    if (e.key === ' ' || e.key === 'Enter') {
        const card = fcDeckSingle.querySelector('.flashcard');
        if (card) {
            e.preventDefault();
            const flipped = card.getAttribute('data-flipped') === 'true';
            card.setAttribute('data-flipped', !flipped);
        }
    }
});

// Initialize flashcard empty state
renderCurrentCard();

// === Timer ===
let timerDuration = 25 * 60;
let timerRemaining = timerDuration;
let timerInterval = null;
let timerRunning = false;

const timerTime = document.getElementById('timer-time');
const timerLabel = document.getElementById('timer-label');
const timerRingProgress = document.getElementById('timer-ring-progress');
const timerStartBtn = document.getElementById('timer-start');
const timerResetBtn = document.getElementById('timer-reset');
const timerPresets = document.querySelectorAll('.timer-preset');

const ringCircumference = 2 * Math.PI * 90;

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerTime.textContent = formatTime(timerRemaining);
    const progress = timerRemaining / timerDuration;
    const offset = ringCircumference * (1 - progress);
    timerRingProgress.style.strokeDasharray = ringCircumference;
    timerRingProgress.style.strokeDashoffset = offset;

    // Set gradient stroke
    timerRingProgress.style.stroke = 'url(#timer-gradient)';

    // Add SVG gradient if not exists
    if (!document.getElementById('timer-gradient-def')) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(svgNS, 'defs');
        defs.id = 'timer-gradient-def';
        const gradient = document.createElementNS(svgNS, 'linearGradient');
        gradient.id = 'timer-gradient';
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS(svgNS, 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#f4a261');

        const stop2 = document.createElementNS(svgNS, 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#e76f51');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);

        const timerSvg = document.querySelector('.timer-ring');
        timerSvg.insertBefore(defs, timerSvg.firstChild);
    }
}

function startTimer() {
    if (timerRunning) {
        // Pause
        clearInterval(timerInterval);
        timerRunning = false;
        timerStartBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume';
        timerLabel.textContent = 'Paused';
    } else {
        timerRunning = true;
        timerStartBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause';
        timerLabel.textContent = 'Focus';

        timerInterval = setInterval(() => {
            timerRemaining--;
            updateTimerDisplay();

            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                timerLabel.textContent = 'Complete! 🎉';
                timerStartBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Done';
                timerStartBtn.style.opacity = '0.6';

                // Visual notification
                timerTime.style.animation = 'pulse 0.5s ease 3';
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemaining = timerDuration;
    timerLabel.textContent = 'Focus';
    timerStartBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start';
    timerStartBtn.style.opacity = '';
    timerTime.style.animation = '';
    updateTimerDisplay();
}

timerStartBtn.addEventListener('click', startTimer);
timerResetBtn.addEventListener('click', resetTimer);

timerPresets.forEach(preset => {
    preset.addEventListener('click', () => {
        timerPresets.forEach(p => p.classList.remove('active'));
        preset.classList.add('active');
        timerDuration = parseInt(preset.dataset.minutes) * 60;
        timerRemaining = timerDuration;
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            timerStartBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start';
        }
        timerLabel.textContent = 'Focus';
        updateTimerDisplay();
    });
});

// Initialize timer display
updateTimerDisplay();

// === Ambient Sound Generator (Web Audio API) ===
let audioContext = null;
let currentAmbientNodes = [];
let currentAmbient = 'none';

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function stopAmbient() {
    currentAmbientNodes.forEach(node => {
        try {
            if (node.stop) node.stop();
            if (node.disconnect) node.disconnect();
        } catch (e) {}
    });
    currentAmbientNodes = [];
}

function createNoiseBuffer(ctx, type) {
    const bufferSize = ctx.sampleRate * 4; // 4 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    } else if (type === 'pink') {
        // Pink noise approximation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    } else if (type === 'brown') {
        // Brown noise
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }
    }

    return buffer;
}

function playRain() {
    initAudioContext();
    const ctx = audioContext;

    // Pink noise base for rain sound
    const noiseBuffer = createNoiseBuffer(ctx, 'pink');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Low-pass filter for rain texture
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800;
    lowpass.Q.value = 0.5;

    // High-pass to remove rumble
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 100;

    // Gain
    const gain = ctx.createGain();
    gain.gain.value = 0.4;

    noiseSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start();

    currentAmbientNodes.push(noiseSource, lowpass, highpass, gain);

    // Occasional "drip" sounds
    const dripInterval = setInterval(() => {
        if (currentAmbient !== 'rain') { clearInterval(dripInterval); return; }
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.frequency.setValueAtTime(200 + Math.random() * 600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }, 800 + Math.random() * 1200);

    currentAmbientNodes.push({ stop: () => clearInterval(dripInterval) });
}

function playForest() {
    initAudioContext();
    const ctx = audioContext;

    // Brown noise base for wind/leaves
    const noiseBuffer = createNoiseBuffer(ctx, 'brown');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 400;

    // LFO for wind modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0.25;

    noiseSource.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start();

    currentAmbientNodes.push(noiseSource, lowpass, gain, lfo, lfoGain);

    // Bird chirps
    const birdInterval = setInterval(() => {
        if (currentAmbient !== 'forest') { clearInterval(birdInterval); return; }
        const numChirps = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numChirps; i++) {
            setTimeout(() => {
                if (currentAmbient !== 'forest') return;
                const osc = ctx.createOscillator();
                const oscGain = ctx.createGain();
                const startFreq = 1500 + Math.random() * 2000;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(startFreq * 1.3, ctx.currentTime + 0.05);
                osc.frequency.exponentialRampToValueAtTime(startFreq * 0.8, ctx.currentTime + 0.1);
                oscGain.gain.setValueAtTime(0, ctx.currentTime);
                oscGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
                oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                osc.connect(oscGain);
                oscGain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            }, i * 120);
        }
    }, 3000 + Math.random() * 4000);

    currentAmbientNodes.push({ stop: () => clearInterval(birdInterval) });
}

function playOcean() {
    initAudioContext();
    const ctx = audioContext;

    // Brown noise for wave base
    const noiseBuffer = createNoiseBuffer(ctx, 'brown');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 600;

    // Slow LFO for wave swelling
    const waveLFO = ctx.createOscillator();
    waveLFO.frequency.value = 0.08; // slow waves
    const waveLFOGain = ctx.createGain();
    waveLFOGain.gain.value = 0.15;
    waveLFO.connect(waveLFOGain);

    const gain = ctx.createGain();
    gain.gain.value = 0.2;

    waveLFOGain.connect(gain.gain);

    noiseSource.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start();
    waveLFO.start();

    currentAmbientNodes.push(noiseSource, lowpass, gain, waveLFO, waveLFOGain);
}

function playCafe() {
    initAudioContext();
    const ctx = audioContext;

    // Pink noise base for ambient murmur
    const noiseBuffer = createNoiseBuffer(ctx, 'pink');
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 500;
    bandpass.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start();

    currentAmbientNodes.push(noiseSource, bandpass, gain);

    // Occasional cup clinks
    const clinkInterval = setInterval(() => {
        if (currentAmbient !== 'cafe') { clearInterval(clinkInterval); return; }
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random() * 1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.15);
        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    }, 4000 + Math.random() * 6000);

    currentAmbientNodes.push({ stop: () => clearInterval(clinkInterval) });
}

function playAmbient(type) {
    stopAmbient();
    currentAmbient = type;

    if (type === 'rain') playRain();
    else if (type === 'forest') playForest();
    else if (type === 'ocean') playOcean();
    else if (type === 'cafe') playCafe();
}

// Ambient sound buttons
document.querySelectorAll('.ambient-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const sound = btn.dataset.sound;

        if (sound === currentAmbient) {
            // Toggle off
            stopAmbient();
            currentAmbient = 'none';
            document.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.ambient-btn[data-sound="none"]').classList.add('active');
            return;
        }

        document.querySelectorAll('.ambient-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (sound === 'none') {
            stopAmbient();
            currentAmbient = 'none';
        } else {
            playAmbient(sound);
        }
    });
});

// === Goal Toggle ===
document.querySelectorAll('.goal-item').forEach(goal => {
    goal.addEventListener('click', () => {
        goal.classList.toggle('completed');
        if (!goal.querySelector('.goal-check').textContent) {
            goal.querySelector('.goal-check').textContent = '✓';
        } else {
            goal.querySelector('.goal-check').textContent = '';
        }

        // Update progress
        const goals = document.querySelectorAll('.goal-item');
        const completed = document.querySelectorAll('.goal-item.completed').length;
        const pct = Math.round((completed / goals.length) * 100);
        document.querySelector('.goals-progress > span').textContent = `${completed} of ${goals.length} completed`;
        document.querySelector('.goals-fill').style.setProperty('--w', pct + '%');
    });
});

// === Intersection Observer for fade-in animations ===
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

// Apply fade-in to sections
document.querySelectorAll('.section-header, .progress-card, .flashcard, .feature-chip, .chat-container, .timer-container').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(el);
});

// === Parallax effect on orb ===
const orb = document.querySelector('.knowledge-orb');
if (orb) {
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
}

// === Mobile nav toggle ===
const navBurger = document.getElementById('nav-burger');
const navLinksEl = document.querySelector('.nav-links');

navBurger.addEventListener('click', () => {
    navLinksEl.style.display = navLinksEl.style.display === 'flex' ? 'none' : 'flex';
    if (navLinksEl.style.display === 'flex') {
        navLinksEl.style.position = 'absolute';
        navLinksEl.style.top = '60px';
        navLinksEl.style.right = '0';
        navLinksEl.style.flexDirection = 'column';
        navLinksEl.style.background = 'var(--bg-secondary)';
        navLinksEl.style.padding = '16px';
        navLinksEl.style.borderRadius = 'var(--radius-md)';
        navLinksEl.style.border = '1px solid var(--border)';
        navLinksEl.style.minWidth = '200px';
    }
});

// Close mobile nav when clicking a link
navLinksEl.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            navLinksEl.style.display = 'none';
        }
    });
});
