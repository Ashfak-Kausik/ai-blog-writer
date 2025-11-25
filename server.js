const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// API endpoint to generate blog
app.post('/api/generate-blog', async (req, res) => {
    try {
        const { topic, instructions } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        // Build the prompt
        let prompt = `Write a comprehensive, engaging blog post about: "${topic}"\n\n`;
        
        if (instructions) {
            prompt += `Additional instructions: ${instructions}\n\n`;
        }
        
        prompt += `Requirements:
- Write in a professional yet engaging tone
- Include an attention-grabbing introduction
- Use clear headings and subheadings (use ## for main sections, ### for subsections)
- Provide valuable, actionable information
- Include a strong conclusion
- Format in markdown
- Aim for 800-1200 words`;

        console.log('Generating blog post for topic:', topic);

        // Call Claude API
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const blogContent = message.content[0].text;

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

// API endpoint to send to Google Docs (placeholder for now)
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
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error('Failed to send to Google Docs');
        }

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
    console.log(`🚀 AI Blog Writer server running at http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser`);
});