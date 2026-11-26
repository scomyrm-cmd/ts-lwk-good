import type { Language } from "./index";
export type LocalText = Record<Language, string>;
export const contentKinds = [
  "article",
  "news",
  "announcement",
  "event",
  "club",
  "video",
  "podcast",
  "album",
  "photo",
  "resource",
  "page",
  "staff",
  "achievement",
] as const;
export type ContentKind = (typeof contentKinds)[number];
export const contentStatuses = [
  "draft",
  "submitted",
  "approved",
  "scheduled",
  "published",
  "archived",
  "rejected",
] as const;
export type ContentStatus = (typeof contentStatuses)[number];
export type EditorialRole =
  | "school-admin"
  | "teacher"
  | "editor"
  | "journalist"
  | "student";
export type ResearchCategory =
  | "excellence"
  | "sports"
  | "reading"
  | "environment"
  | "arts"
  | "school";
export interface ResearchMetadata {
  sourceIds: string[];
  categoryKey: ResearchCategory;
  year: number;
  eventDate: string;
  eventEnd?: string;
  datePrecision: string;
  dateLabel: LocalText;
  sourcePublishedAt: string;
  accuracyNote: LocalText;
  relatedIds: string[];
  level: LocalText;
  competition: LocalText;
  outcome: string;
  imageIds?: string[];
  scope?: "school" | "shared";
  externalGallery?: boolean;
  videoId?: string;
  embedAllowed?: boolean;
  originalVideoTitle?: string;
  sources?: Array<{
    id: string;
    url: string;
    credit: string;
    publishedAt: string;
  }>;
}
export interface ContentItem {
  id: string;
  slug: string;
  kind: ContentKind;
  status: ContentStatus;
  title: LocalText;
  summary: LocalText;
  body: LocalText;
  category: string;
  cover: string;
  alt: LocalText;
  media: string;
  source: string;
  credit: string;
  author: string;
  ownerId: string;
  clubId: string;
  albumId: string;
  grade: string;
  subject: string;
  location: string;
  startsAt: string;
  endsAt: string;
  publishedAt: string;
  expiresAt: string;
  featured: boolean;
  priority: string;
  consent: boolean;
  updatedAt: string;
  revision: number;
  seoTitle: LocalText;
  seoDescription: LocalText;
  research?: ResearchMetadata;
}
export interface SiteSettings {
  title: LocalText;
  slogan: LocalText;
  introduction: LocalText;
  heroImage: string;
  heroAlt: LocalText;
  heroCredit: string;
  heroSource: string;
  email: string;
  phone: string;
  address: LocalText;
  official: boolean;
  navigation: string[];
}
export interface MediaAsset {
  id: string;
  path: string;
  type: string;
  name: string;
  ownerId: string;
  consent: boolean;
  createdAt: string;
}
export interface CmsState {
  researchVersion?: number;
  version: number;
  items: ContentItem[];
  settings: SiteSettings;
  media: MediaAsset[];
  roles: Record<string, EditorialRole>;
  revisions: Array<{ item: ContentItem; actorId: string; at: string }>;
  audit: Array<{ actorId: string; action: string; at: string }>;
}
export interface PublicSite {
  settings: SiteSettings;
  items: ContentItem[];
}
export const text3 = (fr = "", ar = "", en = ""): LocalText => ({ fr, ar, en });
export const defaultSiteSettings: SiteSettings = {
  title: text3(
    "Collège Anwal",
    "الثانوية الإعدادية أنوال",
    "Anwal Middle School",
  ),
  slogan: text3(
    "Apprendre, créer, partager et innover.",
    "نتعلم، نبدع، نتشارك ونبتكر.",
    "Learn, create, share and innovate.",
  ),
  introduction: text3(
    "Un espace pour découvrir la vie du collège, partager les idées et accompagner les apprentissages à Khénifra.",
    "فضاء لاكتشاف الحياة المدرسية ومشاركة الأفكار ودعم التعلم بخنيفرة.",
    "A space to discover school life, share ideas and support learning in Khénifra.",
  ),
  heroImage: "",
  heroAlt: text3(),
  heroCredit: "",
  heroSource: "",
  email: "",
  phone: "",
  address: text3("Khénifra, Maroc", "خنيفرة، المغرب", "Khénifra, Morocco"),
  official: false,
  navigation: [
    "about",
    "news",
    "achievements",
    "gallery",
    "tv",
    "journal",
    "school-life",
    "clubs",
    "media",
    "resources",
    "contact",
  ],
};
export const emptyCms = (): CmsState => ({
  version: 0,
  items: [],
  settings: structuredClone(defaultSiteSettings),
  media: [],
  roles: {},
  revisions: [],
  audit: [],
});
export function localText(value: LocalText, language: Language) {
  return value?.[language] || value?.fr || value?.ar || value?.en || "";
}

export function contentPath(item: Pick<ContentItem, "kind" | "slug">) {
  const sections: Record<ContentKind, string> = {
    article: "journal",
    news: "news",
    club: "clubs",
    video: "tv",
    podcast: "radio",
    album: "gallery",
    photo: "gallery",
    resource: "resources",
    event: "events",
    announcement: "news",
    page: "about",
    staff: "about",
    achievement: "achievements",
  };
  return "/" + sections[item.kind] + "/" + item.slug;
}
