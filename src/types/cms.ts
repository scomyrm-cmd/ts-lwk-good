import type { Language } from './index';
export type LocalText = Record<Language, string>;
export const contentKinds = ['article', 'news', 'announcement', 'event', 'club', 'video', 'podcast', 'album', 'photo', 'resource', 'page', 'staff'] as const;
export type ContentKind = typeof contentKinds[number];
export const contentStatuses = ['draft', 'submitted', 'approved', 'scheduled', 'published', 'archived', 'rejected'] as const;
export type ContentStatus = typeof contentStatuses[number];
export type EditorialRole = 'school-admin' | 'teacher' | 'editor' | 'journalist' | 'student';
export interface ContentItem {
  id: string; slug: string; kind: ContentKind; status: ContentStatus;
  title: LocalText; summary: LocalText; body: LocalText; category: string;
  cover: string; alt: LocalText; media: string; source: string; credit: string;
  author: string; ownerId: string; clubId: string; albumId: string;
  grade: string; subject: string; location: string; startsAt: string; endsAt: string;
  publishedAt: string; expiresAt: string; featured: boolean; priority: string;
  consent: boolean; updatedAt: string; revision: number;
  seoTitle: LocalText; seoDescription: LocalText;
}
export interface SiteSettings {
  title: LocalText; slogan: LocalText; introduction: LocalText; heroImage: string;
  heroAlt: LocalText; heroCredit: string; heroSource: string;
  email: string; phone: string; address: LocalText; official: boolean;
  navigation: string[];
}
export interface MediaAsset { id: string; path: string; type: string; name: string; ownerId: string; consent: boolean; createdAt: string }
export interface CmsState {
  version: number; items: ContentItem[]; settings: SiteSettings; media: MediaAsset[];
  roles: Record<string, EditorialRole>;
  revisions: Array<{ item: ContentItem; actorId: string; at: string }>;
  audit: Array<{ actorId: string; action: string; at: string }>;
}
export interface PublicSite { settings: SiteSettings; items: ContentItem[] }
export const text3 = (fr = '', ar = '', en = ''): LocalText => ({ fr, ar, en });
export const defaultSiteSettings: SiteSettings = {
  title: text3('Collège Anwal', 'الثانوية الإعدادية أنوال', 'Anwal Middle School'),
  slogan: text3('Apprendre, créer, partager et innover.', 'نتعلم، نبدع، نتشارك ونبتكر.', 'Learn, create, share and innovate.'),
  introduction: text3('Un espace pour découvrir la vie du collège, partager les idées et accompagner les apprentissages à Khénifra.', 'فضاء لاكتشاف الحياة المدرسية ومشاركة الأفكار ودعم التعلم بخنيفرة.', 'A space to discover school life, share ideas and support learning in Khénifra.'),
  heroImage: '/images/anwal-facade.webp', heroAlt: text3('Détail du bâtiment d’Anwal, 2022','تفصيل من مبنى أنوال، 2022','Detail of the Anwal building, 2022'), heroCredit: 'Al3omk · 2022', heroSource: 'https://al3omk.com/735370.html',
  email: '', phone: '', address: text3('Khénifra, Maroc', 'خنيفرة، المغرب', 'Khénifra, Morocco'),
  official: false, navigation: ['about','news','journal','school-life','clubs','media','resources','contact'],
};
const buildingPhoto: ContentItem = {
 id:'anwal-architecture-press-2022',slug:'anwal-building-detail',kind:'photo',status:'published',
 title:text3('Un détail du bâtiment d’Anwal','تفصيل من مبنى إعدادية أنوال','A detail of the Anwal school building'),
 summary:text3('Détail architectural recadré à partir d’une photographie de presse de 2022.','تفصيل معماري مقتطع من صورة صحفية تعود إلى سنة 2022.','Architectural detail cropped from a 2022 press photograph.'),
 body:text3('Photographie publiée dans un reportage du journal Al3omk du 28 mars 2022. Ce recadrage présente uniquement un détail du bâtiment. Le lien ci-dessous renvoie au reportage original.','نشرت الصورة في تقرير لجريدة العمق المغربي بتاريخ 28 مارس 2022. يعرض هذا الجزء من الصورة تفصيلاً من المبنى فقط. الرابط أدناه يحيل إلى التقرير الأصلي.','Originally published in an Al3omk report dated 28 March 2022. This crop shows only a detail of the building. The link below opens the original report.'),
 category:'Architecture',cover:'/images/anwal-facade.webp',alt:text3('Façade mauve et verte du bâtiment d’Anwal, détail photographique de 2022','تفصيل من واجهة مبنى أنوال باللونين البنفسجي والأخضر، 2022','Purple and green Anwal building facade, photographic detail from 2022'),
 media:'',source:'https://al3omk.com/735370.html',credit:'Al3omk · 28/03/2022 · détail recadré',author:'',ownerId:'',clubId:'',albumId:'',grade:'',subject:'',location:'',startsAt:'',endsAt:'',
 publishedAt:'2026-11-26T10:00:00Z',expiresAt:'',featured:false,priority:'normal',consent:true,updatedAt:'2026-11-26T10:00:00Z',revision:1,seoTitle:text3(),seoDescription:text3(),
};
export const emptyCms = (): CmsState => ({ version: 0, items: [structuredClone(buildingPhoto)], settings: structuredClone(defaultSiteSettings), media: [], roles: {}, revisions: [], audit: [] });
export function localText(value: LocalText, language: Language) { return value?.[language] || value?.fr || value?.ar || value?.en || ''; }

export function contentPath(item: Pick<ContentItem,'kind'|'slug'>) {
 const sections:Record<ContentKind,string>={article:'journal',news:'news',club:'clubs',video:'tv',podcast:'radio',album:'gallery',photo:'gallery',resource:'resources',event:'events',announcement:'news',page:'about',staff:'about'};
 return '/' + sections[item.kind] + '/' + item.slug;
}
