require('dotenv').config();

async function testMedicalPrompts() {
  console.log('\n🏥 Testing Medical Report Questions\n');
  console.log('=' .repeat(70));
  console.log('\nUsing your actual uploaded medical documents...\n');

  const medicalQuestions = [
    "What are my blood sugar levels?",
    "Do I have diabetes according to my reports?",
    "What is my kidney function status?",
    "What are my cholesterol levels?",
    "What health problems are shown in my medical reports?",
    "What is my HbA1c level?",
    "Do I have any kidney disease?",
    "What medications should I consider based on my reports?",
    "Summarize my overall health status from the reports",
    "What lifestyle changes should I make based on these results?"
  ];

  for (let i = 0; i < medicalQuestions.length; i++) {
    const question = medicalQuestions[i];
    console.log(`\n${i + 1}. Question: "${question}"\n`);

    try {
      const payload = {
        chatInput: question,
        sessionId: 'medical-session-' + Date.now(),
        userId: 'real-user-test',
        language: 'english'
      };

      const response = await fetch(process.env.RAG_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const answer = result.output || result.response || result.answer || result.message;
        
        console.log(`   Answer: ${answer}\n`);
        
        // Check relevance
        const medicalTerms = ['diabetes', 'glucose', 'kidney', 'cholesterol', 'creatinine', 
                             'hba1c', 'ldl', 'hdl', 'triglyceride', 'blood pressure', 
                             'ckd', 'renal', 'dyslipidemia', 'hyperkalemia'];
        
        const hasRelevantTerms = medicalTerms.some(term => 
          answer.toLowerCase().includes(term)
        );
        
        if (hasRelevantTerms) {
          console.log('   ✅ Response contains medical data from reports\n');
        } else {
          console.log('   ⚠️  Response may be generic\n');
        }
        
        console.log('-' .repeat(70));
        
      } else {
        console.log(`   ❌ Query failed: ${response.status}\n`);
      }
      
      // Small delay between questions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n' + '=' .repeat(70));
  console.log('\n✨ Test Complete!\n');
  console.log('💡 If all answers contain specific medical values (like "162 mg/dL"),');
  console.log('   then your RAG system is successfully using your uploaded documents!\n');
}

testMedicalPrompts().catch(console.error);
