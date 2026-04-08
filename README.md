SimplyMedi — AI Medical Report Simplifier

SimplyMedi is an AI-powered full-stack application that helps patients understand complex medical reports by converting them into simple, human-readable explanations. It uses a Retrieval-Augmented Generation (RAG) pipeline to ensure accurate, context-aware outputs.

🚀 Key Highlights
🧠 RAG-based AI pipeline for grounded medical explanations
📄 OCR-powered ingestion (PDFs, images, text) using Tesseract
🌍 Multilingual support (12+ languages)
💬 AI assistant for follow-up queries
☁️ Deployed on AWS (EC2 + S3)
⚡ End-to-end system: ingestion → retrieval → generation → delivery
🧠 How It Works (Core Idea)
Upload Report → PDF/Image/Text
OCR Extraction → Convert to raw text
Chunking + Embeddings → Prepare semantic representation
Retrieval (RAG) → Fetch relevant medical context
LLM Generation → Generate simplified explanation
Output → Patient-friendly summary (multi-language supported)
🏗️ Tech Stack

Frontend

React.js, TailwindCSS
React Query, Context API

Backend

Node.js, Express.js
REST APIs, JWT Authentication

AI / ML

Hugging Face Transformers
RAG Pipeline (Embeddings + Semantic Retrieval)
Tesseract.js (OCR)

Database & Cloud

PostgreSQL
AWS EC2 (compute), S3 (storage)
✨ Features
Medical Report Simplification
Converts complex clinical language into easy explanations
Semantic Retrieval (RAG)
Ensures responses are grounded in actual report content
Multilingual Output
Supports major Indian + global languages
AI Chat Assistant
Allows users to ask contextual follow-up questions
Secure File Handling
Encrypted uploads and controlled access
⚙️ Setup
git clone https://github.com/your-username/simplymedi.git
cd simplymedi
npm run install-all
npm run dev
📌 Key Challenges & Learnings
Improving retrieval quality to reduce hallucinations
Designing effective chunking + overlap strategy
Handling noisy OCR outputs from medical reports
Balancing latency vs accuracy in the RAG pipeline
📈 Future Improvements
Better medical-specific embedding models
Fine-tuned LLM for healthcare domain
Real-time doctor integration
Mobile app support
📄 License

MIT License

💡 Why This Project Matters

Medical reports are often difficult for non-experts to understand. SimplyMedi bridges this gap by combining AI + retrieval systems to make healthcare information more accessible and actionable.
