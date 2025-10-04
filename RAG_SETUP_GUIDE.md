# RAG Integration Setup Guide

This guide will help you integrate your n8n RAG (Retrieval-Augmented Generation) workflows with your SimplyMedi application.

## 🚀 Quick Start

### 1. Configure n8n Workflows

#### Set up your n8n workflows with webhooks:

**Chat Workflow (AI Agent + Pinecone):**
- Activate your chat workflow in n8n
- Note the webhook URL (usually: `http://localhost:5678/webhook/rag-chat`)
- Make sure it accepts POST requests with JSON payload

**Document Processing Workflow (Google Drive + Pinecone):**
- Activate your document processing workflow in n8n
- Note the webhook URL (usually: `http://localhost:5678/webhook/rag-docs`)
- Configure Google Drive triggers and Pinecone storage

### 2. Update Environment Variables

Add these variables to your `server/.env` file:

```env
# n8n RAG Integration
N8N_BASE_URL=http://localhost:5678
RAG_CHAT_WEBHOOK_URL=http://localhost:5678/webhook/rag-chat
RAG_DOCUMENT_WEBHOOK_URL=http://localhost:5678/webhook/rag-docs

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=simplymedi-medical-docs
```

### 3. Set Up Pinecone

1. **Create Pinecone Account:** [https://www.pinecone.io/](https://www.pinecone.io/)
2. **Create an Index:**
   - Name: `simplymedi-medical-docs`
   - Dimensions: 1536 (for OpenAI text-embedding-ada-002)
   - Metric: cosine
3. **Get API Key and Environment** from your Pinecone dashboard

## 🔧 n8n Workflow Configuration

### Chat Workflow Setup

Your chat workflow should handle these inputs:
```json
{
  "message": "User's question about medical topics",
  "context": {
    "userId": "user-uuid",
    "language": "english",
    "reportContext": {
      "reportId": "report-uuid",
      "reportType": "blood_test"
    },
    "sessionId": "session_123",
    "preferences": {
      "responseLength": "medium",
      "technicalLevel": "simplified",
      "includeReferences": true
    }
  }
}
```

Expected response format:
```json
{
  "response": "AI generated response text",
  "sources": [
    {
      "title": "Source document title",
      "content": "Relevant excerpt",
      "confidence": 0.95
    }
  ],
  "confidence": 0.89,
  "contextUsed": true,
  "processingTime": 1200,
  "metadata": {
    "vectorsQueried": 50,
    "similarityThreshold": 0.7,
    "documentsReferenced": ["doc1", "doc2"]
  }
}
```

### Document Processing Workflow Setup

Your document processing workflow should handle:
```json
{
  "document": {
    "fileName": "blood_test_report.pdf",
    "content": "Extracted text content",
    "url": "https://s3.amazonaws.com/bucket/file.pdf",
    "type": "blood_test",
    "metadata": {
      "userId": "user-uuid",
      "reportId": "report-uuid",
      "uploadedAt": "2025-10-04T16:30:00.000Z",
      "category": "medical_report"
    }
  }
}
```

Expected response:
```json
{
  "success": true,
  "message": "Document processed and indexed successfully",
  "embeddings": "embedding_data",
  "vectorIds": ["vec_123", "vec_456"]
}
```

## 📊 Usage Examples

### 1. Basic RAG Chat

```javascript
// In your React component
import RAGChat from '../components/RAGChat';

function ReportDetailPage({ reportId }) {
  return (
    <div>
      <h1>Medical Report</h1>
      {/* Other report content */}
      
      <RAGChat 
        reportId={reportId}
        initialContext={{
          reportType: 'blood_test',
          patientAge: 35,
          technicalLevel: 'simplified'
        }}
      />
    </div>
  );
}
```

### 2. Process Document for RAG

```javascript
// Automatically process reports when uploaded
const processReportForRAG = async (reportId) => {
  try {
    const response = await fetch('/api/rag/process-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reportId })
    });
    
    const result = await response.json();
    console.log('Document processed for RAG:', result);
  } catch (error) {
    console.error('Error processing document:', error);
  }
};
```

### 3. Get Medical Recommendations

```javascript
const getRecommendations = async (reportId) => {
  try {
    const response = await fetch('/api/rag/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        reportId,
        userContext: {
          age: 30,
          gender: 'female',
          language: 'english'
        }
      })
    });
    
    const recommendations = await response.json();
    return recommendations.data;
  } catch (error) {
    console.error('Error getting recommendations:', error);
  }
};
```

## 🔍 API Endpoints

### Chat with RAG
```
POST /api/rag/chat
```

### Process Document
```
POST /api/rag/process-document
```

### Get Recommendations
```
POST /api/rag/recommendations
```

### Search Knowledge Base
```
GET /api/rag/search?q=diabetes&category=general
```

### Health Check
```
GET /api/rag/health
```

### Bulk Process Documents
```
POST /api/rag/bulk-process
```

## 🛠️ Integration Steps

### Step 1: Start n8n
```bash
# If you have n8n installed locally
npx n8n

# Or with Docker
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

### Step 2: Import Workflows
1. Open n8n at `http://localhost:5678`
2. Import your RAG workflows
3. Configure webhooks and credentials
4. Activate the workflows

### Step 3: Test Integration
```bash
# Start your backend server
cd server
npm start

# In another terminal, test the RAG health
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/rag/health
```

### Step 4: Frontend Integration
Add the RAG chat component to your pages:

```javascript
// In your report detail page
import RAGChat from '../components/RAGChat';

<RAGChat reportId={report.id} />
```

## 🔧 Troubleshooting

### Common Issues:

1. **Webhook URLs not working:**
   - Check if n8n is running on port 5678
   - Verify webhook URLs in environment variables
   - Ensure workflows are activated

2. **Pinecone connection issues:**
   - Verify API key and environment
   - Check index name matches configuration
   - Ensure index has correct dimensions (1536 for OpenAI)

3. **RAG responses not contextual:**
   - Check if documents are being processed and stored
   - Verify embedding model consistency
   - Adjust similarity threshold in workflows

### Debug Commands:

```bash
# Check RAG system health
curl -H "Authorization: Bearer TOKEN" localhost:5000/api/rag/health

# Test document processing
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"reportId":"your-report-id"}' \
  localhost:5000/api/rag/process-document

# Test chat
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"query":"What does this blood test mean?"}' \
  localhost:5000/api/rag/chat
```

## 🚀 Next Steps

1. **Configure your n8n workflows** with the correct webhooks
2. **Set up Pinecone** and update environment variables  
3. **Test the integration** using the health check endpoint
4. **Add RAG components** to your React pages
5. **Process existing reports** for RAG indexing

Your RAG system will now provide:
- ✅ **Contextual medical advice** based on user reports
- ✅ **Document-aware responses** using vector similarity search
- ✅ **Multilingual support** through your existing translation system
- ✅ **Source attribution** showing which documents informed responses
- ✅ **Confidence scoring** for AI responses
- ✅ **Fallback mechanisms** when RAG system is unavailable

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Vector Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)