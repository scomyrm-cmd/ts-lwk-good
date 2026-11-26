import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createResearchItems,
  migrateResearchCms,
} from "../src/content/researchSeed";
import { emptyCms, text3 } from "../src/types/cms";
import inventory from "../public/research/source-inventory.json";

test("the complete dossier retains every media reference and a safe publication decision", () => {
  assert.equal(inventory.sources.length, 33);
  assert.equal(inventory.images.length, 63);
  assert.equal(inventory.videos.length, 11);
  const ids = [
    ...inventory.sources,
    ...inventory.images,
    ...inventory.videos,
  ].map((i) => i.id);
  assert.equal(new Set(ids).size, 107);
  assert.equal(inventory.images.filter((i) => i.visuallyReviewed).length, 33);
  assert.equal(inventory.images.filter((i) => i.scope === "shared").length, 11);
  for (const image of inventory.images) {
    assert.equal(image.reusePermission, "not-established");
    assert.equal(image.disposition, "linked-original-gallery");
    assert.ok(inventory.sources.some((s) => s.id === image.sourceId));
    assert.match(image.url, /^https:\/\//);
    assert.ok(image.title.fr && image.title.ar && image.title.en);
  }
  assert.equal(
    inventory.videos.filter((v) => v.disposition === "embedded-on-interaction")
      .length,
    2,
  );
  assert.equal(
    inventory.videos.find((v) => v.id === "V10")!.disposition,
    "inventory-only",
  );
  assert.equal(inventory.videos.find((v) => v.id === "V11")!.status, "ERROR");
  const items = createResearchItems();
  assert.equal(items.length, 45);
  assert.equal(items.filter((i) => i.kind === "achievement").length, 12);
  assert.equal(items.filter((i) => i.kind === "news").length, 14);
  assert.equal(items.filter((i) => i.kind === "announcement").length, 1);
  assert.equal(items.filter((i) => i.kind === "album").length, 15);
  for (const item of items) {
    assert.equal(item.cover, "");
    assert.ok(item.title.fr && item.title.ar && item.title.en);
    for (const id of item.research!.relatedIds)
      assert.ok(
        items.some((i) => i.id === id),
        `Missing relation ${id}`,
      );
  }
});

test("event uncertainty and competition outcomes survive compilation without invented dates", () => {
  const items = createResearchItems();
  const find = (slug: string) => items.find((i) => i.slug === slug)!;
  assert.equal(
    find("atelier-journalisme-date-a-confirmer").research!.eventDate,
    "",
  );
  assert.equal(
    find("atelier-journalisme-date-a-confirmer").research!.datePrecision,
    "disputed",
  );
  assert.equal(find("prix-excellence-2026").research!.eventDate, "");
  assert.equal(find("cross-equipe-national-2019").research!.year, 2019);
  assert.match(find("cross-equipe-national-2019").publishedAt, /^2020-01-04/);
  assert.equal(
    find("cross-equipe-national-2019").research!.outcome,
    "champion",
  );
  assert.equal(find("cross-maghreb-2017").research!.outcome, "participation");
  assert.equal(find("volleyball-u15-2026").research!.outcome, "runner-up");
  assert.equal(
    find("lecture-qualification-2020").research!.outcome,
    "qualification",
  );
  assert.equal(find("reconnaissance-riada-2026").research!.eventDate, "");
  assert.equal(
    find("reconnaissance-riada-2026").research!.datePrecision,
    "document-year",
  );
  assert.equal(find("biorender-annonce-2026").kind, "announcement");
  assert.equal(find("biorender-annonce-2026").startsAt, "");
});

test("the research migration is idempotent and preserves custom content, uploads, permissions and editorial decisions", () => {
  const db = emptyCms();
  const custom = {
    ...createResearchItems()[0],
    id: "custom-school-article",
    slug: "custom-school-article",
    research: undefined,
    title: text3("À conserver"),
    cover: "/api/public/media?id=00000000-0000-0000-0000-000000000000",
  };
  db.items = [custom];
  db.roles = { "retained-editor": "editor" };
  db.media = [
    {
      id: "retained-asset",
      path: "private/path",
      type: "image/webp",
      name: "Original school upload",
      ownerId: "retained-editor",
      consent: true,
      createdAt: "2026-01-01",
    },
  ];
  db.settings.heroImage = custom.cover;
  const originalSettings = structuredClone(db.settings);
  const originalMedia = structuredClone(db.media);
  assert.equal(migrateResearchCms(db), true);
  assert.equal(db.items.length, 46);
  assert.deepEqual(
    db.items.find((i) => i.id === custom.id),
    custom,
  );
  assert.equal(db.settings.heroImage, originalSettings.heroImage);
  assert.deepEqual(db.media, originalMedia);
  assert.equal(db.roles["retained-editor"], "editor");
  const archived = db.items.find((i) => i.research)!;
  archived.status = "archived";
  archived.title = text3("Titre modifié par la direction");
  const version = db.version;
  assert.equal(migrateResearchCms(db), false);
  assert.equal(db.version, version);
  assert.equal(archived.status, "archived");
  assert.equal(db.items.length, 46);
  const legacy = emptyCms();
  legacy.settings.heroImage = "/images/anwal-facade.webp";
  legacy.items = [{ ...custom, id: "anwal-architecture-press-2022" }];
  migrateResearchCms(legacy);
  assert.equal(legacy.settings.heroImage, "");
  assert.equal(
    legacy.items.some((i) => i.id === "anwal-architecture-press-2022"),
    false,
  );
});
