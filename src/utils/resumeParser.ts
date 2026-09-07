export interface ParsedResumeData {
  candidate_name: string;
  filename: string;
  email: string;
  phone: string;
  text: string;
  experience_years: number;
  education: string;
}

export function extractContactInfo(text: string, filename: string): {
  candidate_name: string;
  email: string;
  phone: string;
  experience_years: number;
  education: string;
} {
  // Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0] : 'N/A';

  // Extract Phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : 'N/A';

  // Extract Years of Experience
  const expMatches = Array.from(text.matchAll(/(\d+)\+?\s*(?:years?|yrs)(?:\s*(?:of\s*)?experience)?/gi));
  let experienceYears = 2; // Default reasonable baseline
  if (expMatches.length > 0) {
    const validExp = expMatches
      .map(m => parseInt(m[1], 10))
      .filter(y => !isNaN(y) && y <= 30);
    if (validExp.length > 0) {
      experienceYears = Math.max(...validExp);
    }
  }

  // Extract Education
  let education = "Bachelor's Degree";
  const textLower = text.toLowerCase();
  if (/(phd|ph\.d|doctorate)/i.test(textLower)) {
    education = "Ph.D. / Doctorate";
  } else if (/(master|m\.s\.|m\.tech|mca)/i.test(textLower)) {
    education = "Master's Degree (M.S.)";
  } else if (/(bachelor|b\.s\.|b\.tech|b\.e\.)/i.test(textLower)) {
    education = "Bachelor's Degree (B.S.)";
  }

  // Extract Name: Check first non-empty lines or filename fallback
  let candidateName = '';
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines.slice(0, 5)) {
    // If line has 2-4 words and no symbols/emails, likely candidate name
    const words = line.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 4 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/curriculum|resume|cv|page|summary|profile|developer|engineer/i.test(line)
    ) {
      candidateName = line;
      break;
    }
  }

  if (!candidateName) {
    // Derive name from filename (e.g. Alex_Rivera_Senior_AI_Engineer.pdf -> Alex Rivera)
    const baseName = filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const parts = baseName.split(/\s+/);
    if (parts.length >= 2) {
      candidateName = `${parts[0]} ${parts[1]}`;
    } else {
      candidateName = baseName || 'Candidate';
    }
  }

  return {
    candidate_name: candidateName,
    email,
    phone,
    experience_years: experienceYears,
    education,
  };
}

export async function parseUploadedResumeFile(file: File): Promise<ParsedResumeData> {
  let extractedText = '';
  const ext = file.name.toLowerCase().split('.').pop() || '';

  if (ext === 'txt') {
    extractedText = await file.text();
  } else {
    // Read as binary buffer and attempt UTF-8 extraction / text stream decoding
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawContent = decoder.decode(arrayBuffer);

    // Filter printable ascii and words
    const cleanWords = rawContent
      .replace(/[^\x20-\x7E\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanWords.length > 50) {
      extractedText = cleanWords;
    } else {
      extractedText = `Resume for ${file.name}\nCandidate content extracted from uploaded document.`;
    }
  }

  const contact = extractContactInfo(extractedText, file.name);

  return {
    candidate_name: contact.candidate_name,
    filename: file.name,
    email: contact.email,
    phone: contact.phone,
    text: extractedText,
    experience_years: contact.experience_years,
    education: contact.education,
  };
}
