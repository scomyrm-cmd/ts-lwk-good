import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Leaf,
  Menu,
  Mic,
  Moon,
  Newspaper,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal, fluidSpring } from "../common/FluidMotion";
import { useApp } from "../../context/AppContext";
import {
  contentPath as routeFor,
  defaultSiteSettings,
  localText,
  type ContentItem,
  type PublicSite as SiteData,
} from "../../types/cms";
import { copyFor } from "./copy";
import {
  AchievementsTimeline,
  ContentArtwork,
  GalleryBrowser,
  ResearchDetails,
  SourceInventoryView,
  VideoPlayer,
  displayDate,
  researchLabels,
} from "./ResearchUI";
import "./public.css";

function navigate(to: string) {
  history.pushState(null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  requestAnimationFrame(() =>
    document.getElementById("public-main")?.focus({ preventScroll: true }),
  );
}
function A({
  to,
  children,
  className = "",
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={to}
      aria-current={className === "active" ? "page" : undefined}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </a>
  );
}
const heroCopy = {
  fr: {
    line: "Un collège.",
    accent: "Mille possibles.",
    intro: "Apprendre. Créer. Partager.",
    caption: "La vie du collège, à portée de main.",
    explore: "Un espace pour chaque envie.",
    spaces: "VOTRE COLLÈGE, CONNECTÉ",
    identity: "Grandir ensemble.",
    identitySub: "Khénifra, Maroc",
    journal: "Des idées qui prennent vie.",
    badge: "Découvrir, chaque jour.",
    exploreIntro:
      "Des idées aux projets, trouvez votre place dans la vie du collège.",
  },
  en: {
    line: "One school.",
    accent: "So many possibilities.",
    intro: "Learn. Create. Share.",
    caption: "School life, a little closer.",
    explore: "A space for every interest.",
    spaces: "YOUR SCHOOL, CONNECTED",
    identity: "Growing together.",
    identitySub: "Khénifra, Morocco",
    journal: "Where ideas come to life.",
    badge: "Discover something new.",
    exploreIntro:
      "From ideas to projects, find your place in our school community.",
  },
  ar: {
    line: "نتعلم معاً.",
    accent: "نصنع الغد.",
    intro: "نتعلم. نبدع. نتشارك.",
    caption: "حياة المؤسسة، أقرب إليك.",
    explore: "فضاء لكل اهتمام.",
    spaces: "مؤسستك، متصلة",
    identity: "نكبر معاً.",
    identitySub: "خنيفرة، المغرب",
    journal: "هنا تنبض الأفكار.",
    badge: "كل يوم، اكتشاف جديد.",
    exploreIntro: "من الأفكار إلى المشاريع، اكتشف مكانك في مجتمعنا المدرسي.",
  },
};
const dateLabel = (date: string, language: string) =>
  date
    ? new Intl.DateTimeFormat(language === "ar" ? "ar-MA" : language, {
        dateStyle: "medium",
        timeZone: "Africa/Casablanca",
      }).format(new Date(date))
    : "";
export function ArticleText({ text }: { text: string }) {
  // A deliberately small Markdown vocabulary; HTML and embedded code are never executed.
  return (
    <div className="article-text">
      {text.split("\n").map((line, index) =>
        line.startsWith("## ") ? (
          <h2 key={index}>{line.slice(3)}</h2>
        ) : line.startsWith("### ") ? (
          <h3 key={index}>{line.slice(4)}</h3>
        ) : line.startsWith("- ") ? (
          <p className="article-bullet" key={index}>
            • {line.slice(2)}
          </p>
        ) : line ? (
          <p key={index}>
            {line
              .split(/(\*\*[^*]+\*\*)/g)
              .map((part, i) =>
                part.startsWith("**") ? (
                  <strong key={i}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                ),
              )}
          </p>
        ) : null,
      )}
    </div>
  );
}
export function PublicSite() {
  const { settings, updateSettings } = useApp();
  const reducedMotion = useReducedMotion();
  const lang = settings.language;
  const t = copyFor(lang);
  const rt = researchLabels[lang];
  const tr = (value: Parameters<typeof localText>[0]) => localText(value, lang);
  const [site, setSite] = useState<SiteData>({
    settings: defaultSiteSettings,
    items: [],
  });
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [path, setPath] = useState(window.location.pathname);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [archive, setArchive] = useState("");
  const [calendar, setCalendar] = useState(false);
  const [zoom, setZoom] = useState<ContentItem | null>(null);
  const viewer = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [chat, setChat] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const load = () => {
    setState("loading");
    fetch("/api/public/site", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        setSite(data);
        setState("ready");
      })
      .catch(() => setState("error"));
  };
  useEffect(load, []);
  useEffect(() => {
    const fn = () => {
      setPath(window.location.pathname);
      setMenu(false);
      setSearch("");
      setCategory("");
      setArchive("");
      setGrade("");
      setSubject("");
      setCopied(false);
      document
        .querySelectorAll(".anwal-nav details[open]")
        .forEach((d) => d.removeAttribute("open"));
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", fn);
    return () => window.removeEventListener("popstate", fn);
  }, []);
  useEffect(() => {
    if (zoom && !viewer.current?.open) viewer.current?.showModal();
  }, [zoom]);
  const pieces = path.split("/").filter(Boolean).map(decodeURIComponent);
  const section = pieces[0] || "home";
  const detail = pieces[1]
    ? site.items.find(
        (i) => i.slug === pieces[1] && routeFor(i).split("/")[1] === section,
      )
    : null;
  useEffect(() => {
    const title = detail
      ? tr(detail.seoTitle) || tr(detail.title)
      : section === "home"
        ? tr(site.settings.title)
        : section === "achievements"
          ? rt.achievements
          : section === "sources"
            ? rt.sources
            : t[section as keyof typeof t] || tr(site.settings.title);
    document.title = title + " | Anwal Digital · Campus OS";
    const desc = detail
      ? tr(detail.seoDescription) || tr(detail.summary)
      : tr(site.settings.introduction);
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", desc);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", document.title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", desc);
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = window.location.origin + path;
  }, [site, path, lang]);
  const empty = (
    <div className="anwal-empty" role="status">
      <BookOpen size={25} />
      <p>
        {state === "loading"
          ? "…"
          : state === "error"
            ? t.unavailable
            : t.empty}
      </p>
      {state === "error" && <button onClick={load}>{t.retry}</button>}
    </div>
  );
  const image = (item: ContentItem, cls = "") =>
    item.research ? (
      <ContentArtwork item={item} language={lang} className={cls} />
    ) : item.cover ? (
      <img
        className={cls}
        src={item.cover}
        alt={tr(item.alt)}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.classList.add("image-unavailable");
        }}
      />
    ) : (
      <div className={"anwal-placeholder " + cls}>
        <Newspaper size={34} />
        <span>ANWAL MEDIA</span>
      </div>
    );
  const cards = (items: ContentItem[]) =>
    items.length ? (
      <div className="anwal-grid">
        {items.map((item) => (
          <article className="anwal-card" key={item.id}>
            <A to={routeFor(item)}>
              {image(item)}
              <div className="anwal-card-body">
                <span className="anwal-eyebrow">
                  {item.research
                    ? rt[item.research.categoryKey]
                    : item.category ||
                      t[item.kind as keyof typeof t] ||
                      "ANWAL"}
                </span>
                <h3>{tr(item.title)}</h3>
                <p>{tr(item.summary)}</p>
                <div className="anwal-card-meta">
                  <span>
                    {item.research
                      ? displayDate(item, lang)
                      : dateLabel(item.publishedAt, lang)}
                  </span>
                  <ArrowUpRight size={18} />
                </div>
              </div>
            </A>
          </article>
        ))}
      </div>
    ) : (
      empty
    );
  const heading = (title: string, intro?: string) => (
    <header className="anwal-page-heading">
      <p className="anwal-eyebrow">
        ANWAL DIGITAL / {t[section as keyof typeof t] || title}
      </p>
      <h1>{title}</h1>
      {intro && <p>{intro}</p>}
    </header>
  );
  const block = (title: string, to: string, content: React.ReactNode) => (
    <Reveal className="anwal-section">
      <div className="anwal-section-title">
        <h2>{title}</h2>
        <A to={to}>
          {t.all}
          <ArrowUpRight size={17} />
        </A>
      </div>
      {content}
    </Reveal>
  );
  const mediaLinks = [
    { to: "journal", name: "ANWAL NEWS", desc: t.journal, icon: Newspaper },
    { to: "tv", name: "ANWAL TV", desc: t.tvIntro, icon: Play },
    { to: "radio", name: "RADIO ANWAL", desc: t.radioIntro, icon: Mic },
  ];
  const themeLinks = [
    { to: "science", name: "ANWAL TECH", desc: t.science, icon: Sparkles },
    { to: "sports", name: "ANWAL SPORT", desc: t.sports, icon: Trophy },
    { to: "culture", name: "ANWAL CULTURE", desc: t.culture, icon: BookOpen },
    { to: "environment", name: "ANWAL GREEN", desc: t.environment, icon: Leaf },
  ];
  const toolbar = (items: ContentItem[]) => (
    <div className="anwal-filters">
      <label className="anwal-search">
        <Search size={18} />
        <input
          aria-label={t.search}
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <select
        aria-label={t.categories}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">{t.categories}</option>
        {[...new Set(items.map((i) => i.category).filter(Boolean))].map((c) => (
          <option key={c} value={c}>
            {(() => {
              const key = items.find((i) => i.category === c)?.research
                ?.categoryKey;
              return key ? rt[key] : c;
            })()}
          </option>
        ))}
      </select>
      <select
        aria-label={t.archive}
        value={archive}
        onChange={(e) => setArchive(e.target.value)}
      >
        <option value="">{t.allDates}</option>
        {[...new Set(items.map((i) => i.publishedAt.slice(0, 7)))]
          .sort()
          .reverse()
          .map((c) => (
            <option key={c} value={c}>
              {(() => {
                const key = items.find((i) => i.category === c)?.research
                  ?.categoryKey;
                return key ? rt[key] : c;
              })()}
            </option>
          ))}
      </select>
      {section === "resources" && (
        <>
          <select
            aria-label={t.allYears}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">{t.allYears}</option>
            {["1", "2", "3"].map((g) => (
              <option key={g} value={g}>
                {g} · {t.year}
              </option>
            ))}
          </select>
          <select
            aria-label={t.allSubjects}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">{t.allSubjects}</option>
            {[...new Set(items.map((i) => i.subject).filter(Boolean))].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </>
      )}
    </div>
  );
  const filter = (items: ContentItem[]) =>
    items.filter(
      (i) =>
        (!category || i.category === category) &&
        (!archive || i.publishedAt.startsWith(archive)) &&
        (!grade || i.grade === grade) &&
        (!subject || i.subject === subject) &&
        (!search ||
          (tr(i.title) + " " + tr(i.summary) + " " + tr(i.body))
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase())),
    );
  const mediaPlayer = (item: ContentItem) => {
    if (!item.media) return null;
    const youtube = /(?:youtu\.be\/|[?&]v=|\/embed\/)([\w-]{11})/.exec(
      item.media,
    )?.[1];
    if (item.kind === "video" && youtube)
      return <VideoPlayer item={item} language={lang} />;
    if (item.kind === "podcast")
      return (
        <audio
          className="anwal-audio"
          controls
          preload="metadata"
          src={item.media}
          aria-label={tr(item.title)}
        />
      );
    if (item.kind === "resource")
      return (
        <a
          className="anwal-button"
          href={item.media}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.download}
          <ArrowUpRight size={18} />
        </a>
      );
    return null;
  };
  const collection = () => {
    if (section === "gallery")
      return (
        <>
          {heading(rt.gallery, rt.galleryIntro)}
          <GalleryBrowser
            key={section}
            items={site.items}
            language={lang}
            onNavigate={navigate}
          />
        </>
      );
    if (section === "achievements")
      return (
        <>
          {heading(rt.achievements, rt.achievementsIntro)}
          <AchievementsTimeline
            items={site.items}
            language={lang}
            onNavigate={navigate}
          />
        </>
      );
    if (section === "sources") return <SourceInventoryView language={lang} />;
    const kinds: Record<string, string[]> = {
      news: ["news", "announcement"],
      journal: ["article"],
      clubs: ["club"],
      tv: ["video"],
      radio: ["podcast"],
      podcasts: ["podcast"],
      gallery: ["album", "photo"],
      events: ["event"],
      resources: ["resource"],
      about: ["page", "staff"],
      "virtual-tour": ["page", "photo"],
      "school-life": ["news", "event", "club"],
      science: ["article", "news", "video"],
      sports: ["article", "news", "video", "achievement"],
      culture: ["article", "news", "video", "achievement"],
      environment: ["article", "news", "video"],
    };
    let items = site.items.filter((i) =>
      (kinds[section] || []).includes(i.kind),
    );
    const cats: Record<string, string[]> = {
      science: ["science", "technology", "technologie", "tech", "anwal tech"],
      sports: ["sport", "sports", "anwal sport"],
      culture: ["culture", "anwal culture"],
      environment: ["environment", "environnement", "anwal green"],
    };
    const researchCats: Record<string, string[]> = {
      science: ["school"],
      sports: ["sports"],
      culture: ["reading", "arts"],
      environment: ["environment"],
    };
    if (cats[section])
      items = items.filter((i) =>
        i.research
          ? researchCats[section].includes(i.research.categoryKey)
          : cats[section].includes(i.category.toLowerCase()),
      );
    if (section === "virtual-tour")
      items = items.filter(
        (i) => i.slug === "virtual-tour" || i.category === "virtual-tour",
      );
    const intros: Record<string, string> = {
      about: t.aboutIntro,
      news: t.newsIntro,
      journal: t.journalIntro,
      clubs: t.clubsIntro,
      tv: t.tvIntro,
      radio: t.radioIntro,
      podcasts: t.radioIntro,
      gallery: t.galleryIntro,
      events: t.eventsIntro,
      resources: t.resourcesIntro,
    };
    const shown = filter(items);
    return (
      <>
        {heading(
          section === "journal"
            ? "ANWAL NEWS"
            : t[section as keyof typeof t] || "Anwal Digital",
          intros[section] || t.aboutIntro,
        )}
        {toolbar(items)}
        {section === "events" && (
          <div className="anwal-view-toggle">
            <button aria-pressed={!calendar} onClick={() => setCalendar(false)}>
              {t.list}
            </button>
            <button aria-pressed={calendar} onClick={() => setCalendar(true)}>
              {t.calendar}
            </button>
          </div>
        )}
        {items.length > 0 && shown.length === 0 ? (
          <p className="anwal-empty">{t.noResults}</p>
        ) : section === "events" && calendar ? (
          <div className="anwal-calendar">
            {[
              ...new Set(
                shown.map((i) => i.startsAt.slice(0, 10)).filter(Boolean),
              ),
            ]
              .sort()
              .map((day) => (
                <section key={day}>
                  <h2>{dateLabel(day + "T12:00:00Z", lang)}</h2>
                  {shown
                    .filter((i) => i.startsAt.startsWith(day))
                    .map((i) => (
                      <A key={i.id} to={routeFor(i)}>
                        {tr(i.title)}
                        <small>{i.location}</small>
                      </A>
                    ))}
                </section>
              ))}
            {shown.length === 0 && empty}
          </div>
        ) : (
          cards(shown)
        )}
        {section === "tv" && (
          <p className="gallery-policy">
            {rt.archiveNote}{" "}
            <A to="/sources?source=S08">
              {rt.inventory}
              <ArrowUpRight size={15} />
            </A>
          </p>
        )}
        {section === "about" && (
          <div className="anwal-about-note">
            <GraduationCap size={36} />
            <h2>{tr(site.settings.title)} · Khénifra</h2>
            <p>{tr(site.settings.introduction)}</p>
            <A to="/virtual-tour">
              {t["virtual-tour"]}
              <ArrowUpRight size={18} />
            </A>
          </div>
        )}
      </>
    );
  };
  const detailView = () =>
    detail ? (
      <article className="anwal-detail">
        <A to={"/" + section} className="anwal-back">
          ← {t.back}
        </A>
        <header>
          <p className="anwal-eyebrow">
            {detail.research
              ? rt[detail.research.categoryKey]
              : detail.category || "ANWAL MEDIA"}
          </p>
          <h1>{tr(detail.title)}</h1>
          <p className="anwal-deck">{tr(detail.summary)}</p>
          <div className="anwal-byline">
            {detail.author && <span>{detail.author}</span>}
            <span>
              {detail.research
                ? displayDate(detail, lang)
                : dateLabel(detail.publishedAt, lang)}
            </span>
            {!detail.research && (
              <span>
                {Math.max(
                  1,
                  Math.ceil(tr(detail.body).split(/\s+/).length / 200),
                )}{" "}
                {t.minutes}
              </span>
            )}
          </div>
        </header>
        {detail.cover && (
          <figure>
            {image(detail)}
            {detail.credit && (
              <figcaption>
                {detail.credit}
                {detail.source && (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={detail.source}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.source}
                    </a>
                  </>
                )}
              </figcaption>
            )}
          </figure>
        )}
        {mediaPlayer(detail)}
        {detail.kind === "event" && (
          <div className="anwal-event-detail">
            <CalendarDays />
            {dateLabel(detail.startsAt, lang)}
            {detail.endsAt && " — " + dateLabel(detail.endsAt, lang)}
            <span>{detail.location}</span>
          </div>
        )}
        <ArticleText
          text={
            detail.research && tr(detail.body) === tr(detail.summary)
              ? ""
              : tr(detail.body)
          }
        />
        <ResearchDetails
          item={detail}
          items={site.items}
          language={lang}
          onNavigate={navigate}
        />
        {detail.source && (
          <a
            className="anwal-source"
            href={detail.source}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.source}
            <ArrowUpRight size={16} />
          </a>
        )}
        <button
          className="anwal-button secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? t.copied : t.share}
        </button>
        {detail.kind === "album" && (
          <div className="anwal-photo-grid">
            {site.items
              .filter((i) => i.albumId === detail.id && i.cover)
              .map((i) => (
                <button key={i.id} onClick={() => setZoom(i)}>
                  {image(i)}
                  <span>{tr(i.title)}</span>
                </button>
              ))}
          </div>
        )}
        {detail.kind === "club" &&
          block(
            t.news,
            "/news",
            cards(site.items.filter((i) => i.clubId === detail.id)),
          )}
        {block(
          t.related,
          "/" + section,
          cards(
            site.items
              .filter(
                (i) =>
                  i.id !== detail.id &&
                  i.kind === detail.kind &&
                  i.category === detail.category,
              )
              .slice(0, 3),
          ),
        )}
      </article>
    ) : (
      <>
        {heading(t.notFound)}
        <A to={"/" + section}>{t.back}</A>
      </>
    );
  const hero = heroCopy[lang];
  const home = () => (
    <>
      <section className="anwal-hero">
        <Reveal className="anwal-hero-copy">
          <p className="anwal-eyebrow">
            <span /> {tr(site.settings.title)} · KHÉNIFRA
          </p>
          <h1>
            {hero.line}
            <br />
            <span>{hero.accent}</span>
          </h1>
          <p className="anwal-arabic" lang="ar" dir="rtl">
            الثانوية الإعدادية أنوال – خنيفرة
          </p>
          <p className="anwal-hero-intro">{tr(site.settings.introduction)}</p>
          <div className="anwal-actions">
            <A to="/about" className="anwal-button">
              {t.discover}
              <ArrowRight size={17} />
            </A>
            <a href="/login" className="anwal-text-link">
              {t.campus}
              <ArrowUpRight size={17} />
            </a>
          </div>
          <p className="anwal-hero-footnote">
            <span className="anwal-tiny-mark" /> {hero.intro}
          </p>
        </Reveal>
        <Reveal className="anwal-hero-stage" delay={0.07}>
          <div className="stage-halo" aria-hidden="true" />
          <div className="anwal-school-card">
            <div className="school-card-top">
              <span className="school-card-logo">
                ANWAL<span>DIGITAL</span>
              </span>
              <span className="school-card-dot" />
            </div>
            <div className="school-card-art" aria-hidden="true">
              <span>A</span>
              <span>ن</span>
              <i />
            </div>
            <div className="school-card-bottom">
              <strong>{hero.identity}</strong>
              <span>
                {hero.identitySub}
                <ArrowUpRight size={16} />
              </span>
            </div>
            {site.settings.heroImage && (
              <figure className="school-card-photo">
                <img
                  src={site.settings.heroImage}
                  alt={tr(site.settings.heroAlt)}
                  fetchPriority="high"
                />
                <figcaption>
                  {site.settings.heroCredit}
                  {site.settings.heroSource && (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={site.settings.heroSource}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.source}
                      </a>
                    </>
                  )}
                </figcaption>
              </figure>
            )}
          </div>
          <A to="/clubs" className="stage-chip stage-chip-top">
            <span className="stage-chip-icon">
              <Sparkles size={21} />
            </span>
            <span>
              <small>{hero.badge}</small>
              <strong>{t.clubs}</strong>
            </span>
            <ArrowUpRight size={16} />
          </A>
          <A to="/resources" className="stage-chip stage-chip-bottom">
            <span className="stage-chip-icon">
              <BookOpen size={23} />
            </span>
            <span>
              <strong>{t.resources}</strong>
              <small>{hero.caption}</small>
            </span>
            <ArrowUpRight size={16} />
          </A>
          <span className="stage-caption">ANWAL · {hero.intro}</span>
        </Reveal>
      </section>
      <div className="anwal-topic-bar">
        {[
          { to: "/school-life", label: t["school-life"], icon: GraduationCap },
          { to: "/journal", label: t.journal, icon: Newspaper },
          { to: "/media", label: t.media, icon: Play },
          { to: "/resources", label: t.resources, icon: BookOpen },
        ].map(({ to, label, icon: Icon }) => (
          <A key={to} to={to}>
            <Icon size={19} strokeWidth={1.6} />
            <span>{label}</span>
            <ArrowUpRight size={15} />
          </A>
        ))}
      </div>
      {site.items.some((i) => i.kind === "announcement" && !i.research) && (
        <section className="anwal-notice">
          <span>{t.notice}</span>
          {site.items
            .filter((i) => i.kind === "announcement" && !i.research)
            .sort(
              (a, b) =>
                Number(b.priority === "urgent") -
                Number(a.priority === "urgent"),
            )
            .slice(0, 2)
            .map((i) => (
              <A key={i.id} to={routeFor(i)}>
                {tr(i.title)}
                <ArrowUpRight size={16} />
              </A>
            ))}
        </section>
      )}
      {block(
        t.latest,
        "/news",
        cards(
          site.items
            .filter((i) => ["news", "article"].includes(i.kind))
            .sort(
              (a, b) =>
                Number(b.featured) - Number(a.featured) ||
                b.publishedAt.localeCompare(a.publishedAt),
            )
            .slice(0, 3),
        ),
      )}
      <Reveal className="anwal-section">
        <div className="anwal-section-title">
          <div>
            <p className="anwal-eyebrow">ANWAL · {rt.facts}</p>
            <h2>{rt.achievements}</h2>
          </div>
          <A to="/achievements">
            {t.all}
            <ArrowUpRight size={17} />
          </A>
        </div>
        <AchievementsTimeline
          items={site.items}
          language={lang}
          compact
          onNavigate={navigate}
        />
      </Reveal>
      <Reveal className="anwal-media-feature">
        <div className="anwal-section-title">
          <div>
            <p className="anwal-eyebrow">ANWAL MEDIA</p>
            <h2>{t.mediaTitle}</h2>
          </div>
          <p>{t.mediaIntro}</p>
        </div>
        <div className="anwal-media-grid">
          {mediaLinks.map(({ to, name, desc, icon: Icon }, i) => (
            <A key={to} to={"/" + to} className="anwal-media-card">
              <span className="media-number">0{i + 1}</span>
              <Icon size={30} strokeWidth={1.5} />
              <h3>{name}</h3>
              <p>{desc}</p>
              <ArrowUpRight className="media-arrow" size={22} />
            </A>
          ))}
        </div>
      </Reveal>
      <div className="anwal-two-col">
        {block(
          t.agenda,
          "/events",
          cards(
            site.items
              .filter(
                (i) =>
                  i.kind === "event" && i.startsAt >= new Date().toISOString(),
              )
              .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
              .slice(0, 2),
          ),
        )}
        {block(
          t.clubs,
          "/clubs",
          cards(site.items.filter((i) => i.kind === "club").slice(0, 2)),
        )}
      </div>
      <Reveal className="anwal-themes">
        <div className="anwal-section-title">
          <div>
            <p className="anwal-eyebrow">{hero.spaces}</p>
            <h2>{hero.explore}</h2>
          </div>
          <p>{hero.exploreIntro}</p>
        </div>
        <div>
          {themeLinks.map(({ to, name, desc, icon: Icon }) => (
            <A key={to} to={"/" + to}>
              <Icon size={24} />
              <strong>{name}</strong>
              <span>{desc}</span>
              <ArrowUpRight size={18} />
            </A>
          ))}
        </div>
      </Reveal>
      <Reveal className="anwal-section">
        <div className="anwal-section-title">
          <h2>{rt.gallery}</h2>
          <A to="/gallery">
            {t.all}
            <ArrowUpRight size={17} />
          </A>
        </div>
        <p className="gallery-preview-note">{rt.externalPhotos}</p>
        <GalleryBrowser
          items={site.items}
          language={lang}
          compact
          onNavigate={navigate}
        />
      </Reveal>
      {block(
        t["school-life"],
        "/school-life",
        cards(
          site.items
            .filter((i) => i.kind === "news" && !i.featured && i.research)
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
            .slice(0, 3),
        ),
      )}
      {block(
        t.tv,
        "/tv",
        cards(site.items.filter((i) => i.kind === "video").slice(0, 2)),
      )}
      {block(
        t.resources,
        "/resources",
        cards(site.items.filter((i) => i.kind === "resource").slice(0, 3)),
      )}
      <Reveal className="anwal-campus-banner">
        <div>
          <p className="anwal-eyebrow">CAMPUS OS</p>
          <h2>{t.quick}</h2>
          <p>{t.quickIntro}</p>
        </div>
        <div>
          <a href="/student">
            <GraduationCap size={22} />
            {t.student}
            <ArrowUpRight size={17} />
          </a>
          <a href="/admin/login">
            <ShieldCheck size={22} />
            {t.admin}
            <ArrowUpRight size={17} />
          </a>
          <a href="/login">
            <Search size={22} />
            {t.lost}
            <ArrowUpRight size={17} />
          </a>
        </div>
      </Reveal>
      <section className="anwal-press">
        <p className="anwal-eyebrow">{t.press}</p>
        <a
          href="https://al3omk.com/1058413.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          العمق المغربي · 14/04/2025{" "}
          <span>ثانوية أنوال الإعدادية تحتفي بالتلاميذ المتفوقين (صور)</span>
          <ArrowUpRight size={18} />
        </a>
        <p>{t.rights}</p>
      </section>
    </>
  );
  return (
    <div className="anwal-site">
      <a className="workspace-skip-link" href="#public-main">
        {lang === "ar"
          ? "انتقل إلى المحتوى"
          : lang === "fr"
            ? "Aller au contenu"
            : "Skip to content"}
      </a>
      <div className="anwal-topbar">
        <div>
          <span>{site.settings.official ? "KHÉNIFRA · MAROC" : t.demo}</span>
          <div>
            <A to="/contact">{t.contact}</A>
            <select
              aria-label="Language / اللغة"
              value={lang}
              onChange={(e) =>
                updateSettings({ language: e.target.value as typeof lang })
              }
            >
              <option value="fr">FR</option>
              <option value="ar">العربية</option>
              <option value="en">EN</option>
            </select>
            <button
              aria-label={t.theme}
              onClick={() =>
                updateSettings({
                  theme: settings.theme === "dark" ? "light" : "dark",
                })
              }
            >
              {settings.theme === "dark" ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
      <header className="anwal-header">
        <div className="anwal-masthead">
          <A to="/" className="anwal-brand">
            <span className="anwal-monogram">
              A<span>ن</span>
            </span>
            <span>
              <strong>
                ANWAL<span>DIGITAL</span>
              </strong>
              <small>{tr(site.settings.title)} · Khénifra</small>
            </span>
          </A>
          <div className="anwal-masthead-end">
            <span className="anwal-motto">{tr(site.settings.slogan)}</span>
            <a href="/login" className="anwal-campus-link">
              {t.campus}
              <ArrowUpRight size={17} />
            </a>
            <button
              aria-label={t.menu}
              aria-expanded={menu}
              aria-controls="public-navigation"
              className="anwal-menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <nav
          id="public-navigation"
          className={"anwal-nav " + (menu ? "open" : "")}
          aria-label={t.menu}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setMenu(false);
              e.currentTarget
                .querySelectorAll("details[open]")
                .forEach((d) => d.removeAttribute("open"));
            }
          }}
        >
          <A to="/" className={section === "home" ? "active" : ""}>
            {t.home}
          </A>
          {site.settings.navigation.map((n) =>
            n === "media" ? (
              <details key={n}>
                <summary>
                  {t.media}
                  <ChevronDown size={12} />
                </summary>
                <div>
                  {[
                    "tv",
                    "radio",
                    "podcasts",
                    "gallery",
                    "events",
                    "science",
                    "sports",
                    "culture",
                    "environment",
                  ].map((s) => (
                    <A key={s} to={"/" + s}>
                      {t[s as keyof typeof t]}
                    </A>
                  ))}
                </div>
              </details>
            ) : (
              <A key={n} to={"/" + n} className={section === n ? "active" : ""}>
                {n === "achievements"
                  ? rt.achievements
                  : t[n as keyof typeof t]}
              </A>
            ),
          )}
        </nav>
      </header>
      <main id="public-main" tabIndex={-1} className="anwal-main">
        {section === "home" ? (
          home()
        ) : pieces[1] ? (
          detailView()
        ) : section === "media" ? (
          <>
            {heading(t.media, t.mediaIntro)}
            <div className="anwal-media-grid">
              {mediaLinks.map(({ to, name, desc, icon: Icon }) => (
                <A key={to} to={"/" + to} className="anwal-media-card">
                  <Icon />
                  <h2>{name}</h2>
                  <p>{desc}</p>
                  <ArrowUpRight />
                </A>
              ))}
            </div>
            {block(
              t.gallery,
              "/gallery",
              cards(site.items.filter((i) => i.kind === "album").slice(0, 3)),
            )}
          </>
        ) : section === "contact" ? (
          <>
            {heading(t.contact)}
            <div className="anwal-contact">
              <h2>{tr(site.settings.title)}</h2>
              <p>{tr(site.settings.address)}</p>
              {site.settings.email && (
                <a href={"mailto:" + site.settings.email}>
                  {t.email} · {site.settings.email}
                </a>
              )}
              {site.settings.phone && (
                <a href={"tel:" + site.settings.phone}>
                  {t.phone} · {site.settings.phone}
                </a>
              )}
              {!site.settings.email && !site.settings.phone && (
                <p>{t.contactEmpty}</p>
              )}
            </div>
          </>
        ) : (
          collection()
        )}
      </main>
      <footer className="anwal-footer">
        <div>
          <A to="/" className="footer-wordmark">
            ANWAL<span>DIGITAL</span>
          </A>
          <p>{tr(site.settings.slogan)}</p>
          <span>{tr(site.settings.address)}</span>
        </div>
        <div>
          <strong>{t.more}</strong>
          {["about", "news", "clubs", "events"].map((n) => (
            <A key={n} to={"/" + n}>
              {t[n as keyof typeof t]}
            </A>
          ))}
        </div>
        <div>
          <strong>ANWAL MEDIA</strong>
          {["journal", "tv", "radio", "gallery", "resources"].map((n) => (
            <A key={n} to={"/" + n}>
              {t[n as keyof typeof t]}
            </A>
          ))}
        </div>
        <div>
          <strong>CAMPUS OS</strong>
          <a href="/student">{t.student}</a>
          <a href="/admin/login">{t.admin}</a>
          <a href="/editor">{t.contribute}</a>
          <A to="/contact">{t.contact}</A>
          <A to="/achievements">{rt.achievements}</A>
          <A to="/sources">{rt.sources}</A>
        </div>
        <div className="anwal-footer-bottom">
          <span>© {new Date().getFullYear()} Anwal Digital · Campus OS</span>
          {!site.settings.official && <p>{t.demoFull}</p>}
        </div>
      </footer>
      <motion.button
        whileTap={{ scale: 0.96 }}
        className="anwal-ai-toggle"
        onClick={() => setChat(!chat)}
        aria-expanded={chat}
        aria-controls="public-chat"
      >
        <Sparkles size={19} />
        <span>Campus AI</span>
      </motion.button>
      <AnimatePresence>
        {chat && (
          <motion.aside
            id="public-chat"
            aria-label={t.aiTitle}
            className="anwal-chat"
            initial={{
              opacity: 0,
              scale: reducedMotion ? 1 : 0.96,
              y: reducedMotion ? 0 : 12,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: reducedMotion ? 1 : 0.96,
              y: reducedMotion ? 0 : 12,
            }}
            transition={reducedMotion ? { duration: 0.12 } : fluidSpring}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setChat(false);
                document
                  .querySelector<HTMLButtonElement>(".anwal-ai-toggle")
                  ?.focus();
              }
            }}
          >
            <div>
              <strong>{t.aiTitle}</strong>
              <button aria-label={t.close} onClick={() => setChat(false)}>
                <X size={18} />
              </button>
            </div>
            <p>{t.aiIntro}</p>
            <small>{t.aiNote}</small>
            {answer && (
              <p role="status" className="anwal-chat-answer">
                {answer}
              </p>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!prompt.trim() || asking) return;
                setAsking(true);
                try {
                  const r = await fetch("/api/public/assistant", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt, language: lang }),
                  });
                  const d = await r.json();
                  if (!r.ok) throw Error();
                  setAnswer(d.text);
                } catch {
                  setAnswer(t.aiError);
                } finally {
                  setAsking(false);
                }
              }}
            >
              <input
                autoFocus
                value={prompt}
                maxLength={1500}
                aria-label={t.aiPlaceholder}
                placeholder={t.aiPlaceholder}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button disabled={asking || !prompt.trim()}>
                {asking ? "…" : t.send}
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
      <dialog
        ref={viewer}
        aria-label={zoom ? tr(zoom.title) : t.gallery}
        className="anwal-lightbox"
        onClose={() => setZoom(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) viewer.current?.close();
        }}
      >
        {zoom && (
          <>
            <button
              aria-label={t.close}
              onClick={() => viewer.current?.close()}
            >
              <X />
            </button>
            <img src={zoom.cover} alt={tr(zoom.alt)} />
            <p>{tr(zoom.title)}</p>
            <small>{zoom.credit}</small>
          </>
        )}
      </dialog>
    </div>
  );
}
