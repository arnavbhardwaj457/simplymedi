require('dotenv').config();

async function testChatDirectly() {
  console.log('\n🧪 Testing Chat API Directly\n');
  console.log('='.repeat(60));

  const testMessage = "what is my sugar level";
  
  console.log(`\n📤 Sending question: "${testMessage}"\n`);

  try {
    // Simulate a real API call to the chat endpoint
    const response = await fetch('http://localhost:5000/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      },
      body: JSON.stringify({
        message: testMessage,
        sessionId: 'test-session-' + Date.now(),
        language: 'english'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Chat API Response:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Chat API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Request Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Check server logs for RAG integration messages:');
  console.log('   - Look for: "🤖 Querying n8n RAG system..."');
  console.log('   - Look for: "✅ RAG response received"');
  console.log('   - Look for: "⚠️ RAG system error"\n');
}

testChatDirectly().catch(console.error);
