export interface Slide {
  slideNumber: number;
  title: string;
  bullets: string[];
  presenterNotes: string;
}

export interface PresentationDeck {
  title: string;
  subtitle: string;
  slides: Slide[];
}

export type ThemeType = 'charcoal' | 'nordic' | 'sepia' | 'emerald' | 'neon';
export type AccentType = 'teal' | 'violet' | 'emerald' | 'rose' | 'amber' | 'blue';
export type FontPairingType = 'corporate' | 'editorial' | 'technical' | 'modern';
export type CompactnessType = 'compact' | 'normal' | 'generous';

export interface DesignConfig {
  theme: ThemeType;
  accent: AccentType;
  fontPairing: FontPairingType;
  compactness: CompactnessType;
  align: 'left' | 'center';
  showCardBorder: boolean;
}

export interface DocumentInfo {
  title: string;
  text: string;
  wordCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarColor: string;
}

export interface GenerationHistoryEntry {
  id: string;
  title: string;
  documentInfo: DocumentInfo | null;
  deck: PresentationDeck;
  timestamp: string;
  slideCount: number;
  userId: string;
}
