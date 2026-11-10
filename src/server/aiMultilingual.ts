export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export type DetectedLanguage = 'en' | 'fr' | 'ar' | 'darija';

export function detectLanguage(text: string, fallback: DetectedLanguage = 'en'): DetectedLanguage {
  const value = text.trim().toLowerCase();
  if (/\p{Script=Arabic}/u.test(value)) {
    return /واش|شكون|عطيني|ديال|دابا|بغيت|عفاك|شنو|كيفاش|كاين|غيابو|ديالو|ديالها/u.test(value) ? 'darija' : 'ar';
  }
  if (/\b(wach|chkon|chno|kifach|3tini|3afak|bghit|dial|dyal|daba|kayn|chokran|ghiyab)\b/i.test(value)) return 'darija';
  if (/\b(hello|hi|please|who|what|where|which|how|tell|show|give|summari[sz]e|summary|their|thanks|yes|no|student|attendance)\b/i.test(value)) return 'en';
  if (/[éèêëàâôûîïç]/i.test(value) || /\b(bonjour|salut|merci|combien|quel|quelle|quels|donne|montre|qui|est|sont|assiduite|eleve|ecole|profil|resume|ses|son|oui|non)\b/i.test(value)) return 'fr';
  return fallback;
}

export const languageNames: Record<DetectedLanguage, string> = {
  en: 'English',
  fr: 'French',
  ar: 'Modern Standard Arabic',
  darija: 'Moroccan Darija, matching the user’s Arabic or Latin script',
};
