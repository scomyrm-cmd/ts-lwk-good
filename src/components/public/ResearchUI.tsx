import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  ImageOff,
  Leaf,
  Play,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";
import { WorkspaceDialog } from "../common/WorkspaceDialog";
import {
  contentPath,
  localText,
  type ContentItem,
  type ResearchCategory,
} from "../../types/cms";
import "./research.css";

type Lang = "fr" | "ar" | "en";
export const researchLabels = {
  fr: {
    achievements: "Palmarès",
    achievementsIntro:
      "Des parcours, des résultats et leurs sources. Chaque distinction garde son niveau et sa portée.",
    gallery: "La vie d’Anwal, en images",
    galleryIntro:
      "Des collections documentées, ouvertes sur les galeries de leurs éditeurs.",
    sources: "Sources & médias",
    sourcesIntro:
      "Le registre de recherche : liens originaux, dates, crédits et décisions de publication.",
    all: "Tout",
    year: "Toutes les années",
    categories: "Tous les thèmes",
    excellence: "Excellence & prix",
    sports: "Sport & compétitions",
    reading: "Lecture & culture",
    environment: "Environnement & biodiversité",
    arts: "Théâtre, musique & arts",
    school: "Vie scolaire & formation",
    openGallery: "Ouvrir la galerie originale",
    externalPhotos:
      "Les photos de presse s’ouvrent sur le site de leur éditeur, avec leurs crédits.",
    pressGallery: "Galerie de presse",
    shared: "Événement partagé",
    sharedNote:
      "Cette couverture concerne plusieurs établissements. Les personnes photographiées ne sont pas toutes identifiées comme élèves d’Anwal.",
    schoolScope: "Événement à Anwal",
    photoRefs: "références d’images",
    collage: "Collage photographique",
    overlap: "Contient aussi des photographies de",
    collections: "collections",
    read: "Lire l’article",
    collection: "Collection",
    close: "Fermer",
    previous: "Précédent",
    next: "Suivant",
    slide: "Élément",
    source: "Source originale",
    sourcePublished: "Source publiée le",
    event: "Date de l’activité",
    context: "Contexte & précision",
    related: "Pour prolonger la découverte",
    watch: "Regarder sur YouTube",
    play: "Lire la vidéo",
    videoNotice:
      "Le lecteur YouTube se charge après votre clic. Si la lecture échoue, ouvrez la vidéo sur YouTube.",
    loading: "Chargement…",
    retry: "Réessayer",
    unavailable: "Le registre est momentanément indisponible.",
    noResults: "Aucun élément ne correspond à ces filtres.",
    archive: "Archives régionales",
    archiveNote:
      "La réception de 2017 concernait plusieurs écoles et plusieurs sports. Ses clips ne sont pas présentés comme des reportages sur Anwal.",
    inventory: "Consulter le registre complet",
    download: "Télécharger le registre",
    search: "Rechercher dans les sources…",
    sourceRecords: "sources",
    images: "références image",
    videos: "vidéos référencées",
    type: "Type de média",
    status: "État",
    credit: "Crédit / éditeur",
    date: "Date",
    rights: "Réutilisation",
    unknownDate: "Non établie",
    originalImage: "Lien image d’origine",
    permission: "Autorisation de republication non établie",
    notHosted: "Lien vers la galerie ; aucune copie hébergée",
    reviewed: "Image examinée",
    notAvailable: "Image indisponible lors du contrôle",
    sourceReviewed: "Source examinée",
    included: "Intégrée",
    excluded: "Conservée au registre",
    articleDate: "Compte rendu",
    champion: "Champion",
    "runner-up": "Deuxième place",
    bronze: "Bronze",
    participation: "Participation",
    qualification: "Qualification",
    selection: "Sélection",
    recognition: "Reconnaissance",
    distinction: "Distinction",
    photoUnavailable: "Aperçu photo indisponible",
    imageRights: "Les images restent chez leur éditeur.",
    facts: "Repères vérifiés",
    level: "Niveau",
    competition: "Compétition & catégorie",
    announcement: "Annonce archivée",
    sourceLink: "Voir la source",
    publishedYear: "année de la source",
  },
  ar: {
    achievements: "الإنجازات",
    achievementsIntro:
      "مسارات ونتائج موثقة بمصادرها، مع الحفاظ على مستوى كل تميز ودلالته.",
    gallery: "حياة أنوال بالصور",
    galleryIntro: "مجموعات موثقة تقود إلى معارض الصور لدى ناشريها.",
    sources: "المصادر والوسائط",
    sourcesIntro: "سجل البحث: الروابط الأصلية والتواريخ والحقوق وقرارات النشر.",
    all: "الكل",
    year: "جميع السنوات",
    categories: "جميع المواضيع",
    excellence: "التفوق والجوائز",
    sports: "الرياضة والمسابقات",
    reading: "القراءة والثقافة",
    environment: "البيئة والتنوع البيولوجي",
    arts: "المسرح والموسيقى والفنون",
    school: "الحياة المدرسية والتكوين",
    openGallery: "افتح المعرض الأصلي",
    externalPhotos:
      "تفتح الصور الصحفية في موقع ناشرها مع الحفاظ على نسبتها إليه.",
    pressGallery: "معرض صحفي",
    shared: "حدث مشترك",
    sharedNote:
      "تشمل هذه التغطية مؤسسات متعددة، ولم تثبت هوية جميع الأشخاص المصورين كتلاميذ لأنوال.",
    schoolScope: "نشاط بأنوال",
    photoRefs: "مراجع الصور",
    collage: "تركيب من صور متعددة",
    overlap: "يتضمن أيضاً صوراً من",
    collections: "مجموعات",
    read: "اقرأ المقال",
    collection: "مجموعة",
    close: "إغلاق",
    previous: "السابق",
    next: "التالي",
    slide: "العنصر",
    source: "المصدر الأصلي",
    sourcePublished: "نشر المصدر في",
    event: "تاريخ النشاط",
    context: "السياق والدقة",
    related: "للمزيد من الاكتشاف",
    watch: "شاهد على YouTube",
    play: "تشغيل الفيديو",
    videoNotice:
      "يحمل مشغل YouTube بعد النقر. إذا تعذر التشغيل، افتح الفيديو على YouTube.",
    loading: "جار التحميل…",
    retry: "أعد المحاولة",
    unavailable: "السجل غير متاح مؤقتاً.",
    noResults: "لا توجد عناصر مطابقة لهذه المعايير.",
    archive: "أرشيف جهوي",
    archiveNote:
      "شمل استقبال 2017 مؤسسات ورياضات متعددة. لا تقدم مقاطعه كتقارير خاصة بأنوال.",
    inventory: "اطلع على السجل الكامل",
    download: "تنزيل السجل",
    search: "ابحث في المصادر…",
    sourceRecords: "مصدرًا",
    images: "مرجعاً للصور",
    videos: "فيديو مرجعياً",
    type: "نوع الوسيط",
    status: "الحالة",
    credit: "النسبة والناشر",
    date: "التاريخ",
    rights: "إعادة الاستخدام",
    unknownDate: "غير مثبت",
    originalImage: "رابط الصورة الأصلية",
    permission: "إذن إعادة النشر غير مثبت",
    notHosted: "رابط إلى المعرض دون استضافة نسخة",
    reviewed: "صورة تمت مراجعتها",
    notAvailable: "الصورة غير متاحة أثناء المراجعة",
    sourceReviewed: "مصدر تمت مراجعته",
    included: "مدمج",
    excluded: "محفوظ في السجل",
    articleDate: "تقرير منشور",
    champion: "بطل",
    "runner-up": "الرتبة الثانية",
    bronze: "برونزية",
    participation: "مشاركة",
    qualification: "تأهل",
    selection: "انتقاء",
    recognition: "اعتراف",
    distinction: "تميز",
    photoUnavailable: "معاينة الصورة غير متاحة",
    imageRights: "تظل الصور لدى ناشرها.",
    facts: "معطيات موثقة",
    level: "المستوى",
    competition: "المسابقة والفئة",
    announcement: "إعلان مؤرشف",
    sourceLink: "اطلع على المصدر",
    publishedYear: "سنة المصدر",
  },
  en: {
    achievements: "Achievements",
    achievementsIntro:
      "Journeys and results, with their sources. Every distinction keeps its level and its meaning.",
    gallery: "Anwal life, in pictures",
    galleryIntro:
      "Documented collections leading to their publishers’ original galleries.",
    sources: "Sources & media",
    sourcesIntro:
      "The research register: original links, dates, credits and publication decisions.",
    all: "All",
    year: "All years",
    categories: "All themes",
    excellence: "Excellence & awards",
    sports: "Sports & competitions",
    reading: "Reading & culture",
    environment: "Environment & biodiversity",
    arts: "Theatre, music & visual arts",
    school: "School life & teacher development",
    openGallery: "Open original gallery",
    externalPhotos:
      "Press photographs open on their publisher’s website, with their credits.",
    pressGallery: "Press gallery",
    shared: "Shared event",
    sharedNote:
      "This coverage includes several schools. The photographed people are not all identified as Anwal pupils.",
    schoolScope: "Event at Anwal",
    photoRefs: "image references",
    collage: "Photo collage",
    overlap: "Also contains photographs from",
    collections: "collections",
    read: "Read the article",
    collection: "Collection",
    close: "Close",
    previous: "Previous",
    next: "Next",
    slide: "Item",
    source: "Original source",
    sourcePublished: "Source published",
    event: "Event date",
    context: "Context & accuracy",
    related: "Continue exploring",
    watch: "Watch on YouTube",
    play: "Play video",
    videoNotice:
      "The YouTube player loads after your click. If playback fails, open the video on YouTube.",
    loading: "Loading…",
    retry: "Try again",
    unavailable: "The register is temporarily unavailable.",
    noResults: "No items match these filters.",
    archive: "Regional archive",
    archiveNote:
      "The 2017 reception covered several schools and sports. Its clips are not presented as Anwal-specific footage.",
    inventory: "View the complete register",
    download: "Download the register",
    search: "Search the sources…",
    sourceRecords: "sources",
    images: "image references",
    videos: "video references",
    type: "Media type",
    status: "Status",
    credit: "Credit / publisher",
    date: "Date",
    rights: "Reuse",
    unknownDate: "Not established",
    originalImage: "Original image link",
    permission: "Republication permission unestablished",
    notHosted: "Original gallery linked; no copy hosted",
    reviewed: "Image reviewed",
    notAvailable: "Image unavailable during review",
    sourceReviewed: "Source reviewed",
    included: "Included",
    excluded: "Retained in inventory",
    articleDate: "Report published",
    champion: "Champion",
    "runner-up": "Runner-up",
    bronze: "Bronze",
    participation: "Participation",
    qualification: "Qualification",
    selection: "Selection",
    recognition: "Recognition",
    distinction: "Distinction",
    photoUnavailable: "Photo preview unavailable",
    imageRights: "Images remain with their publisher.",
    facts: "Verified context",
    level: "Level",
    competition: "Competition & category",
    announcement: "Archived announcement",
    sourceLink: "View source",
    publishedYear: "source year",
  },
};
const categoryIcons = {
  excellence: Award,
  sports: Trophy,
  reading: BookOpen,
  environment: Leaf,
  arts: Camera,
  school: GraduationCap,
};
const categories = Object.keys(categoryIcons) as ResearchCategory[];
const date = (value: string, lang: Lang) =>
  !value
    ? researchLabels[lang].unknownDate
    : /^\d{4}-\d{2}-\d{2}/.test(value)
      ? new Intl.DateTimeFormat(lang === "ar" ? "ar-MA" : lang, {
          dateStyle: "long",
        }).format(new Date(value.slice(0, 10) + "T12:00:00Z"))
      : value;
const yearOf = (item: ContentItem) =>
  item.research?.year || Number(item.publishedAt.slice(0, 4));
export const displayDate = (item: ContentItem, lang: Lang) =>
  item.research
    ? localText(item.research.dateLabel, lang)
    : date(item.publishedAt, lang);

export function ContentArtwork({
  item,
  language,
  className = "",
}: {
  item: ContentItem;
  language: Lang;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const category = item.research?.categoryKey || "school";
  const Icon = item.kind === "video" ? Play : categoryIcons[category];
  useEffect(() => setFailed(false), [item.cover]);
  return (
    <div className={`research-artwork artwork-${category} ${className}`}>
      {item.cover && !failed ? (
        <img
          src={item.cover}
          width={1200}
          height={800}
          alt={localText(item.alt, language)}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <span className="artwork-lines" aria-hidden="true" />
          <Icon size={42} strokeWidth={1.3} aria-hidden="true" />
          <span>
            {failed
              ? researchLabels[language].photoUnavailable
              : item.kind === "album"
                ? researchLabels[language].pressGallery
                : researchLabels[language][category]}
          </span>
        </>
      )}
    </div>
  );
}

export function VideoPlayer({
  item,
  language,
}: {
  item: ContentItem;
  language: Lang;
}) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = researchLabels[language];
  const id = /(?:v=|youtu\.be\/|\/embed\/)([\w-]{11})(?:[^\w-]|$)/.exec(
    item.media,
  )?.[1];
  useEffect(() => {
    setPlaying(false);
    setFailed(false);
  }, [item.id]);
  if (!id) return null;
  return (
    <section
      className="research-video-player"
      aria-label={localText(item.title, language)}
    >
      <div className="video-stage">
        {playing && !failed ? (
          <iframe
            key={id}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={localText(item.title, language)}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setFailed(true)}
          />
        ) : (
          <button
            className="video-launch"
            onClick={() => {
              setFailed(false);
              setPlaying(true);
            }}
            aria-label={`${t.play} · ${localText(item.title, language)}`}
          >
            <ContentArtwork item={item} language={language} />
            <span className="video-play">
              <Play size={25} fill="currentColor" />
              {t.play}
            </span>
          </button>
        )}
      </div>
      <div className="video-under">
        <p>{t.videoNotice}</p>
        <a
          className="workspace-button"
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.watch}
          <ExternalLink size={16} />
        </a>
      </div>
      <small>
        {item.credit}
        {item.research?.originalVideoTitle && (
          <> · {item.research.originalVideoTitle}</>
        )}
      </small>
    </section>
  );
}

export function AchievementsTimeline({
  items,
  language,
  compact = false,
  onNavigate,
}: {
  items: ContentItem[];
  language: Lang;
  compact?: boolean;
  onNavigate: (path: string) => void;
}) {
  const [category, setCategory] = useState("");
  const t = researchLabels[language];
  const achievements = items
    .filter(
      (i) =>
        i.kind === "achievement" &&
        (!category || i.research?.categoryKey === category),
    )
    .sort(
      (a, b) =>
        yearOf(b) - yearOf(a) ||
        (b.research?.eventDate || "").localeCompare(
          a.research?.eventDate || "",
        ),
    );
  const shown = compact
    ? achievements.filter((i) => i.featured).slice(0, 3)
    : achievements;
  return (
    <div className={compact ? "achievement-preview" : "achievement-browser"}>
      {!compact && (
        <div className="research-filter-chips" aria-label={t.categories}>
          {[
            "",
            ...categories.filter(
              (c) =>
                achievements.some((i) => i.research?.categoryKey === c) ||
                c === category,
            ),
          ].map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c ? t[c as ResearchCategory] : t.all}
            </button>
          ))}
        </div>
      )}
      <div className={compact ? "achievement-grid" : "achievement-timeline"}>
        {shown.map((item) => {
          const meta = item.research;
          return (
            <article key={item.id} className="achievement-entry">
              <div className="achievement-year">
                <span>{meta?.year}</span>
                <span className="timeline-node" aria-hidden="true" />
              </div>
              <div className="achievement-card">
                <div className="achievement-meta">
                  <span className={`research-badge outcome-${meta?.outcome}`}>
                    {t[meta?.outcome as keyof typeof t] || t.distinction}
                  </span>
                  <span>{meta && localText(meta.level, language)}</span>
                </div>
                <h3>
                  <a
                    href={contentPath(item)}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onNavigate(contentPath(item));
                      }
                    }}
                  >
                    {localText(item.title, language)}
                  </a>
                </h3>
                <p className="achievement-competition">
                  {meta && localText(meta.competition, language)}
                </p>
                <p>{localText(item.summary, language)}</p>
                <div className="achievement-bottom">
                  <span>
                    <CalendarDays size={14} />
                    {displayDate(item, language)}
                  </span>
                  <a
                    href={item.source}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.sourceLink}
                    <ArrowUpRight size={15} />
                  </a>
                </div>
                {!compact && meta && localText(meta.accuracyNote, language) && (
                  <details className="research-accuracy">
                    <summary>{t.context}</summary>
                    <p>{localText(meta.accuracyNote, language)}</p>
                  </details>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function GalleryPhoto({
  item,
  language,
}: {
  item: ContentItem;
  language: Lang;
}) {
  const [failed, setFailed] = useState(false);
  const t = researchLabels[language];
  useEffect(() => setFailed(false), [item.id, item.cover]);
  return failed ? (
    <div className="gallery-external-preview" role="status">
      <ImageOff size={38} />
      <p>{t.photoUnavailable}</p>
      {item.source && (
        <a
          className="workspace-button"
          href={item.source}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.source}
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  ) : (
    <img
      src={item.cover}
      width={1200}
      height={800}
      alt={localText(item.alt, language)}
      onError={() => setFailed(true)}
    />
  );
}

export function GalleryBrowser({
  items,
  language,
  onNavigate,
  compact = false,
}: {
  items: ContentItem[];
  language: Lang;
  onNavigate: (path: string) => void;
  compact?: boolean;
}) {
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const t = researchLabels[language];
  const collections = items
    .filter(
      (i) =>
        ["album", "photo"].includes(i.kind) &&
        (!i.albumId || i.kind === "album"),
    )
    .sort(
      (a, b) =>
        yearOf(b) - yearOf(a) || b.publishedAt.localeCompare(a.publishedAt),
    );
  const filtered = collections.filter(
    (i) =>
      (!category || i.research?.categoryKey === category) &&
      (!year || String(yearOf(i)) === year),
  );
  const shown = compact ? filtered.slice(0, 4) : filtered;
  const slides = useMemo(
    () =>
      shown.flatMap((item) => {
        const photos =
          item.kind === "album"
            ? items.filter(
                (i) => i.kind === "photo" && i.albumId === item.id && i.cover,
              )
            : [];
        return photos.length ? photos : [item];
      }),
    [items, shown.map((i) => i.id).join(",")],
  );
  const current = selected === null ? null : slides[selected];
  const move = (delta: number) =>
    setSelected((value) =>
      value === null ? null : (value + delta + slides.length) % slides.length,
    );
  return (
    <>
      {!compact && (
        <>
          <p className="gallery-policy">
            <ExternalLink size={17} />
            {t.externalPhotos}
          </p>
          <div className="research-gallery-filters">
            <label>
              <span>{t.categories}</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSelected(null);
                }}
              >
                <option value="">{t.categories}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {t[c]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t.year}</span>
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setSelected(null);
                }}
              >
                <option value="">{t.year}</option>
                {[...new Set(collections.map(yearOf))]
                  .sort((a, b) => b - a)
                  .map((y) => (
                    <option key={y}>{y}</option>
                  ))}
              </select>
            </label>
            <span role="status">
              {new Intl.NumberFormat(language).format(shown.length)}{" "}
              {shown.length === 1 ? t.collection : t.collections}
            </span>
          </div>
        </>
      )}
      <div
        className={`research-gallery-grid ${compact ? "gallery-preview" : ""}`}
      >
        {shown.map((item) => (
          <article className="research-gallery-card" key={item.id}>
            <button
              className="gallery-open"
              onClick={() =>
                setSelected(
                  slides.findIndex(
                    (slide) =>
                      slide.id === item.id || slide.albumId === item.id,
                  ),
                )
              }
              aria-label={`${t.collection} · ${localText(item.title, language)}`}
            >
              <ContentArtwork item={item} language={language} />
              <span className="gallery-open-mark">
                <ArrowUpRight size={19} />
              </span>
            </button>
            <div className="gallery-card-body">
              <div className="gallery-card-meta">
                <span>
                  {item.research?.categoryKey
                    ? t[item.research.categoryKey]
                    : t.gallery}
                </span>
                <span>
                  {yearOf(item)}
                  {["disputed", "publication-only", "document-year"].includes(
                    item.research?.datePrecision || "",
                  )
                    ? " · " + t.publishedYear
                    : ""}
                </span>
              </div>
              <h3>{localText(item.title, language)}</h3>
              <p>{displayDate(item, language)}</p>
              {item.research?.scope === "shared" && (
                <span className="research-badge">{t.shared}</span>
              )}
              <div className="gallery-card-bottom">
                <small>
                  {item.credit}
                  {item.research?.imageIds?.length
                    ? ` · ${t.photoRefs}: ${item.research.imageIds.length}`
                    : ""}
                </small>
                <a
                  href={item.source || contentPath(item)}
                  target={item.source ? "_blank" : undefined}
                  rel={item.source ? "noopener noreferrer" : undefined}
                >
                  {item.source ? t.source : t.collection}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && (
        <p className="anwal-empty" role="status">
          {t.noResults}
        </p>
      )}
      {current && (
        <WorkspaceDialog
          className="gallery-dialog max-w-4xl"
          label={localText(current.title, language)}
          onClose={() => setSelected(null)}
        >
          <div
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                move(language === "ar" ? -1 : 1);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                move(language === "ar" ? 1 : -1);
              }
            }}
          >
            <header className="gallery-dialog-header">
              <span aria-live="polite">
                {t.slide} {(selected || 0) + 1} / {slides.length}
              </span>
              <button
                autoFocus
                className="workspace-icon-button"
                aria-label={t.close}
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="gallery-dialog-stage">
              {current.cover ? (
                <GalleryPhoto item={current} language={language} />
              ) : (
                <div className="gallery-external-preview">
                  <Camera size={44} strokeWidth={1.2} />
                  <h2>{localText(current.title, language)}</h2>
                  <p>
                    {current.source ? t.externalPhotos : t.photoUnavailable}
                  </p>
                  {current.source && (
                    <a
                      className="anwal-button"
                      href={current.source}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.openGallery}
                      <ExternalLink size={17} />
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="gallery-dialog-caption">
              <div>
                <h2>{localText(current.title, language)}</h2>
                <p>{displayDate(current, language)}</p>
                <small>
                  {current.credit} ·{" "}
                  {current.research?.scope === "shared"
                    ? t.shared
                    : t.schoolScope}
                </small>
                <p>
                  {current.research &&
                    localText(current.research.accuracyNote, language)}
                </p>
                <a
                  href={contentPath(current)}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      setSelected(null);
                      onNavigate(contentPath(current));
                    }
                  }}
                >
                  {t.read}
                  <ArrowUpRight size={15} />
                </a>
              </div>
              <div className="gallery-dialog-controls">
                <button
                  className="workspace-icon-button"
                  aria-label={t.previous}
                  onClick={() => move(-1)}
                  disabled={slides.length < 2}
                >
                  <ChevronLeft className="rtl:rotate-180" />
                </button>
                <button
                  className="workspace-icon-button"
                  aria-label={t.next}
                  onClick={() => move(1)}
                  disabled={slides.length < 2}
                >
                  <ChevronRight className="rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </WorkspaceDialog>
      )}
    </>
  );
}

export function ResearchDetails({
  item,
  items,
  language,
  onNavigate,
}: {
  item: ContentItem;
  items: ContentItem[];
  language: Lang;
  onNavigate: (path: string) => void;
}) {
  const t = researchLabels[language];
  const meta = item.research;
  if (!meta) return null;
  const related = items.filter((i) => meta.relatedIds.includes(i.id));
  return (
    <div className="research-detail-extra">
      <dl className="research-facts">
        <div>
          <dt>{t.event}</dt>
          <dd>{localText(meta.dateLabel, language)}</dd>
        </div>
        <div>
          <dt>{t.sourcePublished}</dt>
          <dd>{date(meta.sourcePublishedAt, language)}</dd>
        </div>
        {item.kind === "achievement" && (
          <>
            <div>
              <dt>{t.level}</dt>
              <dd>{localText(meta.level, language)}</dd>
            </div>
            <div>
              <dt>{t.competition}</dt>
              <dd>{localText(meta.competition, language)}</dd>
            </div>
          </>
        )}
      </dl>
      {localText(meta.accuracyNote, language) && (
        <aside className="research-note">
          <ShieldCheck size={19} />
          <div>
            <strong>
              {item.kind === "announcement" ? t.announcement : t.context}
            </strong>
            <p>{localText(meta.accuracyNote, language)}</p>
          </div>
        </aside>
      )}
      {meta.scope === "shared" && (
        <p className="research-shared">
          <span className="research-badge">{t.shared}</span>
          {t.sharedNote}
        </p>
      )}
      {item.kind === "album" && (
        <div className="research-album-source">
          <Camera size={27} />
          <div>
            <h2>{t.pressGallery}</h2>
            <p>
              {t.imageRights}{" "}
              {meta.imageIds?.length
                ? `${t.photoRefs}: ${meta.imageIds.length}`
                : ""}
            </p>
            <a
              className="anwal-button"
              href={item.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.openGallery}
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      )}
      {related.length > 0 && (
        <section className="research-related">
          <h2>{t.related}</h2>
          <div>
            {related.map((entry) => (
              <a
                key={entry.id}
                href={contentPath(entry)}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    onNavigate(contentPath(entry));
                  }
                }}
              >
                <span>
                  {entry.kind === "album"
                    ? t.collection
                    : entry.kind === "achievement"
                      ? t.achievements
                      : entry.kind === "video"
                        ? t.videos
                        : t.read}
                </span>
                <strong>{localText(entry.title, language)}</strong>
                <ArrowUpRight size={18} />
              </a>
            ))}
          </div>
        </section>
      )}
      <section className="research-sources">
        <h2>{t.sources}</h2>
        {meta.sources?.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              {source.id} · {source.credit}
            </span>
            <small>{date(source.publishedAt, language)}</small>
            <ExternalLink size={15} />
          </a>
        ))}
      </section>
      <a
        className="research-inventory-link"
        href={`/sources?source=${meta.sourceIds[0]}`}
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onNavigate(`/sources?source=${meta.sourceIds[0]}`);
          }
        }}
      >
        {t.inventory}
        <FileText size={16} />
      </a>
    </div>
  );
}

function videoReason(id: string, language: Lang) {
  const fr =
    id === "V11"
      ? "Lecteur indisponible ; la référence d’origine comporte aussi un suffixe mal formé."
      : id === "V10"
        ? "Finale de football sans résultat attribué à Anwal."
        : ["V08", "V09"].includes(id)
          ? "Prestation d’une école de Takelft / Azilal, pas d’Anwal."
          : id === "V01" || id === "V02"
            ? "Reportage consacré à Anwal, lecteur intégré après interaction."
            : "Réception régionale partagée : référence externe conservée, pas un reportage propre à Anwal.";
  const ar =
    id === "V11"
      ? "الفيديو غير متاح، كما أن الرابط الأصلي يتضمن لاحقة غير سليمة."
      : id === "V10"
        ? "نهائي كرة القدم لا يتعلق بإنجاز مثبت لأنوال."
        : ["V08", "V09"].includes(id)
          ? "عرض لمؤسسة من تاكلفت بأزيلال، وليس لأنوال."
          : id === "V01" || id === "V02"
            ? "تقرير خاص بأنوال، يفتح مشغله بعد التفاعل."
            : "استقبال جهوي مشترك؛ المرجع محفوظ ولا يقدم كتقرير خاص بأنوال.";
  const en =
    id === "V11"
      ? "Unavailable video; the original embed also has a malformed suffix."
      : id === "V10"
        ? "Football final unrelated to a documented Anwal result."
        : ["V08", "V09"].includes(id)
          ? "Performance by a Takelft / Azilal school, not Anwal."
          : id === "V01" || id === "V02"
            ? "School-focused report, embedded after interaction."
            : "Shared regional reception: retained as an external reference, not Anwal-specific footage.";
  return { fr, ar, en }[language];
}
type InventoryRecord = {
  id: string;
  mediaType: string;
  title: string | Record<Lang, string>;
  url: string;
  sourceUrl?: string;
  watchUrl?: string;
  sourceId?: string;
  credit: string;
  status: string;
  scope?: string;
  year?: number;
  publishedAt?: string;
  sourcePublishedAt?: string;
  eventDate?: string;
  datePrecision?: string;
  reusePermission?: string;
  disposition?: string;
  reason?: string;
  width?: number;
  height?: number;
  overlapsWith?: string[];
};
type Inventory = {
  sources: InventoryRecord[];
  images: InventoryRecord[];
  videos: InventoryRecord[];
  summary: Record<string, number>;
  checkedOn: string;
};
export function SourceInventoryView({ language }: { language: Lang }) {
  const [data, setData] = useState<Inventory | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState(
    new URLSearchParams(location.search).get("source") || "",
  );
  const t = researchLabels[language];
  useEffect(() => {
    const request = new AbortController();
    setFailed(false);
    fetch("/research/source-inventory.json", { signal: request.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (
          !Array.isArray(d.sources) ||
          !Array.isArray(d.images) ||
          !Array.isArray(d.videos)
        )
          throw Error();
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setFailed(true);
      });
    return () => request.abort();
  }, [attempt]);
  const records = data
    ? [...data.sources, ...data.images, ...data.videos].filter(
        (r) =>
          (kind === "all" ||
            (kind === "sources"
              ? r.mediaType === "source"
              : kind === "images"
                ? r.mediaType !== "source" && r.mediaType !== "video"
                : r.mediaType === "video")) &&
          JSON.stringify(r)
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
      )
    : [];
  const title = (r: InventoryRecord) =>
    typeof r.title === "string" ? r.title : r.title[language];
  const credit = (r: InventoryRecord) =>
    r.credit.replace(
      " · photographer not identified",
      {
        fr: " · photographe non identifié",
        ar: " · المصور غير محدد",
        en: " · photographer not identified",
      }[language],
    );
  const status = (r: InventoryRecord) =>
    r.mediaType === "source"
      ? t.sourceReviewed
      : r.mediaType === "video"
        ? r.disposition === "embedded-on-interaction"
          ? t.included
          : t.excluded
        : r.status === "reviewed-image"
          ? t.reviewed
          : t.notAvailable;
  return (
    <div className="source-inventory">
      <header className="anwal-page-heading">
        <p className="anwal-eyebrow">ANWAL DIGITAL / {t.sources}</p>
        <h1>{t.sources}</h1>
        <p>{t.sourcesIntro}</p>
      </header>
      {failed ? (
        <div className="anwal-empty" role="alert">
          {t.unavailable}
          <button
            className="workspace-button"
            onClick={() => setAttempt((n) => n + 1)}
          >
            {t.retry}
          </button>
        </div>
      ) : !data ? (
        <p role="status">{t.loading}</p>
      ) : (
        <>
          <div className="inventory-metrics">
            <div>
              <strong>{data.sources.length}</strong>
              <span>{t.sourceRecords}</span>
            </div>
            <div>
              <strong>{data.images.length}</strong>
              <span>{t.images}</span>
            </div>
            <div>
              <strong>{data.videos.length}</strong>
              <span>{t.videos}</span>
            </div>
          </div>
          <p className="gallery-policy">
            <ShieldCheck size={18} />
            {t.externalPhotos}
          </p>
          <div className="inventory-toolbar">
            <label className="anwal-search">
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                aria-label={t.search}
              />
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              aria-label={t.type}
            >
              {["all", "sources", "images", "videos"].map((k) => (
                <option key={k} value={k}>
                  {k === "all"
                    ? t.all
                    : k === "sources"
                      ? t.sourceRecords
                      : k === "images"
                        ? t.images
                        : t.videos}
                </option>
              ))}
            </select>
            <a
              className="workspace-button"
              href="/research/source-inventory.json"
              download="anwal-source-inventory.json"
            >
              {t.download}
              <ArrowUpRight size={15} />
            </a>
          </div>
          <p className="inventory-count" role="status">
            {new Intl.NumberFormat(language).format(records.length)} ·{" "}
            {data.checkedOn}
          </p>
          <div className="inventory-records">
            {records.map((r) => (
              <article key={r.id} className="inventory-record">
                <header>
                  <span className="research-badge">{r.id}</span>
                  <span>{status(r)}</span>
                </header>
                {r.mediaType === "photo-collage" && (
                  <span className="research-badge">{t.collage}</span>
                )}
                <h2>{title(r)}</h2>
                <p>{credit(r)}</p>
                <dl>
                  <div>
                    <dt>{t.date}</dt>
                    <dd>
                      {date(
                        r.publishedAt || r.sourcePublishedAt || "",
                        language,
                      )}
                    </dd>
                  </div>
                  {r.eventDate && (
                    <div>
                      <dt>{t.event}</dt>
                      <dd>{date(r.eventDate, language)}</dd>
                    </div>
                  )}
                  {r.scope && (
                    <div>
                      <dt>{t.context}</dt>
                      <dd>{r.scope === "shared" ? t.shared : t.schoolScope}</dd>
                    </div>
                  )}
                  {r.reusePermission && (
                    <div>
                      <dt>{t.rights}</dt>
                      <dd>{t.permission}</dd>
                    </div>
                  )}
                </dl>
                {r.reason && (
                  <details>
                    <summary>{t.context}</summary>
                    <p>{videoReason(r.id, language)}</p>
                  </details>
                )}
                {Boolean(r.overlapsWith?.length) && (
                  <small>
                    {t.overlap}: {r.overlapsWith?.join(", ")}
                  </small>
                )}
                <footer>
                  <a
                    href={r.sourceUrl || r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.source}
                    <ExternalLink size={15} />
                  </a>
                  {r.mediaType !== "source" &&
                    r.mediaType !== "video" &&
                    r.status === "reviewed-image" && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {t.originalImage}
                        <ArrowUpRight size={15} />
                      </a>
                    )}
                  {r.mediaType === "video" && r.watchUrl && (
                    <a
                      href={r.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.watch}
                      <ArrowUpRight size={15} />
                    </a>
                  )}
                </footer>
              </article>
            ))}
          </div>
          {!records.length && <p className="anwal-empty">{t.noResults}</p>}
        </>
      )}
    </div>
  );
}
