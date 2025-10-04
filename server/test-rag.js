require('dotenv').config();

async function testRAG() {
  console.log('🔍 Testing RAG Integration...\n');
  
  // Test 1: Check environment variables
  console.log('1️⃣ Checking environment variables:');
  console.log('   RAG_CHAT_WEBHOOK_URL:', process.env.RAG_CHAT_WEBHOOK_URL ? '✅ Set' : '❌ Not set');
  console.log('   RAG_DOCUMENT_WEBHOOK_URL:', process.env.RAG_DOCUMENT_WEBHOOK_URL ? '✅ Set' : '❌ Not set');
  console.log('');
  
  if (!process.env.RAG_CHAT_WEBHOOK_URL) {
    console.log('❌ RAG_CHAT_WEBHOOK_URL is not configured!');
    return;
  }
  
  // Test 2: Send a test document
  console.log('2️⃣ Testing document upload to RAG...');
  try {
    const testDocument = {
      userId: 'test-user-123',
      reportId: 'test-report-456',
      fileName: 'test-blood-report.pdf',
      content: `
        BLOOD TEST REPORT
        Patient: Test Patient
        Date: October 4, 2025
        
        COMPLETE BLOOD COUNT:
        Hemoglobin: 14.5 g/dL (Normal: 13.5-17.5)
        White Blood Cells: 7,500 cells/μL (Normal: 4,000-11,000)
        Platelets: 250,000 cells/μL (Normal: 150,000-400,000)
        
        LIPID PROFILE:
        Total Cholesterol: 190 mg/dL (Normal: <200)
        LDL Cholesterol: 110 mg/dL (Normal: <100)
        HDL Cholesterol: 55 mg/dL (Normal: >40)
        Triglycerides: 125 mg/dL (Normal: <150)
        
        NOTES: Slightly elevated LDL cholesterol. Recommend dietary modifications.
      `,
      reportType: 'blood_test',
      uploadDate: new Date().toISOString()
    };
    
    const docResponse = await fetch(process.env.RAG_DOCUMENT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDocument)
    });
    
    if (docResponse.ok) {
      console.log('   ✅ Document uploaded successfully to RAG system');
      const docResult = await docResponse.json();
      console.log('   Response:', JSON.stringify(docResult, null, 2));
    } else {
      console.log(`   ❌ Document upload failed: ${docResponse.status} ${docResponse.statusText}`);
      const errorText = await docResponse.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('   ❌ Error uploading document:', error.message);
  }
  
  console.log('');
  
  // Wait a bit for processing
  console.log('⏳ Waiting 5 seconds for document processing...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test 3: Query the RAG system
  console.log('3️⃣ Testing chat query to RAG...');
  try {
    const testQuery = {
      chatInput: 'What are my cholesterol levels according to my latest blood test?',
      sessionId: 'test-session-' + Date.now(),
      userId: 'test-user-123',
      language: 'english'
    };
    
    console.log('   Sending query:', testQuery.chatInput);
    
    const chatResponse = await fetch(process.env.RAG_CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testQuery)
    });
    
    if (chatResponse.ok) {
      console.log('   ✅ Chat query successful');
      const chatResult = await chatResponse.json();
      console.log('   Response:', JSON.stringify(chatResult, null, 2));
      console.log('');
      
      // Extract the actual answer
      const answer = chatResult.output || chatResult.response || chatResult.answer || chatResult.message;
      if (answer) {
        console.log('   💬 AI Response:');
        console.log('   ' + answer);
      }
    } else {
      console.log(`   ❌ Chat query failed: ${chatResponse.status} ${chatResponse.statusText}`);
      const errorText = await chatResponse.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('   ❌ Error querying RAG:', error.message);
  }
  
  console.log('\n✨ Test complete!');
}

testRAG().catch(console.error);
