const express = require('express');
const router = express.Router();

// Enhance AI instructions endpoint
router.post('/enhance-instructions', async (req, res) => {
  try {
    const { instructions } = req.body;

    if (!instructions || instructions.trim().length === 0) {
      return res.status(400).json({ error: 'Instructions are required' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: `You are an expert at creating AI voice agent instructions for OpenAI Realtime API phone calls. Transform basic instructions into detailed, conversational guidelines that ensure natural phone conversations.

FORMAT REQUIREMENTS:
- Start with clear GREETING instructions
- Break conversation into numbered STEPS
- Include specific PAUSE points where AI should wait for user response
- Add LISTENING guidelines for handling interruptions
- Include OBJECTION HANDLING scenarios
- End with clear CLOSING instructions

CONVERSATION RULES:
- Always pause after questions and wait for responses
- Never rush through multiple steps at once
- Listen carefully to what the user actually says
- Be conversational, not robotic
- Keep responses concise and natural
- Handle interruptions gracefully

Create professional phone call instructions that follow this structure.`
        }, {
          role: 'user',
          content: `Transform these basic instructions into detailed AI voice agent guidelines for phone calls: ${instructions}`
        }],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const enhancedInstructions = data.choices[0].message.content;
    console.log('Enhanced Instructions:', enhancedInstructions);
    res.json({ enhancedInstructions });
  } catch (error) {
    console.error('Error enhancing instructions:', error);
    res.status(500).json({ error: 'Failed to enhance instructions' });
    console.error(error);
  }
});

module.exports = router;