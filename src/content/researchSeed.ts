import editorial from "./researchEditorial.json" with { type: "json" };
import inventory from "../../public/research/source-inventory.json" with { type: "json" };
import {
  text3,
  type CmsState,
  type ContentItem,
  type LocalText,
  type ResearchCategory,
} from "../types/cms.js";

export const RESEARCH_VERSION = 1;
const sourceById = new Map(
  inventory.sources.map((source) => [source.id, source]),
);
const categoryNames = {
  excellence: text3("Excellence", "التفوق", "Excellence"),
  sports: text3("Sport", "الرياضة", "Sports"),
  reading: text3("Lecture & culture", "القراءة والثقافة", "Reading & culture"),
  environment: text3("Environnement", "البيئة", "Environment"),
  arts: text3("Arts", "الفنون", "Arts"),
  school: text3("Vie scolaire", "الحياة المدرسية", "School life"),
};

function dateLabel(record: (typeof editorial)[number]): LocalText {
  if (record.datePrecision === "disputed")
    return text3(
      "Date de l’atelier à confirmer",
      "تاريخ الورشة غير محسوم",
      "Workshop date unresolved",
    );
  if (record.datePrecision === "announcement")
    return text3(
      "Annonce : mars 2026",
      "إعلان: مارس 2026",
      "Announcement: March 2026",
    );
  if (record.datePrecision === "school-year")
    return text3(
      "Année scolaire 2025–2026",
      "الموسم الدراسي 2025–2026",
      "School year 2025–2026",
    );
  if (record.datePrecision === "document-year")
    return text3(
      "Édition ministérielle 2026",
      "الإصدار الوزاري 2026",
      "Ministry edition 2026",
    );
  if (record.datePrecision === "publication-only")
    return text3(
      `${record.year} · date de l’activité non confirmée`,
      `${record.year} · تاريخ النشاط غير مؤكد`,
      `${record.year} · event date unconfirmed`,
    );
  if (record.datePrecision === "range")
    return record.year === 2019
      ? text3("25–29 décembre 2019", "25–29 دجنبر 2019", "25–29 December 2019")
      : text3("7–8 octobre 2020", "7–8 أكتوبر 2020", "7–8 October 2020");
  if (record.slug === "selection-cross-2019")
    return text3("6–7 novembre 2019", "6–7 نونبر 2019", "6–7 November 2019");
  const date = new Date(
    record.eventDate.length === 7
      ? record.eventDate + "-15T12:00:00Z"
      : record.eventDate + "T12:00:00Z",
  );
  return Object.fromEntries(
    ["fr", "ar", "en"].map((language) => [
      language,
      new Intl.DateTimeFormat(
        language === "ar" ? "ar-MA" : language,
        record.datePrecision === "month"
          ? { year: "numeric", month: "long" }
          : { dateStyle: "long" },
      ).format(date),
    ]),
  ) as LocalText;
}

export function createResearchItems(): ContentItem[] {
  return structuredClone(
    editorial.map((record) => {
      const source = sourceById.get(record.sourceIds[0])!;
      const video = inventory.videos.find(
        (video) =>
          video.sourceId === source.id &&
          video.disposition === "embedded-on-interaction",
      );
      const linked = record.relatedSlugs.map(
        (slug) => "anwal-research-" + slug,
      );
      return {
        id: "anwal-research-" + record.slug,
        slug: record.slug,
        kind: record.kind as ContentItem["kind"],
        status: "published",
        title: record.title,
        summary: record.summary,
        body: record.summary,
        category: categoryNames[record.categoryKey as ResearchCategory].fr,
        cover: "",
        alt: text3(),
        media: record.kind === "video" && video ? video.watchUrl : "",
        source: source.url,
        credit: source.credit,
        author: "Anwal Digital",
        ownerId: "anwal-research-import",
        clubId: "",
        albumId: "",
        grade: "",
        subject: "",
        location: "Khénifra",
        startsAt: "",
        endsAt: "",
        publishedAt: /^\d{4}-\d{2}-\d{2}$/.test(source.publishedAt)
          ? source.publishedAt + "T12:00:00Z"
          : new Date().toISOString(),
        expiresAt: "",
        featured: record.featured,
        priority: "normal",
        consent: true,
        updatedAt: new Date().toISOString(),
        revision: 1,
        seoTitle: record.title,
        seoDescription: record.summary,
        research: {
          sourceIds: record.sourceIds,
          categoryKey: record.categoryKey as ResearchCategory,
          year: record.year,
          sources: record.sourceIds.map((id) => {
            const source = sourceById.get(id)!;
            return {
              id,
              url: source.url,
              credit: source.credit,
              publishedAt: source.publishedAt,
            };
          }),
          eventDate: record.eventDate,
          eventEnd:
            record.slug.includes("2019") && record.datePrecision === "range"
              ? "2019-12-29"
              : record.datePrecision === "range"
                ? "2020-10-08"
                : record.slug === "selection-cross-2019"
                  ? "2019-11-07"
                  : "",
          datePrecision: record.datePrecision,
          dateLabel: dateLabel(record),
          sourcePublishedAt: source.publishedAt,
          accuracyNote: record.accuracyNote,
          relatedIds: linked,
          level: record.level,
          competition: record.competition,
          outcome: record.outcome,
          ...("imageIds" in record
            ? {
                imageIds: record.imageIds,
                externalGallery: true,
                scope: record.scope as "school" | "shared",
              }
            : {}),
          ...(record.kind === "video" && video
            ? {
                videoId: /v=([\w-]{11})/.exec(video.watchUrl)![1],
                embedAllowed: video.embedAllowed,
                originalVideoTitle: video.title,
              }
            : {}),
        },
      };
    }),
  );
}

/** One versioned import, preserving customized entries and all private school data. */
export function migrateResearchCms(db: CmsState): boolean {
  if ((db.researchVersion || 0) >= RESEARCH_VERSION) return false;
  const existingIds = new Set(db.items.map((item) => item.id));
  const existingSlugs = new Set(db.items.map((item) => item.slug));
  db.items = db.items.filter(
    (item) => item.id !== "anwal-architecture-press-2022",
  );
  db.items.push(
    ...createResearchItems().filter(
      (item) => !existingIds.has(item.id) && !existingSlugs.has(item.slug),
    ),
  );
  if (db.settings.heroImage === "/images/anwal-facade.webp") {
    db.settings.heroImage = "";
    db.settings.heroAlt = text3();
    db.settings.heroCredit = "";
    db.settings.heroSource = "";
  }
  db.settings.navigation = [
    ...new Set([...db.settings.navigation, "achievements", "gallery", "tv"]),
  ];
  db.researchVersion = RESEARCH_VERSION;
  db.version++;
  return true;
}
