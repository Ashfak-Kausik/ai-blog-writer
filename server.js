const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Enhanced writer style descriptions with specific patterns
const writerStyles = {
    'neil-patel': `Write EXACTLY like Neil Patel:
STRUCTURE: Start with a bold statistic or surprising claim in the first sentence. Use extensive numbered lists (e.g., "17 Ways to..."). Break content into clear sections with question-based subheadings.
LANGUAGE: Simple, direct, conversational. Avoid jargon. Use "you" and "your" constantly. Short sentences mixed with medium ones.
DATA: Include specific percentages, dollar amounts, and metrics throughout (e.g., "increased traffic by 147%"). Reference studies and tools by name.
FORMATTING: Lots of bullet points, numbered lists, and bold text for emphasis. Include "Pro Tip:" or "Quick Win:" callouts.
TONE: Authoritative but accessible. Confident claims backed by data. Always end sections with clear action steps.
SIGNATURE PHRASES: "Here's the deal:", "Here's what you need to do:", "The bottom line is:", "Want to know the best part?"`,

    'ann-handley': `Write EXACTLY like Ann Handley:
STRUCTURE: Start with a personal story or relatable scenario. Weave narrative throughout. End with inspiration and a call to reflect.
LANGUAGE: Warm, conversational, like talking to a smart friend over coffee. Use contractions liberally. Inject personality and humor.
STYLE: Medium-length paragraphs (3-5 sentences). Mix metaphors and analogies. Reference pop culture, books, everyday life.
TONE: Encouraging, human, authentic. Self-deprecating humor. Acknowledge struggles while being optimistic.
FORMATTING: Minimal bullet points - prefers flowing prose. Uses em-dashes frequently. Occasional italics for emphasis.
SIGNATURE PHRASES: "Here's the thing:", "Let's be honest:", "You know what I mean?", "It's like when..."`,

    'seth-godin': `Write EXACTLY like Seth Godin:
STRUCTURE: Very short paragraphs (1-3 sentences each). No fluff. Get to the point immediately. End with a thought-provoking question or statement.
LANGUAGE: Simple words. Declarative sentences. Almost poetic brevity. Each paragraph is a complete thought.
STYLE: Challenge conventional wisdom. Present contrarian views. Use "us vs them" framing. Make bold claims.
TONE: Philosophical, wise, slightly provocative. Speaks in universal truths.
FORMATTING: Minimal formatting. Natural paragraph breaks. No bullet points or numbered lists. Rarely uses bold/italics.
SIGNATURE STYLE: Start many paragraphs with "And...", "But...", "Of course...". Use metaphors constantly. Short punchy conclusion.`,

    'brian-dean': `Write EXACTLY like Brian Dean (Backlinko):
STRUCTURE: "Skyscraper" format - comprehensive, ultimate guides. Use chapter-style sections with descriptive headings. Include a table of contents feel.
LANGUAGE: Clear, methodical, step-by-step. Explain technical concepts in simple terms. Use "I'll show you..." frequently.
DATA: Heavy on case studies, screenshots descriptions, specific examples. "I increased X by Y%" statements. Reference tools and techniques by exact name.
FORMATTING: Numbered lists for steps. Lots of subheadings (H2, H3). Use "Pro Tip", "Important", "Key Takeaway" boxes.
TONE: Expert teacher, systematic, thorough. "I've tested this..." credibility. Confident but not arrogant.
SIGNATURE PHRASES: "Here's the deal:", "Want to know the best part?", "Now it's your turn:", "Let me show you exactly how:"`,

    'patrick-mckenzie': `Write EXACTLY like Patrick McKenzie (patio11):
STRUCTURE: Long-form, deeply analytical. Build arguments systematically. Nested points within points. Extensive asides and clarifications.
LANGUAGE: Precise, technical when needed. Long, complex sentences with multiple clauses. Academic but readable.
STYLE: Deep dives into business mechanics, pricing psychology, SaaS operations. Use parenthetical asides (like this, frequently). Reference specific examples from his career.
TONE: Thoughtful, measured, incredibly detailed. Teaching mindset. Assumes intelligent audience.
FORMATTING: Long paragraphs. Minimal visual breaks. Occasional bullet points for clarity. Lots of numbered examples.
SIGNATURE STYLE: "Consider:", "For example:", extensive use of colons and semicolons. Qualification statements.`,

    'joanna-penn': `Write EXACTLY like Joanna Penn:
STRUCTURE: Clear sections with encouraging subheadings. Mix personal experience with practical advice. Include inspirational elements.
LANGUAGE: Warm, supportive, direct. British English style. "You can do this" energy throughout.
STYLE: Personal anecdotes from her author journey. Reference books, authors, creative process. Balance inspiration with practicality.
TONE: Encouraging mentor, entrepreneurial, creative-focused. Acknowledges struggles while emphasizing possibility.
FORMATTING: Mix of paragraphs and bullet points. Use questions as headings. "Your turn" style engagement.
SIGNATURE PHRASES: "Here's the thing:", "You might be wondering:", "I learned this the hard way:", "Let's dive in:"`,

    'neil-gaiman': `Write EXACTLY like Neil Gaiman:
STRUCTURE: Narrative flow, even in non-fiction. Begin with a story or vivid scene. Let ideas unfold naturally. Circular endings that callback to opening.
LANGUAGE: Literary, elegant, precise word choice. Varied sentence length - from very short to flowing long. Poetic without being purple.
STYLE: Rich imagery and metaphor. Treat non-fiction topics as stories. Include tangential musings. References to mythology, literature, dreams.
TONE: Wise storyteller, whimsical yet profound. Invites reader into a shared experience.
FORMATTING: Flowing paragraphs. Minimal lists. Natural breaks. Occasional italics for emphasis or internal thought.
SIGNATURE STYLE: "I once...", "There's a story about...", "Imagine...", philosophical observations woven throughout.`,

    'tim-ferriss': `Write EXACTLY like Tim Ferriss:
STRUCTURE: Framework-based. "The 4-Hour" approach - efficiency focus. Start with contrarian premise. Include case studies of specific people.
LANGUAGE: Direct, systematic, analytical. Use abbreviations (e.g., "80/20", "ROI"). Quantify everything.
STYLE: Experiment-based. "I tested this for X weeks/months". Include specific protocols, dosages, times. Name-drop experts and books.
TONE: Efficiency-obsessed, tactical, "life-hacking" mindset. Question assumptions. Data-driven.
FORMATTING: Lots of bullet points and numbered lists. Tables/matrices descriptions. "If-then" frameworks. FAQ sections.
SIGNATURE PHRASES: "Here's what I learned:", "The key is:", "What if you could...", "The 80/20 of X is:", "Here's the protocol:"`,

    'james-clear': `Write EXACTLY like James Clear:
STRUCTURE: Research study opening → Framework introduction → Practical application → Real examples. Clear 3-part structure often.
LANGUAGE: Crystal clear, simple words. Short sentences. One idea per sentence. Builds complexity gradually.
STYLE: Scientific studies cited. "Habit stacking" and systems thinking. Use specific examples (e.g., "a pilot in WWII"). Create memorable frameworks.
TONE: Calm authority, science-backed, practical. Patient teacher. Non-judgmental.
FORMATTING: Short paragraphs (2-4 sentences). Strategic use of bold for key concepts. Occasional numbered lists. Lots of white space.
SIGNATURE PHRASES: "Here's why:", "Research shows:", "The key insight is:", "Let me explain:", "Consider this example:"`,

    'neutral': 'Write in a balanced, professional style suitable for most audiences. Clear structure with introduction, body sections with subheadings, and conclusion. Professional but engaging tone. Mix of paragraphs and occasional lists. Data-supported where relevant.'
};

// API endpoint to generate blog
app.post('/api/generate-blog', async (req, res) => {
    try {
        const { 
            topic, 
            writerStyle = 'neutral',
            tone = 'professional',
            seoKeyword,
            wordCount = 1000,
            instructions,
            writingSample,
            targetKeywords,
            forbiddenWords,
            humanize = false,
            addData = false,
            addExamples = false,
            seoOptimize = false
        } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        // Build the comprehensive prompt
        let prompt = `You are an expert blog writer. Write a comprehensive, engaging blog post about: "${topic}"\n\n`;

        prompt += `CRITICAL RULES YOU MUST FOLLOW:
1. The blog title (H1) MUST be exactly: "${topic}"
2. Target word count is ${wordCount} words - write between ${Math.floor(wordCount * 0.9)} and ${Math.ceil(wordCount * 1.1)} words
3. NEVER make up statistics, research, or studies - if you mention data, use phrases like "studies suggest", "research indicates" (general) OR add [citation needed] markers
4. Be factually accurate - do not invent specific numbers or percentages unless they are well-known facts
\n\n`;

        // Add writer style
        if (writerStyles[writerStyle]) {
            prompt += `${writerStyles[writerStyle]}\n\n`;
        }

        // Add writing sample if provided (HUGE accuracy boost!)
        if (writingSample) {
            prompt += `CRITICAL: Study this writing sample carefully and mimic its EXACT style, voice, rhythm, and patterns:\n\n`;
            prompt += `--- WRITING SAMPLE START ---\n${writingSample}\n--- WRITING SAMPLE END ---\n\n`;
            prompt += `You MUST write in this exact same style. Pay attention to: sentence structure, vocabulary choices, paragraph length, tone, formatting patterns, and any unique stylistic elements.\n\n`;
        }

        // Add tone guidance
        const toneGuidance = {
            'professional': 'Use a professional, authoritative tone.',
            'conversational': 'Use a conversational, friendly tone as if talking to a colleague.',
            'formal': 'Use a formal, academic tone with proper citations and structured arguments.',
            'casual': 'Use a casual, relaxed tone with simple language.',
            'technical': 'Use technical language appropriate for expert readers.',
            'storytelling': 'Use narrative storytelling techniques with vivid descriptions.'
        };
        prompt += `Tone: ${toneGuidance[tone] || toneGuidance.professional}\n\n`;

        // Add SEO keyword if provided
        if (seoKeyword) {
            // Better SEO keyword density formula based on your feedback
            let targetKeywordCount;
            if (wordCount <= 1500) {
                targetKeywordCount = Math.ceil(wordCount / 300); // ~4-5 times for 1200-1500 words
            } else if (wordCount <= 2500) {
                targetKeywordCount = Math.ceil(wordCount / 350); // ~6-7 times for 2000-2500 words
            } else {
                targetKeywordCount = Math.ceil(wordCount / 400); // ~8-10 times for 3000+ words
            }
            
            prompt += `SEO PRIMARY KEYWORD: "${seoKeyword}"\n`;
            prompt += `- Use this keyword approximately ${targetKeywordCount} times throughout the blog (natural SEO density)\n`;
            prompt += `- Include in: H1 title, at least one H2 heading, introduction, conclusion, and naturally throughout body\n`;
            prompt += `- Avoid keyword stuffing - integrate naturally and contextually\n\n`;
        }

        // Add target keywords with specific frequency
        if (targetKeywords) {
            prompt += `TARGET KEYWORDS WITH REQUIRED FREQUENCY:\n`;
            const keywordPairs = targetKeywords.split(',').map(k => k.trim());
            keywordPairs.forEach(pair => {
                const [keyword, count] = pair.split(':').map(s => s.trim());
                if (keyword && count) {
                    prompt += `- "${keyword}" must appear EXACTLY ${count} times throughout the blog\n`;
                }
            });
            prompt += `Ensure these keywords are integrated naturally and meet the exact count requirements.\n\n`;
        }

        // Add forbidden words
        if (forbiddenWords) {
            const forbiddenList = forbiddenWords.split(',').map(w => w.trim()).filter(w => w);
            if (forbiddenList.length > 0) {
                prompt += `FORBIDDEN WORDS - NEVER use these words anywhere in the blog: ${forbiddenList.join(', ')}\n`;
                prompt += `If you must express a similar concept, use alternative vocabulary.\n\n`;
            }
        }

        // Add enhancement instructions
        const enhancements = [];
        
        if (humanize) {
            enhancements.push('- Write like a human: vary sentence length dramatically (mix very short punchy sentences with longer flowing ones), use contractions, add personal touches, include rhetorical questions, and avoid robotic patterns');
        }
        
        if (addData) {
            enhancements.push('- Include relevant data and statistics, BUT ONLY use well-known facts or add [citation needed] markers for claims that would need verification. DO NOT invent specific percentages or study results.');
        }
        
        if (addExamples) {
            enhancements.push('- Include concrete real-world examples, case studies, or hypothetical scenarios to illustrate points');
        }
        
        if (seoOptimize) {
            enhancements.push('- SEO OPTIMIZATION: Use descriptive H2/H3 headings with keywords, include primary keyword in first 100 words, ensure proper heading hierarchy (H1 > H2 > H3), add meta-relevant content in conclusion');
        }

        if (enhancements.length > 0) {
            prompt += 'Special Instructions:\n' + enhancements.join('\n') + '\n\n';
        }

        // Add custom instructions
        if (instructions) {
            prompt += `Additional Requirements: ${instructions}\n\n`;
        }

        // Core requirements
        prompt += `STRUCTURE REQUIREMENTS:
- Start with H1 title: # ${topic}
- CRITICAL: Target word count is ${wordCount} words - you MUST write at least ${Math.floor(wordCount * 0.93)} words (do not write significantly less)
- Maximum ${Math.ceil(wordCount * 1.15)} words (do not go significantly over)
- Include an attention-grabbing introduction
- Use clear H2 headings for main sections, H3 for subsections
- Provide valuable, actionable information
- Strong conclusion with key takeaways
- Format everything in proper markdown
- Make it engaging and worth reading

Write the complete blog post now, starting with "# ${topic}":`;

        console.log('Generating blog post for topic:', topic);
        console.log('Style:', writerStyle, '| Tone:', tone, '| Words:', wordCount);

        // Call Groq API with Llama model
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: humanize ? 0.8 : 0.7,
            max_tokens: Math.min(8000, Math.ceil(wordCount * 1.8)), // More reasonable token limit
        });

        const blogContent = chatCompletion.choices[0].message.content;

        console.log('✅ Blog post generated successfully!');
        console.log('📊 Approximate length:', blogContent.split(' ').length, 'words');

        res.json({ 
            success: true, 
            blog: blogContent 
        });

    } catch (error) {
        console.error('Error generating blog:', error);
        res.status(500).json({ 
            error: 'Failed to generate blog post',
            details: error.message 
        });
    }
});

// API endpoint to send to Google Docs
app.post('/api/send-to-docs', async (req, res) => {
    try {
        const { content, scriptUrl } = req.body;

        if (!scriptUrl) {
            return res.status(400).json({ 
                error: 'Google Apps Script URL is required' 
            });
        }

        // Send to Google Apps Script
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
            redirect: 'follow'
        });

        const data = await response.text();

        res.json({ 
            success: true, 
            message: 'Blog post sent to Google Docs successfully!' 
        });

    } catch (error) {
        console.error('Error sending to Google Docs:', error);
        res.status(500).json({ 
            error: 'Failed to send to Google Docs',
            details: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Blog Writer Pro server running at http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser`);
    console.log(`⚡ Using Groq AI with Llama 3.3 (FREE & FAST)`);
    console.log(`✨ Enhanced with ${Object.keys(writerStyles).length} writing styles`);
});