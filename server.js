const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8092;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // === AI Chat API endpoint ===
    if (url.pathname === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { message, history } = JSON.parse(body);

                // Build a study-tutor prompt
                const systemPrompt = `You are Lumina, a friendly and knowledgeable AI study companion. Your job is to help students learn by providing clear, accurate, and engaging explanations. Break complex topics into simple steps. Use examples and analogies when helpful. Keep answers concise but thorough — aim for 2-4 short paragraphs. Use occasional emojis sparingly for warmth. If asked to create flashcards or quiz, offer to do so. You are encouraging and patient.`;

                // Build conversation context from history
                let conversationContext = '';
                if (history && history.length > 0) {
                    history.slice(-6).forEach(h => {
                        conversationContext += `${h.role === 'user' ? 'Student' : 'Lumina'}: ${h.content}\n`;
                    });
                }

                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...(history.slice(-6).map(h => ({
                        role: h.role === 'user' ? 'user' : 'assistant',
                        content: h.content
                    }))),
                    { role: 'user', content: message }
                ];

                // Call the AI API
                const aiResponse = await callAIApi(messages, 500);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                if (aiResponse) {
                    res.end(JSON.stringify({ reply: aiResponse }));
                } else {
                    res.end(JSON.stringify({ reply: "I'm having trouble connecting to my AI brain right now. The free AI service may be rate-limited — please try again in a moment. 🌟" }));
                }
            } catch (err) {
                console.error('Chat API error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }));
            }
        });
        return;
    }

    // === Flashcard generation API endpoint ===
    if (url.pathname === '/api/flashcards' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { topic, count } = JSON.parse(body);
                const numCards = count || 5;

                const systemPrompt = `You are a flashcard generator for a study app called Lumina. Generate exactly ${numCards} educational flashcards about "${topic}". Return ONLY valid JSON in this exact format — no markdown, no code blocks, no extra text:

[{"question":"clear question","answer":"concise answer","category":"${topic}"}]

Make questions test real understanding, not just memorization. Keep answers to 1-2 sentences. Vary difficulty across cards.`;

                let cards = [];

                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate ${numCards} flashcards about: ${topic}` }
                ];

                const aiText = await callAIApi(messages, 1000);

                if (aiText) {
                    cards = extractJsonArray(aiText);
                }

                // If still no cards, retry after a short delay (rate limit cooldown)
                if (cards.length === 0) {
                    await new Promise(r => setTimeout(r, 2000));
                    const retryMessages = [
                        { role: 'system', content: `Output ONLY a JSON array of ${numCards} flashcards about ${topic}. Format: [{"question":"text","answer":"text","category":"${topic}"}]. No other text.` },
                        { role: 'user', content: `Make ${numCards} flashcards about ${topic}` }
                    ];
                    const retryText = await callAIApi(retryMessages, 1000);
                    if (retryText) {
                        cards = extractJsonArray(retryText);
                    }
                }

                // Last resort retry with another delay
                if (cards.length === 0) {
                    await new Promise(r => setTimeout(r, 3000));
                    const retryMessages = [
                        { role: 'system', content: `Create ${numCards} study flashcards about ${topic}. Return only the JSON array: [{"question":"q","answer":"a","category":"${topic}"}]` },
                        { role: 'user', content: `${numCards} flashcards about ${topic}, JSON only` }
                    ];
                    const retryText = await callAIApi(retryMessages, 1000);
                    if (retryText) {
                        cards = extractJsonArray(retryText);
                    }
                }

                if (cards.length > 0) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ flashcards: cards }));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ flashcards: [], error: 'The AI service is rate-limited right now. Please wait a few seconds and try again.' }));
                }
            } catch (err) {
                console.error('Flashcard API error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ flashcards: [], error: 'Could not generate flashcards. Please try again.' }));
            }
        });
        return;
    }

    // === Static file serving ===
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    filePath = path.join(ROOT, filePath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

// === Robust JSON array extractor ===
// The AI may wrap JSON in markdown blocks, add commentary, or use single quotes.
// This function tries multiple strategies to extract a valid JSON array.
function extractJsonArray(text) {
    if (!text || typeof text !== 'string') return [];

    // Strategy 1: Strip markdown code blocks and try direct parse
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {}

    // Strategy 2: Find the first JSON array in the text using regex
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
        try {
            const parsed = JSON.parse(arrayMatch[0]);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}

        // Strategy 3: Fix common issues — single quotes to double, trailing commas
        let fixed = arrayMatch[0]
            .replace(/'/g, '"')           // single quotes to double
            .replace(/,\s*]/g, ']')       // trailing comma before ]
            .replace(/,\s*}/g, '}')       // trailing comma before }
            .replace(/\n/g, ' ');         // newlines to spaces
        try {
            const parsed = JSON.parse(fixed);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }

    // Strategy 4: Try line-by-line extraction of Q&A pairs
    const lines = text.split('\n');
    const cards = [];
    let currentQ = null;
    let currentA = null;

    for (let line of lines) {
        line = line.trim();
        const qMatch = line.match(/(?:^|\s)(?:Q|Question)[:\)]?\s*(.+)/i);
        const aMatch = line.match(/(?:^|\s)(?:A|Answer)[:\)]?\s*(.+)/i);
        if (qMatch) {
            if (currentQ && currentA) {
                cards.push({ question: currentQ, answer: currentA, category: 'Study' });
            }
            currentQ = qMatch[1].replace(/[""]/g, '').trim();
            currentA = null;
        } else if (aMatch) {
            currentA = aMatch[1].replace(/[""]/g, '').trim();
        }
    }
    if (currentQ && currentA) {
        cards.push({ question: currentQ, answer: currentA, category: 'Study' });
    }

    return cards;
}

// === Rate limit tracker for Pollinations AI ===
// Free tier: 1 request per 45 seconds per IP
let lastApiCallTime = 0;
const API_COOLDOWN = 46000; // 46 seconds, slightly over the limit

// Simple in-memory cache for AI responses
const aiCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

function getCached(key) {
    const entry = aiCache.get(key);
    if (entry && Date.now() - entry.time < CACHE_TTL) {
        return entry.data;
    }
    return null;
}

function setCached(key, data) {
    aiCache.set(key, { data, time: Date.now() });
}

function timeUntilNextCall() {
    const elapsed = Date.now() - lastApiCallTime;
    return Math.max(0, API_COOLDOWN - elapsed);
}

// === AI call function ===
// Uses Pollinations free AI with rate limit awareness + caching
async function callAIApi(messages, maxTokens = 500) {
    // Create a cache key from the messages
    const cacheKey = JSON.stringify(messages);

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
        console.log('AI response from cache');
        return cached;
    }

    // Check if we need to wait for rate limit
    const waitTime = timeUntilNextCall();
    if (waitTime > 0) {
        console.log(`Rate limit: waiting ${Math.ceil(waitTime/1000)}s before AI call...`);
        await new Promise(r => setTimeout(r, waitTime));
    }

    const providers = [
        {
            name: 'pollinations-text',
            method: 'GET',
            buildUrl: (msgs) => {
                const combined = msgs.map(m => m.content).join('\n\n');
                return `https://text.pollinations.ai/${encodeURIComponent(combined)}`;
            },
            headers: { 'referrer': 'http://127.0.0.1:8092' },
        },
        {
            name: 'pollinations-openai',
            method: 'POST',
            url: 'https://text.pollinations.ai/openai',
            body: { model: 'openai', messages, temperature: 0.7, max_tokens: maxTokens },
            headers: { 'Content-Type': 'application/json', 'referrer': 'http://127.0.0.1:8092' },
        },
    ];

    for (const provider of providers) {
        try {
            lastApiCallTime = Date.now();

            const url = provider.buildUrl ? provider.buildUrl(messages) : provider.url;
            const options = {
                method: provider.method,
                headers: provider.headers || {},
                signal: AbortSignal.timeout(30000),
            };
            if (provider.body) {
                options.body = JSON.stringify(provider.body);
            }

            const response = await fetch(url, options);

            if (!response.ok) {
                console.log(`Provider ${provider.name} returned status ${response.status}`);
                // If rate limited, don't try next provider immediately
                if (response.status === 402) {
                    const wait = 46000;
                    console.log(`Rate limited, waiting ${wait/1000}s...`);
                    await new Promise(r => setTimeout(r, wait));
                    lastApiCallTime = Date.now();
                    // Retry once
                    const retryResp = await fetch(url, options);
                    if (retryResp.ok) {
                        if (provider.body) {
                            const data = await retryResp.json();
                            const text = data.choices?.[0]?.message?.content;
                            if (text && text.trim().length > 0) {
                                setCached(cacheKey, text.trim());
                                return text.trim();
                            }
                        } else {
                            const text = await retryResp.text();
                            if (text && text.trim().length > 0) {
                                setCached(cacheKey, text.trim());
                                return text.trim();
                            }
                        }
                    }
                }
                continue;
            }

            if (provider.body) {
                const data = await response.json();
                const text = data.choices?.[0]?.message?.content;
                if (text && text.trim().length > 0) {
                    setCached(cacheKey, text.trim());
                    return text.trim();
                }
            } else {
                const text = await response.text();
                if (text && text.trim().length > 0) {
                    setCached(cacheKey, text.trim());
                    return text.trim();
                }
            }
        } catch (err) {
            console.log(`Provider ${provider.name} error: ${err.message}`);
        }
    }

    return null;
}

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Lumina server running at http://127.0.0.1:${PORT}/`);
});
