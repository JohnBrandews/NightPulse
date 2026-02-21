// Simple content moderation - in production, use a proper moderation service
const BANNED_WORDS: string[] = [
  // Add explicit words/phrases that should be blocked
  // This is a placeholder - implement proper moderation
];

export function containsBannedWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => lowerText.includes(word.toLowerCase()));
}

export function moderateContent(content: string): {
  isSafe: boolean;
  moderatedContent?: string;
  reason?: string;
} {
  if (containsBannedWords(content)) {
    return {
      isSafe: false,
      reason: 'Content contains inappropriate language',
    };
  }

  // Additional checks can be added here
  return { isSafe: true, moderatedContent: content };
}
