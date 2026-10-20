// Content safety filters, keyword blocklists, and rate-limiting heuristics

const PROHIBITED_KEYWORDS = [
  'scam',
  'free crypto',
  'casino',
  'viagra',
  'porn',
  'nude',
  'hate speech',
  'terrorist',
  'kill all',
  'bomb threat',
  'illegal weapon',
  'drugs for sale',
  'fake passport',
  'doxx',
  'lynch',
  'slur',
  'desecrate',
];

const DISRESPECTFUL_PATTERNS = [
  /defile\s+(the\s+)?(idol|temple|mosque|church|gurudwara|shrine|altar|pandal)/i,
  /burn\s+(the\s+)?(scripture|book|flag|pandal|altar)/i,
  /all\s+(hindus|muslims|sikhs|christians|jews)\s+are/i,
  /fake\s+god/i,
  /shut\s+down\s+this\s+festival/i,
];

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  flagCategory?: string;
}

/**
 * Validates text against prohibited keywords and disrespectful heuristics
 */
export function checkContentSafety(captionOrNote: string): SafetyCheckResult {
  const normalized = captionOrNote.toLowerCase();

  // 1. Keyword check
  for (const keyword of PROHIBITED_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return {
        allowed: false,
        reason: `Your contribution contains prohibited or spam-related phrasing ("${keyword}").`,
        flagCategory: 'prohibited_keyword',
      };
    }
  }

  // 2. Cultural & religious respect heuristics
  for (const pattern of DISRESPECTFUL_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        allowed: false,
        reason: 'Your message contains phrasing flagged as inflammatory or disrespectful to this occasion.',
        flagCategory: 'disrespectful_content',
      };
    }
  }

  // 3. Simple spam detection (e.g. repeated excessive URLs or phone numbers)
  const urlMatches = normalized.match(/https?:\/\/[^\s]+/g);
  if (urlMatches && urlMatches.length > 2) {
    return {
      allowed: false,
      reason: 'Contributions may not contain multiple external marketing links.',
      flagCategory: 'spam_links',
    };
  }

  return { allowed: true };
}

/**
 * Strips raw HTML and script tags to prevent XSS (NFR12)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * In-memory sliding window rate limiter for user contributions
 * (e.g., max 5 contributions within 15 minutes) with automatic memory pruning
 */
const contributionTimestamps: Map<string, number[]> = new Map();

export function checkRateLimit(userId: string, maxPosts: number = 5, windowMinutes: number = 15): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const userTimes = contributionTimestamps.get(userId) || [];

  // Filter out timestamps outside the window
  const validTimes = userTimes.filter((ts) => now - ts < windowMs);

  if (validTimes.length >= maxPosts) {
    const oldestInWindow = validTimes[0];
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfter, 1) };
  }

  validTimes.push(now);
  contributionTimestamps.set(userId, validTimes);

  // Periodically prune old keys to prevent memory leaks
  if (contributionTimestamps.size > 200) {
    for (const [key, times] of contributionTimestamps.entries()) {
      const active = times.filter((ts) => now - ts < windowMs);
      if (active.length === 0) {
        contributionTimestamps.delete(key);
      } else {
        contributionTimestamps.set(key, active);
      }
    }
  }

  return { allowed: true };
}

/**
 * Rate limiter for OTP dispatch (e.g., max 3 verification codes per 10 minutes per recipient)
 */
const otpDispatchTimestamps: Map<string, number[]> = new Map();

export function checkOtpRateLimit(
  recipient: string,
  maxSends: number = 3,
  windowMinutes: number = 10
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const key = recipient.trim().toLowerCase();
  const times = otpDispatchTimestamps.get(key) || [];

  const validTimes = times.filter((ts) => now - ts < windowMs);
  if (validTimes.length >= maxSends) {
    const oldestInWindow = validTimes[0];
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfter, 1) };
  }

  validTimes.push(now);
  otpDispatchTimestamps.set(key, validTimes);
  return { allowed: true };
}

/**
 * Tracks failed OTP verification attempts to prevent brute-force attacks (max 5 failed attempts per recipient)
 */
const otpFailedAttempts: Map<string, { count: number; firstAttempt: number }> = new Map();

export function recordOtpVerifyAttempt(
  recipient: string,
  isSuccess: boolean,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const key = recipient.trim().toLowerCase();

  if (isSuccess) {
    otpFailedAttempts.delete(key);
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  const record = otpFailedAttempts.get(key);
  if (!record || now - record.firstAttempt > windowMs) {
    otpFailedAttempts.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  record.count += 1;
  if (record.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }

  return { allowed: true, remainingAttempts: maxAttempts - record.count };
}

