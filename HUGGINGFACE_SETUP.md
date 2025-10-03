# Hugging Face Models for SimplyMedi Healthcare Application

## 🏥 Recommended Models for Healthcare

### 1. **Chat Completion** - `microsoft/DialoGPT-medium`
**Purpose**: Medical consultation and patient interaction
- **Use Case**: Answering medical queries, patient support
- **Why**: Fine-tuned for conversational AI, good at maintaining context
- **Alternative**: `microsoft/DialoGPT-large` (better quality, slower response)

### 2. **Medical Text Analysis** - `emilyalsentzer/Bio_ClinicalBERT`
**Purpose**: Extract medical entities, analyze clinical text
- **Use Case**: Processing medical reports, identifying conditions/symptoms
- **Why**: Trained specifically on biomedical literature and clinical notes
- **Alternative**: `dmis-lab/biobert-base-cased-v1.1`

### 3. **Translation** - `facebook/mbart-large-50-many-to-many-mmt`
**Purpose**: Multi-language support for healthcare
- **Use Case**: Translating medical information for diverse patients
- **Why**: Supports 50+ languages including medical terminology
- **Alternative**: `Helsinki-NLP/opus-mt-en-mul` (lighter model)

### 4. **Medical Image Generation** - `runwayml/stable-diffusion-v1-5`
**Purpose**: Generate medical diagrams and educational content
- **Use Case**: Creating anatomical diagrams, medical illustrations
- **Why**: High-quality image generation with good prompt understanding
- **Alternative**: `CompVis/stable-diffusion-v1-4`

### 5. **Medical NER** - `dmis-lab/biobert-base-cased-v1.1`
**Purpose**: Named Entity Recognition for medical texts
- **Use Case**: Identifying drugs, diseases, symptoms, treatments
- **Why**: Specialized for biomedical named entity recognition

## 🔧 Setup Instructions

### 1. Get Hugging Face API Token
1. Go to https://huggingface.co/
2. Create an account or log in
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token (starts with `hf_`)

### 2. Update Environment Variables
Add to your `.env` file:
```env
HUGGINGFACE_API_KEY=hf_your_token_here
```

### 3. Model Configuration (Already Done)
The models are pre-configured in `server/services/aiService.js`:

```javascript
this.models = {
  chatCompletion: 'microsoft/DialoGPT-medium',
  medicalBert: 'emilyalsentzer/Bio_ClinicalBERT',
  textToImage: 'runwayml/stable-diffusion-v1-5',
  translation: 'facebook/mbart-large-50-many-to-many-mmt',
  medicalNER: 'dmis-lab/biobert-base-cased-v1.1'
};
```

## 📊 Model Performance & Cost

### Free Tier Limitations:
- **Rate Limits**: 1,000 requests/month per model
- **Response Time**: Can be slower during peak hours
- **Model Loading**: Initial requests may timeout while model loads

### Recommendations for Production:
1. **Paid Inference Endpoints**: For faster, guaranteed response times
2. **Model Caching**: Implement response caching for common queries
3. **Fallback Responses**: Always have local fallbacks (already implemented)

## 🚀 Testing Your Setup

### 1. Test Chat Function:
```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the symptoms of high blood pressure?", "sessionId": "test-123"}'
```

### 2. Test Medical Entity Extraction:
The system will automatically extract medical entities from chat messages when HF API key is configured.

### 3. Test Translation:
Medical responses can be automatically translated to different languages when the translation service is enabled.

## 🔄 Model Alternatives by Use Case

### For Better Chat Quality:
- `facebook/blenderbot-400M-distill` - Good conversational AI
- `microsoft/DialoGPT-large` - Better responses, slower
- `EleutherAI/gpt-neo-2.7B` - More creative responses

### For Medical Text Processing:
- `allenai/scibert_scivocab_uncased` - Scientific text understanding
- `emilyalsentzer/Bio_Discharge_Summary_BERT` - Discharge summary processing
- `bionlp/bluebert_pubmed_mimic_uncased_L-24_H-1024_A-16` - Clinical notes

### For Multilingual Support:
- `Helsinki-NLP/opus-mt-*` models for specific language pairs
- `google/mt5-small` - Multilingual T5 for translation
- `facebook/m2m100_418M` - Direct multilingual translation

## 🔍 Monitoring & Debugging

### Check Model Status:
```javascript
// In your application
console.log('Available models:', aiService.models);
console.log('HF API configured:', !!process.env.HUGGINGFACE_API_KEY);
```

### Common Issues:
1. **Model Loading Timeout**: Wait 30-60 seconds and retry
2. **Rate Limit Exceeded**: Implement request queuing
3. **Invalid Token**: Check token permissions and validity

## 📈 Scaling Considerations

### For High Volume:
1. **Inference Endpoints**: Deploy dedicated endpoints
2. **Model Optimization**: Use quantized or distilled models
3. **Load Balancing**: Distribute requests across multiple models
4. **Caching**: Cache responses for common medical queries

### Model Size vs Performance:
- **Small Models** (< 500MB): Fast, less accurate
- **Medium Models** (500MB - 2GB): Good balance
- **Large Models** (> 2GB): Best quality, slower response

Choose based on your latency and accuracy requirements.