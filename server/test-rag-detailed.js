require('dotenv').config();

async function detailedTest() {
  console.log('🔍 Detailed RAG Integration Test\n');
  console.log('=' .repeat(60));
  
  // Test 1: Upload a SIMPLE medical document
  console.log('\n📤 STEP 1: Uploading a medical document...\n');
  
  const medicalDoc = {
    userId: 'test-user-' + Date.now(),
    reportId: 'blood-test-' + Date.now(),
    fileName: 'blood-test-results.pdf',
    content: `BLOOD TEST REPORT
Patient Name: John Doe
Test Date: October 4, 2025

CHOLESTEROL PANEL:
Total Cholesterol: 220 mg/dL (HIGH - Normal is below 200)
LDL Cholesterol: 150 mg/dL (HIGH - Normal is below 100)  
HDL Cholesterol: 45 mg/dL (LOW - Normal is above 60)
Triglycerides: 180 mg/dL (HIGH - Normal is below 150)

GLUCOSE:
Fasting Blood Sugar: 110 mg/dL (ELEVATED - Normal is 70-100)

RECOMMENDATION: Patient should consult doctor about high cholesterol and blood sugar. Lifestyle changes recommended.`,
    reportType: 'blood_test',
    reportDate: new Date().toISOString(),
    uploadDate: new Date().toISOString()
  };

  try {
    console.log(`   User ID: ${medicalDoc.userId}`);
    console.log(`   Report ID: ${medicalDoc.reportId}`);
    console.log(`   Document length: ${medicalDoc.content.length} characters\n`);
    
    const uploadResponse = await fetch(process.env.RAG_DOCUMENT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicalDoc)
    });

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('   ✅ Document uploaded successfully');
      console.log('   Response:', JSON.stringify(uploadResult, null, 2));
    } else {
      console.log(`   ❌ Upload failed: ${uploadResponse.status}`);
      const errorText = await uploadResponse.text();
      console.log('   Error:', errorText);
      return;
    }
  } catch (error) {
    console.log('   ❌ Upload error:', error.message);
    return;
  }

  // Wait for processing
  console.log('\n⏳ Waiting 10 seconds for document to be processed and indexed...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Test 2: Query about the uploaded document
  console.log('💬 STEP 2: Asking about the cholesterol levels...\n');
  
  const questions = [
    'What is my total cholesterol level?',
    'Are my cholesterol levels normal?',
    'What does the blood test show about my health?'
  ];

  for (const question of questions) {
    console.log(`   Q: "${question}"`);
    
    try {
      const chatPayload = {
        chatInput: question,
        sessionId: 'test-session-' + Date.now(),
        userId: medicalDoc.userId,
        reportId: medicalDoc.reportId,
        language: 'english'
      };

      const chatResponse = await fetch(process.env.RAG_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload)
      });

      if (chatResponse.ok) {
        const chatResult = await chatResponse.json();
        const answer = chatResult.output || chatResult.response || chatResult.answer || chatResult.message;
        
        console.log(`   A: ${answer}\n`);
        
        // Check if answer is relevant
        if (answer.toLowerCase().includes('cholesterol') || 
            answer.toLowerCase().includes('220') ||
            answer.toLowerCase().includes('blood test')) {
          console.log('   ✅ RELEVANT: Answer mentions the uploaded document!\n');
        } else if (answer.toLowerCase().includes('cannot find') || 
                   answer.toLowerCase().includes('no information') ||
                   answer.toLowerCase().includes('knowledge base')) {
          console.log('   ⚠️ NOT FOUND: Vector store doesn\'t have the document yet\n');
        } else {
          console.log('   ⚠️ GENERIC: Answer seems generic, not from uploaded doc\n');
        }
      } else {
        console.log(`   ❌ Query failed: ${chatResponse.status}\n`);
      }
      
      // Small delay between questions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('=' .repeat(60));
  console.log('\n📊 TEST SUMMARY:\n');
  console.log('If answers mention:');
  console.log('  ✅ "220 mg/dL" or "cholesterol" → RAG is working with your document!');
  console.log('  ⚠️  "cannot find" or "no information" → Document not in vector store');
  console.log('  ⚠️  Generic health advice → RAG might have old documents\n');
  console.log('🔧 Next steps if not working:');
  console.log('  1. Check n8n "Executions" tab to see if workflow ran');
  console.log('  2. Verify the "Simple Vector Store" is storing documents');
  console.log('  3. Check if vector store has old documents that need clearing');
  console.log('  4. Ensure both workflows use the SAME vector store instance\n');
}

detailedTest().catch(console.error);
