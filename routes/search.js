const express = require('express');
const router = express.Router();

// Web search function using Tavily API
async function searchWeb(query) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
        max_results: 5,
        include_domains: [],
        exclude_domains: []
      })
    });

    const data = await response.json();
    
    // Use answer if available
    if (data.answer) {
      return {
        success: true,
        answer: data.answer,
        sources: data.results?.slice(0, 2).map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.substring(0, 150) + '...'
        })) || []
      };
    }
    
    // Use first result content if no answer
    if (data.results && data.results.length > 0) {
      const topResult = data.results[0];
      return {
        success: true,
        answer: topResult.content || 'Information found but no details available',
        sources: data.results.slice(0, 2).map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.substring(0, 150) + '...'
        }))
      };
    }
    
    return { success: false, error: 'No search results found' };
  } catch (error) {
    console.error('Search error:', error);
    return { success: false, error: 'Search service unavailable' };
  }
}

// Export for use in voice agent
router.searchWeb = searchWeb;

module.exports = router;