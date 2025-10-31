require('dotenv').config();
const searchRouter = require('./routes/search');

// Test search functionality
async function testSearch() {
  console.log('🔍 Testing Web Search Functionality\n');
  
  const testQueries = [
    'iPhone 15 current price in India',
    'Tesla Model 3 latest features 2024',
    'Microsoft stock price today',
    'OpenAI GPT-4 pricing',
    'Bitcoin current value USD'
  ];
  
  for (const query of testQueries) {
    console.log(`\n📋 Query: "${query}"`);
    console.log('⏳ Searching...');
    
    try {
      const result = await searchRouter.searchWeb(query);
      
      if (result.success) {
        console.log('✅ Search Result:');
        console.log(`📝 Answer: ${result.answer}`);
        
        if (result.sources && result.sources.length > 0) {
          console.log('\n📚 Sources:');
          result.sources.forEach((source, index) => {
            console.log(`${index + 1}. ${source.title}`);
            console.log(`   ${source.url}`);
            console.log(`   ${source.snippet}\n`);
          });
        }
      } else {
        console.log('❌ Search Failed:', result.error);
      }
      
    } catch (error) {
      console.log('💥 Error:', error.message);
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('\n🎯 Search Test Complete!');
  process.exit(0);
}

// Check if API key is configured
if (!process.env.TAVILY_API_KEY) {
  console.log('❌ Tavily API Key not found in .env file!');
  process.exit(1);
}

console.log('🔍 Using Tavily Search API');
testSearch();