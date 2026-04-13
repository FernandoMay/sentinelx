// SentinelX Fraud Detection Engine
// AI-powered threat analysis with heuristic scoring + pattern matching

interface FraudInput {
  message?: string;
  url?: string;
  wallet?: string;
  email?: string;
}

interface AnalysisDetail {
  checks: { name: string; triggered: boolean; score: number; description: string }[];
  indicators: string[];
  confidence: number;
}

const KNOWN_SCAM_PATTERNS = [
  /\b(free\s*(bitcoin|btc|eth|crypto|money|usdt|usdc|airdrop|nft|token))\b/i,
  /\b(double|2x|triple|100x|1000x)\s*(your\s*)?(money|investment|returns|profit|crypto)\b/i,
  /\b(urgent|act\s*now|limited\s*time|don't\s*miss|last\s*chance)\b/i,
  /\b(congratulations|you\s*(have\s*)?(won|been\s*selected|qualified))\b/i,
  /\b(verify\s*your\s*account|update\s*your\s*payment|secure\s*your\s*wallet)\b/i,
  /\b(send\s*\d+\s*(to|usdt|usdc|btc|eth|sol|xlm))\b/i,
  /\b(guaranteed\s*(return|profit|income|gain))\b/i,
  /\b(password|secret\s*phrase|seed\s*phrase|private\s*key)\b/i,
  /\b(only\s*\d+\s*(left|remaining|spots))\b/i,
  /\b(investment\s*opportunity|minimal\s*risk|high\s*yield)\b/i,
  /\b(click\s*(here|the\s*link|below)|visit\s*(this|the)\s*(site|link))\b/i,
  /\b(elon\s*musk|vitalik|satoshi|cz|changpeng)\b.*\b(give|send|drop|airdrop)\b/i,
  /\b(claim\s*your|redeem\s*your|receive\s*your)\b.*\b(free|reward|bonus|prize)\b/i,
  /\b(restore|recover|recover\s*your)\s*(funds|wallet|account|money)\b/i,
  /\b(support|help|assistance)\s*(will\s*(not|never)\s*(ask|request|require|need))\b/i,
];

const SUSPICIOUS_URL_PATTERNS = [
  /free-?(btc|bitcoin|crypto|money|usdt|usdc|airdrop)/i,
  /(claim|win|reward|prize|bonus)-(now|today|here|free)/i,
  /secure-?(wallet|account|login|update)/i,
  /verify-?(your|account|wallet|identity)/i,
  /(elon|musk|crypto|bitcoin)(-|\.)(gift|airdrop|giveaway|bonus)/i,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP address URLs
  /[a-z0-9]+\.[a-z]{2,4}\.[a-z]{2,4}\/[a-z0-9]{16,}/i, // Suspicious deep URLs
];

const WALLET_RED_FLAGS = [
  { pattern: /^0x[a-fA-F0-9]{40}$/i, name: "EVM-compatible wallet", score: 0.0 },
  { pattern: /^[G][A-Z2-7]{55}$/, name: "Stellar public key", score: -0.1 },
  { pattern: /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/, name: "Bitcoin address", score: 0.0 },
  { pattern: /^T[a-km-zA-HJ-NP-Z1-9]{33}$/, name: "Bitcoin testnet address", score: 0.05 },
];

const PHISHING_PREDICTIONS: Record<string, string> = {
  "urgent_call_to_action": "phishing_attack",
  "free_crypto_offer": "crypto_scam",
  "wallet_compromise": "credential_theft",
  "investment_scheme": "ponzi_scheme",
  "fake_giveaway": "social_engineering",
  "account_takeover": "credential_theft",
  "mixed_indicators": "suspicious_activity",
};

export function analyzeFraud(input: FraudInput): {
  riskScore: number;
  threatLevel: string;
  prediction: string;
  recommendedAction: string;
  details: AnalysisDetail;
} {
  const checks: AnalysisDetail["checks"] = [];
  const indicators: string[] = [];
  let totalScore = 0;

  // 1. Message analysis
  if (input.message) {
    const msg = input.message;
    const msgLower = msg.toLowerCase();

    // Check known scam patterns
    let msgScore = 0;
    let patternCount = 0;
    for (const pattern of KNOWN_SCAM_PATTERNS) {
      if (pattern.test(msg)) {
        patternCount++;
        const match = msg.match(pattern);
        indicators.push(match ? `Pattern: "${match[0].substring(0, 40)}..."` : "Suspicious pattern detected");
      }
    }
    msgScore = Math.min(patternCount * 0.12, 0.7);
    totalScore += msgScore;

    checks.push({
      name: "Message Pattern Analysis",
      triggered: patternCount > 0,
      score: msgScore,
      description: patternCount > 0
        ? `${patternCount} known scam patterns detected in message`
        : "No known scam patterns detected",
    });

    // Urgency detection
    const urgencyWords = ["urgent", "immediately", "act now", "limited time", "hurry", "fast", "asap"];
    const urgencyCount = urgencyWords.filter(w => msgLower.includes(w)).length;
    const urgencyScore = Math.min(urgencyCount * 0.08, 0.3);
    totalScore += urgencyScore;

    checks.push({
      name: "Urgency Detection",
      triggered: urgencyCount > 0,
      score: urgencyScore,
      description: urgencyCount > 0
        ? `${urgencyCount} urgency indicators found`
        : "No urgency manipulation detected",
    });

    // Exclamation overuse
    const exclamationCount = (msg.match(/!/g) || []).length;
    const capsRatio = (msg.match(/[A-Z]/g) || []).length / Math.max(msg.length, 1);
    const styleScore = Math.min((exclamationCount * 0.03) + (capsRatio > 0.4 ? 0.15 : 0), 0.3);
    totalScore += styleScore;

    checks.push({
      name: "Message Style Analysis",
      triggered: exclamationCount > 3 || capsRatio > 0.4,
      score: styleScore,
      description: exclamationCount > 3
        ? `Excessive punctuation (${exclamationCount} exclamation marks)`
        : capsRatio > 0.4
          ? `Excessive capitalization (${Math.round(capsRatio * 100)}%)`
          : "Normal message style",
    });

    // Link presence
    const linkCount = (msg.match(/https?:\/\//g) || []).length;
    if (linkCount > 0) {
      totalScore += 0.05;
      indicators.push(`${linkCount} URL(s) detected in message`);
    }
    checks.push({
      name: "Link Detection",
      triggered: linkCount > 0,
      score: linkCount > 0 ? 0.05 : 0,
      description: linkCount > 0 ? `${linkCount} link(s) found in message` : "No links detected",
    });

    // Personal information request
    const personalInfoPatterns = [/password/i, /seed\s*phrase/i, /private\s*key/i, /mnemonic/i, /secret/i, /personal\s*info/i];
    const personalInfoCount = personalInfoPatterns.filter(p => p.test(msg)).length;
    const personalScore = Math.min(personalInfoCount * 0.2, 0.5);
    totalScore += personalScore;

    if (personalInfoCount > 0) {
      indicators.push("Requests sensitive information");
    }
    checks.push({
      name: "Personal Information Request",
      triggered: personalInfoCount > 0,
      score: personalScore,
      description: personalInfoCount > 0
        ? `Asks for ${personalInfoCount} type(s) of sensitive info`
        : "No sensitive information requests",
    });
  }

  // 2. URL analysis
  if (input.url) {
    let urlScore = 0;
    let urlIssues = 0;

    // Check suspicious URL patterns
    for (const pattern of SUSPICIOUS_URL_PATTERNS) {
      if (pattern.test(input.url)) {
        urlIssues++;
        urlScore += 0.15;
      }
    }

    // Check for IP address URLs
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(input.url)) {
      urlIssues++;
      urlScore += 0.2;
      indicators.push("URL uses raw IP address");
    }

    // Check for excessive subdomains
    const dotCount = (input.url.match(/\./g) || []).length;
    if (dotCount > 4) {
      urlScore += 0.1;
      indicators.push("Excessive subdomains in URL");
    }

    // Check for URL shorteners
    const shorteners = ["bit.ly", "t.co", "tinyurl", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rb.gy"];
    if (shorteners.some(s => input.url.includes(s))) {
      urlScore += 0.1;
      indicators.push("URL uses a link shortener");
    }

    // Check for homograph attack indicators
    const homographChars = /[а-яА-Я]/; // Cyrillic
    if (homographChars.test(input.url)) {
      urlScore += 0.3;
      indicators.push("Possible homograph attack (non-Latin characters)");
    }

    // Check for http vs https
    if (input.url.startsWith("http://")) {
      urlScore += 0.05;
    }

    urlScore = Math.min(urlScore, 0.7);
    totalScore += urlScore;

    checks.push({
      name: "URL Analysis",
      triggered: urlIssues > 0,
      score: urlScore,
      description: urlIssues > 0
        ? `${urlIssues} suspicious URL indicators found`
        : "URL appears safe",
    });
  }

  // 3. Wallet analysis
  if (input.wallet) {
    let walletScore = 0;

    // Check wallet format
    const knownFormat = WALLET_RED_FLAGS.find(w => w.pattern.test(input.wallet!));
    if (!knownFormat) {
      walletScore += 0.1;
      indicators.push("Unknown wallet format");
    }

    // Check for suspiciously short addresses
    if (input.wallet.length < 20) {
      walletScore += 0.15;
      indicators.push("Suspiciously short wallet address");
    }

    walletScore = Math.min(walletScore, 0.3);
    totalScore += walletScore;

    checks.push({
      name: "Wallet Format Analysis",
      triggered: walletScore > 0,
      score: walletScore,
      description: knownFormat
        ? `Recognized format: ${knownFormat.name}`
        : "Unknown or suspicious wallet format",
    });
  }

  // 4. Email analysis
  if (input.email) {
    let emailScore = 0;

    // Check for disposable email patterns
    const disposablePatterns = [/temp/i, /throwaway/i, /fake/i, /guerrilla/i, /mailinator/i, /yopmail/i];
    if (disposablePatterns.some(p => p.test(input.email))) {
      emailScore += 0.2;
      indicators.push("Disposable email detected");
    }

    // Check for excessive numbers
    const numCount = (input.email.match(/\d/g) || []).length;
    if (numCount > input.email.length * 0.4) {
      emailScore += 0.15;
      indicators.push("Email has unusual character composition");
    }

    emailScore = Math.min(emailScore, 0.3);
    totalScore += emailScore;

    checks.push({
      name: "Email Analysis",
      triggered: emailScore > 0,
      score: emailScore,
      description: emailScore > 0
        ? "Email address shows suspicious characteristics"
        : "Email address appears normal",
    });
  }

  // Normalize score
  const riskScore = Math.min(Math.max(totalScore, 0), 1.0);

  // Determine threat level
  const threatLevel =
    riskScore >= 0.8 ? "CRITICAL" :
    riskScore >= 0.6 ? "HIGH" :
    riskScore >= 0.35 ? "MEDIUM" : "LOW";

  // Determine prediction
  let prediction = "safe";
  const sortedIndicators = [...indicators];

  if (riskScore >= 0.6) {
    // Find the strongest indicator for prediction
    if (sortedIndicators.some(i => i.toLowerCase().includes("credential") || i.toLowerCase().includes("personal") || i.toLowerCase().includes("sensitive"))) {
      prediction = "credential_theft";
    } else if (sortedIndicators.some(i => i.toLowerCase().includes("crypto") || i.toLowerCase().includes("bitcoin") || i.toLowerCase().includes("airdrop"))) {
      prediction = "crypto_scam";
    } else if (sortedIndicators.some(i => i.toLowerCase().includes("investment") || i.toLowerCase().includes("return") || i.toLowerCase().includes("profit"))) {
      prediction = "ponzi_scheme";
    } else if (sortedIndicators.some(i => i.toLowerCase().includes("url") || i.toLowerCase().includes("link"))) {
      prediction = "phishing_attack";
    } else if (sortedIndicators.some(i => i.toLowerCase().includes("pattern"))) {
      prediction = "social_engineering";
    } else {
      prediction = "suspicious_activity";
    }
  } else if (riskScore >= 0.35) {
    prediction = "suspicious_activity";
  }

  // Determine recommended action
  const recommendedAction =
    riskScore >= 0.8 ? "block_and_report" :
    riskScore >= 0.6 ? "block" :
    riskScore >= 0.35 ? "investigate" : "allow";

  // Calculate confidence
  const activeChecks = checks.filter(c => c.triggered);
  const confidence = activeChecks.length > 0
    ? Math.min(0.5 + (activeChecks.length / checks.length) * 0.5, 0.98)
    : 0.85;

  return {
    riskScore: Math.round(riskScore * 100) / 100,
    threatLevel,
    prediction,
    recommendedAction,
    details: {
      checks,
      indicators,
      confidence: Math.round(confidence * 100) / 100,
    },
  };
}
