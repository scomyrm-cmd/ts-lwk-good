import type { Language, Student } from '../types';

export const MOROCCAN_LEVELS = [
  ...Array.from({ length: 6 }, (_, i) => ({ code: `${i + 1}AP`, fr: `${i + 1}e primaire`, en: `Primary year ${i + 1}`, ar: `${i + 1} ابتدائي` })),
  ...Array.from({ length: 3 }, (_, i) => ({ code: `${i + 1}AC`, fr: `${i + 1}e année collège`, en: `Collège year ${i + 1}`, ar: `${i + 1} إعدادي` })),
  { code: 'TC', fr: 'Tronc commun', en: 'Tronc commun', ar: 'الجذع المشترك' },
  { code: '1BAC', fr: '1re année bac', en: 'Baccalaureate year 1', ar: 'الأولى بكالوريا' },
  { code: '2BAC', fr: '2e année bac', en: 'Baccalaureate year 2', ar: 'الثانية بكالوريا' },
];
export const DEFAULT_CLASS_GROUPS = MOROCCAN_LEVELS.flatMap(({ code }) =>
  Array.from({ length: /^[123]AC$/.test(code) ? 4 : 1 }, (_, i) => `${code}-${i + 1}`));

export function latinDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0)));
}

export function classLabel(value: string, language: Language) {
  const match = /^(\dAP|[123]AC|TC|[12]BAC)(?:-(.+))?-(\d+)$/.exec(value);
  const level = MOROCCAN_LEVELS.find(item => item.code === match?.[1]);
  return level && match ? `${level[language]} · ${match[2] ? match[2] + ' · ' : ''}${match[3]}` : value;
}

export function sortClasses(a: string, b: string) {
  const level = (value: string) => MOROCCAN_LEVELS.findIndex(item => value.startsWith(item.code + '-'));
  const first = level(a), second = level(b);
  return (first < 0 ? 99 : first) - (second < 0 ? 99 : second) || a.localeCompare(b, 'fr', { numeric: true });
}

export function availableClasses(students: Student[], configured?: string[]) {
  return [...new Set([...(configured ?? DEFAULT_CLASS_GROUPS), ...students.map(student => student.className)])].sort(sortClasses);
}

export const MOROCCAN_DOCUMENT_GUIDE = `Moroccan levels: 1AP through 6AP = primary years 1–6; 1AC, 2AC, 3AC = collège / الأولى، الثانية، الثالثة إعدادي; TC = tronc commun / الجذع المشترك; 1BAC and 2BAC = الأولى والثانية بكالوريا. Canonical class format is LEVEL-SECTION, for example 2AC-3. If a lycée branch is explicitly printed, preserve it: TC-Sciences-2, 1BAC-Sciences expérimentales-1, 2BAC-Sciences physiques-3. Never infer an ambiguous grade or missing section. Never convert a numeric class such as 2/3 without an explicit cycle or administrator-provided class. Preserve names in their original Arabic/French script. Massar is a school-wide identifier; numéro d'ordre / الرقم الترتيبي is ONLY a roll number within the class. Convert Arabic digits to Western digits, preserving leading zeros in identifiers.`;
