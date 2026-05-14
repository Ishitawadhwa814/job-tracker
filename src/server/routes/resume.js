const express = require("express");
const pool = require("../config/database");
const multer = require('multer');
const mammoth = require('mammoth');

// Simple DOM polyfill for pdf-parse
global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
  }
};

const pdfParse = require('pdf-parse');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function normalizeText(text) {
  return (text || '')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractEmail(text) {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0] : null;
}

function extractPhone(text) {
  // permissive: matches +91, spaces, dashes
  const m = text.match(/(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/);
  return m ? m[0] : null;
}

function hasSection(text, sectionName) {
  const re = new RegExp(`(^|\\n)\\s*${sectionName}\\s*(\\n|$)`, 'i');
  return re.test(text);
}

function computeKeywordSuggestions(text) {
  console.log('Computing keywords from text length:', text?.length || 0);
  
  if (!text || text.trim().length === 0) {
    console.log('Empty text, returning fallback keywords');
    return ['project management', 'communication', 'teamwork', 'problem solving', 'leadership', 'analytical skills'];
  }

  const stop = new Set([
    'the','and','or','a','an','to','of','in','for','with','on','at','by','from','as','is','are','was','were','be','been','it','this','that','these','those','you','your','i','we','our','us','they','their','them','using','used','use','based','also','have','has','had','will','would','could','should','may','might','can','shall','must','did','does','do','but','if','then','else','when','where','why','how','what','which','who','whom','whose','been','being','was','were','am','is','are'
  ]);

  // Extract words, filter stop words, and count frequency
  const words = (text.toLowerCase()
    .match(/[a-z]{3,}/g) || [])
    .filter(w => !stop.has(w) && !/^\d+$/.test(w));

  console.log('Extracted words:', words.length);

  const freq = new Map();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  // Filter for meaningful keywords (appear at least twice or are job-related)
  const jobRelatedWords = new Set([
    'developed','managed','led','created','implemented','designed','coordinated','analyzed','optimized','improved','increased','decreased','maintained','supported','assisted','trained','mentored','researched','documented','tested','deployed','monitored','evaluated','presented','negotiated','collaborated','communicated','organized','planned','scheduled','budgeted','forecasted','audited','reviewed','approved','rejected','recommended','advised','consulted','facilitated','supervised','oversaw','directed','controlled','administered','executed','performed','conducted','achieved','accomplished','completed','delivered','produced','generated','secured','protected','ensured','verified','validated','confirmed','authorized','permitted','licensed','certified','qualified','skilled','experienced','proficient','expert','specialist','senior','junior','lead','principal','manager','director','engineer','developer','analyst','consultant','coordinator','specialist','associate','assistant','intern','trainee','apprentice','contractor','freelancer','volunteer'
  ]);

  const keywords = [...freq.entries()]
    .filter(([word, count]) => count >= 2 || jobRelatedWords.has(word))
    .sort((a, b) => {
      // Prioritize job-related words and higher frequency
      const aPriority = (jobRelatedWords.has(a[0]) ? 1000 : 0) + a[1];
      const bPriority = (jobRelatedWords.has(b[0]) ? 1000 : 0) + b[1];
      return bPriority - aPriority;
    })
    .slice(0, 12)
    .map(([w]) => w);

  console.log('Filtered keywords:', keywords.length);

  // If still no keywords, provide some common tech/business keywords as fallback
  if (keywords.length === 0) {
    console.log('No keywords found, using fallback');
    return ['project management', 'communication', 'teamwork', 'problem solving', 'leadership', 'analytical skills'];
  }

  console.log('Final keywords:', keywords);
  return keywords;
}

function analyzeResumeText(rawText) {
  const text = normalizeText(rawText);
  const lower = text.toLowerCase();

  const checks = {
    contactInfo: Boolean(extractEmail(text)) || Boolean(extractPhone(text)),
    education: hasSection(text, 'education') || lower.includes('university') || lower.includes('college'),
    projects: hasSection(text, 'projects') || lower.includes('project'),
    experience: hasSection(text, 'experience') || hasSection(text, 'work experience') || lower.includes('intern'),
    skills: hasSection(text, 'skills') || lower.includes('skills'),
    summary: hasSection(text, 'summary') || hasSection(text, 'introduction') || hasSection(text, 'objective')
  };

  const strengths = [];
  const improvements = [];

  if (checks.contactInfo) strengths.push('Contact information detected (email/phone).');
  else improvements.push('Add clear contact info (email + phone) at the top.');

  if (checks.summary) strengths.push('A Summary/Introduction section is present.');
  else improvements.push('Add a short Summary/Introduction section (2-3 lines).');

  if (checks.skills) strengths.push('Skills section detected.');
  else improvements.push('Add a Skills section with role-relevant keywords.');

  if (checks.projects) strengths.push('Projects section detected.');
  else improvements.push('Add a Projects section with 2-4 strong projects.');

  if (checks.education) strengths.push('Education information detected.');
  else improvements.push('Add an Education section with degree, institute, year, and score/CGPA.');

  // Basic quantification check
  const hasNumbers = /\b\d+%?\b/.test(text);
  if (hasNumbers) strengths.push('Quantified details detected (numbers/metrics).');
  else improvements.push('Add quantifiable impact (numbers, % improvements, scale, users, latency, etc.).');

  // Action verbs (simple)
  const actionVerbs = ['developed','built','designed','implemented','optimized','created','led','improved','automated','deployed','integrated','reduced','increased','analyzed'];
  const actionCount = actionVerbs.reduce((acc, v) => acc + (lower.includes(v) ? 1 : 0), 0);
  if (actionCount >= 5) strengths.push('Good usage of action verbs in bullet points.');
  else improvements.push('Use more strong action verbs (Developed, Implemented, Optimized, Led, Deployed).');

  // Formatting recommendations (generic ATS)
  const formatIssues = [
    'Use single-column layout and standard section headings.',
    'Avoid tables, text boxes, and graphics.',
    'Use consistent date formats (e.g., 2023-2027).',
    'Keep links as plain text URLs.'
  ];

  // Scoring
  const base = 40;
  const sectionScore = Object.values(checks).filter(Boolean).length * 8; // up to 48
  const quantScore = hasNumbers ? 8 : 0;
  const verbScore = Math.min(actionCount * 1.5, 8);
  const lengthScore = text.length > 1500 ? 6 : (text.length > 800 ? 4 : 0);
  const score = Math.max(0, Math.min(100, Math.round(base + sectionScore + quantScore + verbScore + lengthScore)));

  const keywordSuggestions = computeKeywordSuggestions(text);

  return {
    score,
    strengths,
    improvements,
    keywordSuggestions,
    formatIssues,
    atsCompatibility: {
      contactInfo: checks.contactInfo,
      education: checks.education,
      projects: checks.projects,
      experience: checks.experience,
      skills: checks.skills,
      summary: checks.summary,
      keywords: keywordSuggestions.length >= 8 ? 'good' : 'moderate',
      formatting: 'check'
    }
  };
}

// Ensure table exists
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        user_id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("resumes table is ready");
  } catch (err) {
    console.error("Failed to ensure resumes table:", err);
  }
})();

// Get resume by userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await pool.query('SELECT data, updated_at as "updatedAt" FROM resumes WHERE user_id = $1', [userId]);
    if (!rows[0]) return res.json(null);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// Analyze uploaded resume (PDF/DOCX)
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const name = (file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    let extractedText = '';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      const parsed = await pdfParse(file.buffer);
      extractedText = parsed.text || '';
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value || '';
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Upload PDF or DOCX.' });
    }

    const analysis = analyzeResumeText(extractedText);
    res.json({ analysis });
  } catch (err) {
    console.error('Resume analyze failed:', err);
    res.status(500).json({
      error: 'Failed to analyze resume',
      detail: err && err.message ? err.message : String(err)
    });
  }
});

// ATS Resume Analysis
router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let text = '';
    
    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        text = pdfData.text;
      } catch (err) {
        console.error('PDF parsing error:', err);
        return res.status(400).json({ error: 'Failed to parse PDF file' });
      }
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const docxResult = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = docxResult.value;
      } catch (err) {
        console.error('DOCX parsing error:', err);
        return res.status(400).json({ error: 'Failed to parse DOCX file' });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Normalize text
    text = normalizeText(text);

    // Perform ATS analysis
    const analysis = analyzeATSCompatibility(text);
    
    res.json(analysis);
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

function analyzeATSCompatibility(text) {
  const hasContactInfo = extractEmail(text) || extractPhone(text);
  const hasWorkExperience = hasSection(text, 'experience|work|employment|career') || 
                          /\b(developed|managed|led|created|implemented|designed|coordinated)\b/i.test(text);
  const hasEducation = hasSection(text, 'education|academic|qualification|degree') ||
                       /\b(university|college|bachelor|master|phd|degree|diploma)\b/i.test(text);
  const hasSkills = hasSection(text, 'skills|abilities|competencies|expertise') ||
                    /\b(proficient|skilled|experienced|knowledge|expertise)\b/i.test(text);
  const hasSummary = hasSection(text, 'summary|objective|profile|overview');

  // Calculate score
  let score = 0;
  if (hasContactInfo) score += 20;
  if (hasWorkExperience) score += 25;
  if (hasEducation) score += 20;
  if (hasSkills) score += 20;
  if (hasSummary) score += 15;

  // Additional scoring factors
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 200 && wordCount <= 600) score += 5; // Good length
  if (/\b\d+%|\$\d+|\d+\s*(years|months|weeks)\b/i.test(text)) score += 5; // Has metrics

  const keywords = computeKeywordSuggestions(text);
  const keywordDensity = keywords.length > 10 ? 'high' : keywords.length > 5 ? 'moderate' : 'low';

  return {
    score: Math.min(100, score),
    strengths: [
      hasContactInfo && 'Clear contact information detected',
      hasWorkExperience && 'Work experience section present',
      hasEducation && 'Education details included',
      hasSkills && 'Skills section identified',
      hasSummary && 'Professional summary present',
      wordCount >= 200 && wordCount <= 600 && 'Appropriate resume length',
      /\b\d+%|\$\d+|\d+\s*(years|months|weeks)\b/i.test(text) && 'Includes quantifiable achievements'
    ].filter(Boolean),
    improvements: [
      !hasContactInfo && 'Add contact information (email/phone)',
      !hasWorkExperience && 'Add work experience section with specific roles',
      !hasEducation && 'Include education details',
      !hasSkills && 'Add skills section highlighting relevant abilities',
      !hasSummary && 'Add professional summary at the top',
      wordCount < 200 && 'Expand content to provide more detail',
      wordCount > 600 && 'Condense content to focus on most relevant information',
      !/\b\d+%|\$\d+|\d+\s*(years|months|weeks)\b/i.test(text) && 'Add quantifiable achievements and metrics'
    ].filter(Boolean),
    keywordSuggestions: keywords.slice(0, 8),
    formatIssues: [
      'Ensure consistent formatting throughout',
      'Use standard section headers',
      'Avoid complex tables or graphics',
      'Use professional fonts (Arial, Calibri, Times New Roman)'
    ],
    atsCompatibility: {
      contactInfo: !!hasContactInfo,
      workExperience: !!hasWorkExperience,
      education: !!hasEducation,
      skills: !!hasSkills,
      summary: !!hasSummary,
      keywords: keywordDensity,
      formatting: wordCount >= 200 && wordCount <= 600 ? 'good' : 'needs improvement'
    }
  };
}

// Upsert resume
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const resume = req.body;
  if (!resume || typeof resume !== 'object') {
    return res.status(400).json({ error: 'Invalid resume payload' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO resumes (user_id, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
       RETURNING data, updated_at as "updatedAt"`,
      [userId, resume]
    );
    res.json({ message: 'Resume saved', ...rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

module.exports = router;
