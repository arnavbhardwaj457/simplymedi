const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class OCRService {
  constructor() {
    this.tesseractDataPath = process.env.TESSERACT_DATA_PATH || './tesseract-data';
    this.supportedLanguages = {
      'english': 'eng',
      'hindi': 'hin',
      'bengali': 'ben',
      'tamil': 'tam',
      'telugu': 'tel',
      'kannada': 'kan',
      'marathi': 'mar',
      'gujarati': 'guj',
      'punjabi': 'pan',
      'arabic': 'ara',
      'french': 'fra',
      'mandarin': 'chi_sim'
    };
  }

  // Preprocess image for better OCR results
  async preprocessImage(imagePath) {
    try {
      const processedPath = imagePath.replace(/\.[^/.]+$/, '_processed.jpg');
      
      await sharp(imagePath)
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .normalize()
        .sharpen()
        .modulate({
          brightness: 1.1,
          contrast: 1.2
        })
        .jpeg({ quality: 90 })
        .toFile(processedPath);

      return processedPath;
    } catch (error) {
      logger.error('Error preprocessing image:', error);
      throw new Error('Failed to preprocess image');
    }
  }

  // Extract text from image using Tesseract
  async extractTextFromImage(imagePath, language = 'english') {
    try {
      const startTime = Date.now();
      
      // Preprocess image for better OCR
      const processedImagePath = await this.preprocessImage(imagePath);
      
      const tesseractLanguage = this.supportedLanguages[language] || 'eng';
      
      const { data } = await Tesseract.recognize(
        processedImagePath,
        tesseractLanguage,
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const processingTime = Date.now() - startTime;
      
      // Clean up processed image
      await fs.unlink(processedImagePath).catch(() => {});
      
      return {
        text: data.text,
        confidence: data.confidence,
        processingTime,
        words: data.words,
        lines: data.lines
      };
    } catch (error) {
      logger.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  // Extract text from PDF
  async extractTextFromPDF(pdfPath) {
    try {
      const pdfParse = require('pdf-parse');
      const fs = require('fs');
      
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(dataBuffer);
      
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata
      };
    } catch (error) {
      logger.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Extract text from text file
  async extractTextFromTextFile(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf8');
      return {
        text,
        encoding: 'utf8'
      };
    } catch (error) {
      logger.error('Error reading text file:', error);
      throw new Error('Failed to read text file');
    }
  }

  // Main text extraction method
  async extractText(filePath, fileType, language = 'english') {
    try {
      logger.info(`Extracting text from ${fileType} file: ${filePath}`);
      
      let result;
      
      switch (fileType.toLowerCase()) {
        case 'pdf':
          result = await this.extractTextFromPDF(filePath);
          break;
        case 'jpg':
        case 'jpeg':
        case 'png':
          result = await this.extractTextFromImage(filePath, language);
          break;
        case 'txt':
          result = await this.extractTextFromTextFile(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      logger.info(`Text extraction completed for ${filePath}`);
      return result;
    } catch (error) {
      logger.error('Error in text extraction:', error);
      throw error;
    }
  }

  // Validate OCR confidence
  validateOCRConfidence(confidence, threshold = 60) {
    return confidence >= threshold;
  }

  // Get supported languages
  getSupportedLanguages() {
    return Object.keys(this.supportedLanguages);
  }

  // Check if language is supported
  isLanguageSupported(language) {
    return this.supportedLanguages.hasOwnProperty(language);
  }

  // Extract structured data from medical report text
  async extractStructuredData(text) {
    try {
      // Common medical report patterns
      const patterns = {
        patientName: /(?:patient|name)[\s:]*([a-zA-Z\s]+)/i,
        dateOfBirth: /(?:dob|date of birth)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        reportDate: /(?:report|test) date[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        labName: /(?:lab|laboratory)[\s:]*([a-zA-Z\s&]+)/i,
        doctorName: /(?:doctor|physician)[\s:]*([a-zA-Z\s\.]+)/i,
        testResults: /([a-zA-Z\s]+)[\s:]*([\d\.]+)[\s]*([a-zA-Z\/\s]*)/g
      };

      const extractedData = {};
      
      for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
          extractedData[key] = match[1] || match[0];
        }
      }

      // Extract test results
      const testResults = [];
      let testMatch;
      const testPattern = /([a-zA-Z\s]+)[\s:]*([\d\.]+)[\s]*([a-zA-Z\/\s]*)/g;
      
      while ((testMatch = testPattern.exec(text)) !== null) {
        testResults.push({
          test: testMatch[1].trim(),
          value: testMatch[2].trim(),
          unit: testMatch[3].trim()
        });
      }

      extractedData.testResults = testResults;

      return extractedData;
    } catch (error) {
      logger.error('Error extracting structured data:', error);
      return {};
    }
  }
}

module.exports = new OCRService();
