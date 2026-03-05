import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

// Load .env from project root BEFORE importing db (which reads DATABASE_URL)
const __dirnameSeed = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirnameSeed, '..', '.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

// ---------------------------------------------------------------------------
// Deterministic UUID generation (UUID v5 using SHA-1, RFC 4122)
// ---------------------------------------------------------------------------
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function uuidv5(name: string, namespace: string): string {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(nsBytes).update(name).digest();
  // Set version 5
  hash[6] = (hash[6]! & 0x0f) | 0x50;
  // Set variant RFC 4122
  hash[8] = (hash[8]! & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function makeId(name: string): string {
  return uuidv5(name, NAMESPACE);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
const NOW = new Date('2026-03-04T12:00:00Z');

function weeksAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n * 7);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d;
}

function minutesAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

// Convenient references
const uid = (slug: string) => makeId(`user:${slug}`);
const sid = (slug: string) => makeId(`studio:${slug}`);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Dynamic import so env vars are set before db module reads DATABASE_URL
  const { db, schema } = await import('../server/src/db/index.js');

  log('Starting seed...');

  // -----------------------------------------------------------------------
  // 1. Clear all tables in reverse FK order
  // -----------------------------------------------------------------------
  log('Clearing existing data...');
  await db.delete(schema.sessionCheckoffs);
  await db.delete(schema.practiceSessions);
  await db.delete(schema.masteredItems);
  await db.delete(schema.performanceRecordings);
  await db.delete(schema.chartItems);
  await db.delete(schema.practiceCharts);
  await db.delete(schema.studioMemberships);
  await db.delete(schema.studios);
  await db.delete(schema.users);
  log('All tables cleared.');

  // -----------------------------------------------------------------------
  // 2. Create users
  // -----------------------------------------------------------------------
  log('Creating users...');
  const userRows = [
    { id: makeId('user:blank-alice'), email: 'blank-alice@test.local', displayName: 'Alice' },
    { id: makeId('user:blank-bob'), email: 'blank-bob@test.local', displayName: 'Bob' },
    { id: makeId('user:one-chart-carol'), email: 'one-chart-carol@test.local', displayName: 'Carol' },
    { id: makeId('user:active-dana'), email: 'active-dana@test.local', displayName: 'Dana' },
    { id: makeId('user:casual-eli'), email: 'casual-eli@test.local', displayName: 'Eli' },
    { id: makeId('user:parent-frank'), email: 'parent-frank@test.local', displayName: 'Frank' },
    { id: makeId('user:teacher-katie'), email: 'teacher-katie@test.local', displayName: 'Katie' },
    { id: makeId('user:shared-viewer-luna'), email: 'shared-viewer-luna@test.local', displayName: 'Luna' },
    { id: makeId('user:invited-pending-maya'), email: 'invited-pending-maya@test.local', displayName: 'Maya' },
    { id: makeId('user:stress-test-nick'), email: 'stress-test-nick@test.local', displayName: 'Nick' },
    { id: makeId('user:unicode-olivia'), email: 'unicode-olivia@test.local', displayName: '\u041E\u043B\u0438\u0432\u0438\u044F \uD83C\uDFB5' },
    { id: makeId('user:mid-session-pat'), email: 'mid-session-pat@test.local', displayName: 'Pat' },
    // Extra students for teacher-katie
    { id: makeId('user:student-iris'), email: 'student-iris@test.local', displayName: 'Iris' },
    { id: makeId('user:student-jack'), email: 'student-jack@test.local', displayName: 'Jack' },
    { id: makeId('user:student-kara'), email: 'student-kara@test.local', displayName: 'Kara' },
    // Children for parent-frank
    { id: makeId('user:child-gina'), email: 'child-gina@test.local', displayName: 'Gina' },
    { id: makeId('user:child-henry'), email: 'child-henry@test.local', displayName: 'Henry' },
  ];
  await db.insert(schema.users).values(userRows);
  log(`Created ${userRows.length} users.`);

  // -----------------------------------------------------------------------
  // 3. Create studios
  // -----------------------------------------------------------------------
  log('Creating studios...');
  const studioRows = [
    { id: sid('bob-piano'), name: 'Bob Piano', instrument: 'Piano', ownerId: uid('blank-bob'), createdAt: weeksAgo(8) },
    { id: sid('carol-piano'), name: 'Carol Piano', instrument: 'Piano', ownerId: uid('one-chart-carol'), createdAt: weeksAgo(4) },
    { id: sid('dana-piano'), name: 'Dana Piano', instrument: 'Piano', ownerId: uid('active-dana'), createdAt: weeksAgo(10) },
    { id: sid('eli-piano'), name: 'Eli Piano', instrument: 'Piano', ownerId: uid('casual-eli'), createdAt: weeksAgo(6) },
    { id: sid('gina-piano'), name: 'Gina Piano', instrument: 'Piano', ownerId: uid('parent-frank'), createdAt: weeksAgo(12) },
    { id: sid('henry-guitar'), name: 'Henry Guitar', instrument: 'Guitar', ownerId: uid('parent-frank'), createdAt: weeksAgo(10) },
    { id: sid('katie-demo'), name: 'Katie Demo', instrument: 'Piano', ownerId: uid('teacher-katie'), createdAt: weeksAgo(14) },
    { id: sid('iris-piano'), name: 'Iris Piano', instrument: 'Piano', ownerId: uid('student-iris'), createdAt: weeksAgo(8) },
    { id: sid('jack-piano'), name: 'Jack Piano', instrument: 'Piano', ownerId: uid('student-jack'), createdAt: weeksAgo(7) },
    { id: sid('kara-piano'), name: 'Kara Piano', instrument: 'Piano', ownerId: uid('student-kara'), createdAt: weeksAgo(6) },
    { id: sid('nick-piano'), name: 'Nick Piano', instrument: 'Piano', ownerId: uid('stress-test-nick'), createdAt: weeksAgo(30) },
    { id: sid('olivia-piano'), name: "\u041E\u043B\u0438\u0432\u0438\u044F's \u041F\u0438\u0430\u043D\u0438\u043D\u043E", instrument: 'Piano', ownerId: uid('unicode-olivia'), createdAt: weeksAgo(4) },
    { id: sid('pat-piano'), name: 'Pat Piano', instrument: 'Piano', ownerId: uid('mid-session-pat'), createdAt: weeksAgo(3) },
  ];
  await db.insert(schema.studios).values(studioRows);
  log(`Created ${studioRows.length} studios.`);

  // -----------------------------------------------------------------------
  // 4. Studio memberships
  // -----------------------------------------------------------------------
  log('Creating memberships...');
  const membershipRows = [
    // Owners
    { id: makeId('mem:bob-own'), studioId: sid('bob-piano'), userId: uid('blank-bob'), role: 'owner' as const, acceptedAt: weeksAgo(8), createdAt: weeksAgo(8) },
    { id: makeId('mem:carol-own'), studioId: sid('carol-piano'), userId: uid('one-chart-carol'), role: 'owner' as const, acceptedAt: weeksAgo(4), createdAt: weeksAgo(4) },
    { id: makeId('mem:dana-own'), studioId: sid('dana-piano'), userId: uid('active-dana'), role: 'owner' as const, acceptedAt: weeksAgo(10), createdAt: weeksAgo(10) },
    { id: makeId('mem:eli-own'), studioId: sid('eli-piano'), userId: uid('casual-eli'), role: 'owner' as const, acceptedAt: weeksAgo(6), createdAt: weeksAgo(6) },
    { id: makeId('mem:frank-gina'), studioId: sid('gina-piano'), userId: uid('parent-frank'), role: 'owner' as const, acceptedAt: weeksAgo(12), createdAt: weeksAgo(12) },
    { id: makeId('mem:frank-henry'), studioId: sid('henry-guitar'), userId: uid('parent-frank'), role: 'owner' as const, acceptedAt: weeksAgo(10), createdAt: weeksAgo(10) },
    { id: makeId('mem:katie-own'), studioId: sid('katie-demo'), userId: uid('teacher-katie'), role: 'owner' as const, acceptedAt: weeksAgo(14), createdAt: weeksAgo(14) },
    { id: makeId('mem:iris-own'), studioId: sid('iris-piano'), userId: uid('student-iris'), role: 'owner' as const, acceptedAt: weeksAgo(8), createdAt: weeksAgo(8) },
    { id: makeId('mem:jack-own'), studioId: sid('jack-piano'), userId: uid('student-jack'), role: 'owner' as const, acceptedAt: weeksAgo(7), createdAt: weeksAgo(7) },
    { id: makeId('mem:kara-own'), studioId: sid('kara-piano'), userId: uid('student-kara'), role: 'owner' as const, acceptedAt: weeksAgo(6), createdAt: weeksAgo(6) },
    { id: makeId('mem:nick-own'), studioId: sid('nick-piano'), userId: uid('stress-test-nick'), role: 'owner' as const, acceptedAt: weeksAgo(30), createdAt: weeksAgo(30) },
    { id: makeId('mem:olivia-own'), studioId: sid('olivia-piano'), userId: uid('unicode-olivia'), role: 'owner' as const, acceptedAt: weeksAgo(4), createdAt: weeksAgo(4) },
    { id: makeId('mem:pat-own'), studioId: sid('pat-piano'), userId: uid('mid-session-pat'), role: 'owner' as const, acceptedAt: weeksAgo(3), createdAt: weeksAgo(3) },

    // Teacher Katie as editor on 5 studios
    { id: makeId('mem:katie-gina'), studioId: sid('gina-piano'), userId: uid('teacher-katie'), role: 'editor' as const, invitedBy: uid('parent-frank'), acceptedAt: weeksAgo(11), createdAt: weeksAgo(11) },
    { id: makeId('mem:katie-dana'), studioId: sid('dana-piano'), userId: uid('teacher-katie'), role: 'editor' as const, invitedBy: uid('active-dana'), acceptedAt: weeksAgo(9), createdAt: weeksAgo(9) },
    { id: makeId('mem:katie-iris'), studioId: sid('iris-piano'), userId: uid('teacher-katie'), role: 'editor' as const, invitedBy: uid('student-iris'), acceptedAt: weeksAgo(7), createdAt: weeksAgo(7) },
    { id: makeId('mem:katie-jack'), studioId: sid('jack-piano'), userId: uid('teacher-katie'), role: 'editor' as const, invitedBy: uid('student-jack'), acceptedAt: weeksAgo(6), createdAt: weeksAgo(6) },
    { id: makeId('mem:katie-kara'), studioId: sid('kara-piano'), userId: uid('teacher-katie'), role: 'editor' as const, invitedBy: uid('student-kara'), acceptedAt: weeksAgo(5), createdAt: weeksAgo(5) },

    // Luna as viewer on Gina Piano
    { id: makeId('mem:luna-gina'), studioId: sid('gina-piano'), userId: uid('shared-viewer-luna'), role: 'viewer' as const, invitedBy: uid('parent-frank'), acceptedAt: weeksAgo(10), createdAt: weeksAgo(10) },

    // Maya -- pending invitation (no acceptedAt)
    { id: makeId('mem:maya-gina'), studioId: sid('gina-piano'), userId: uid('invited-pending-maya'), role: 'viewer' as const, invitedBy: uid('parent-frank'), acceptedAt: null, createdAt: weeksAgo(1) },

    // Children as viewers on their own studios
    { id: makeId('mem:gina-viewer'), studioId: sid('gina-piano'), userId: uid('child-gina'), role: 'viewer' as const, invitedBy: uid('parent-frank'), acceptedAt: weeksAgo(12), createdAt: weeksAgo(12) },
    { id: makeId('mem:henry-viewer'), studioId: sid('henry-guitar'), userId: uid('child-henry'), role: 'viewer' as const, invitedBy: uid('parent-frank'), acceptedAt: weeksAgo(10), createdAt: weeksAgo(10) },
  ];
  await db.insert(schema.studioMemberships).values(membershipRows);
  log(`Created ${membershipRows.length} memberships.`);

  // -----------------------------------------------------------------------
  // 5. Practice charts & chart items
  // -----------------------------------------------------------------------
  log('Creating charts and items...');

  type ChartCategory = 'scales' | 'arpeggios' | 'cadences' | 'repertoire' | 'sight_reading' | 'theory' | 'other';

  const allCharts: Array<{
    id: string; studioId: string; title: string; createdBy: string;
    minimumPracticeMinutes: number; createdAt: Date; updatedAt: Date;
  }> = [];
  const allItems: Array<{
    id: string; chartId: string; category: ChartCategory;
    sortOrder: number; config: unknown; repetitions: number;
  }> = [];

  type ItemDef = { key: string; category: ChartCategory; config: unknown; repetitions: number };

  function addChart(
    key: string, studioSlug: string, title: string, createdBySlug: string,
    mins: number, createdAt: Date, items: ItemDef[],
  ) {
    const chartId = makeId(`chart:${key}`);
    allCharts.push({
      id: chartId, studioId: sid(studioSlug), title, createdBy: uid(createdBySlug),
      minimumPracticeMinutes: mins, createdAt, updatedAt: createdAt,
    });
    items.forEach((item, i) => {
      allItems.push({
        id: makeId(`item:${item.key}`),
        chartId, category: item.category, sortOrder: i,
        config: item.config, repetitions: item.repetitions,
      });
    });
    return chartId;
  }

  // ----- Carol: 1 chart, 3 items -----
  addChart('carol-1', 'carol-piano', 'Week 1', 'one-chart-carol', 20, weeksAgo(1), [
    { key: 'carol-scale-c', category: 'scales', config: { name: 'C Major', octaves: 2, motion: 'HT' }, repetitions: 3 },
    { key: 'carol-rep-minuet', category: 'repertoire', config: { title: 'Minuet in G Major', composer: 'Petzold/Bach', sections: ['A section', 'B section'] }, repetitions: 3 },
    { key: 'carol-theory', category: 'theory', config: { description: 'Complete exercises 1-4 in Theory Book Level 2' }, repetitions: 1 },
  ]);

  // ----- Dana: 6 charts spanning 6 weeks, current chart has all 7 categories -----
  const danaChartKeys = ['dana-1', 'dana-2', 'dana-3', 'dana-4', 'dana-5', 'dana-6'];
  const danaScales = [
    { name: 'C Major', octaves: 2, motion: 'HT' },
    { name: 'G Major', octaves: 2, motion: 'HT' },
    { name: 'F Major', octaves: 2, motion: 'HS' },
    { name: 'D Major', octaves: 2, motion: 'HT' },
    { name: 'Bb Major', octaves: 2, motion: 'HT' },
    { name: 'Eb Major', octaves: 4, motion: 'HT' },
  ];
  const danaRepertoire = [
    { title: 'Sonatina in C Major, Op. 36 No. 1', composer: 'Clementi', sections: ['Exposition', 'Development', 'Recapitulation'] },
    { title: 'F\u00FCr Elise', composer: 'Beethoven', sections: ['A section', 'B section', 'C section'] },
    { title: 'Prelude in C Major, BWV 846', composer: 'Bach', sections: ['mm. 1-19', 'mm. 20-35'] },
    { title: 'Waltz in A minor, B. 150', composer: 'Chopin', sections: ['A section', 'B section'] },
    { title: 'Gymnopedie No. 1', composer: 'Satie', sections: ['A section', 'B section'] },
    { title: 'Doctor Gradus ad Parnassum', composer: 'Debussy', sections: ['mm. 1-20', 'mm. 21-46', 'mm. 47-end'] },
  ];

  for (let i = 0; i < 6; i++) {
    const items: ItemDef[] = [
      { key: `dana-${i}-scale`, category: 'scales', config: danaScales[i], repetitions: 3 },
      { key: `dana-${i}-rep`, category: 'repertoire', config: danaRepertoire[i], repetitions: 3 },
    ];
    if (i === 5) {
      // Current chart: all 7 categories
      items.push(
        { key: `dana-${i}-arp`, category: 'arpeggios', config: { name: 'Eb Major', octaves: 2 }, repetitions: 3 },
        { key: `dana-${i}-cad`, category: 'cadences', config: { progression: 'I-IV-V7-I', key: 'Eb Major' }, repetitions: 2 },
        { key: `dana-${i}-sr`, category: 'sight_reading', config: { grade: 3, minutes: 5 }, repetitions: 1 },
        { key: `dana-${i}-theory`, category: 'theory', config: { description: 'Complete exercises 5-10 in Level 3 Theory Book' }, repetitions: 1 },
        { key: `dana-${i}-other`, category: 'other', config: { description: 'Transpose Minuet in G to D Major' }, repetitions: 1 },
      );
    }
    addChart(danaChartKeys[i], 'dana-piano', `Week ${i + 1}`, 'active-dana', i === 5 ? 30 : 20, weeksAgo(6 - i), items);
  }

  // ----- Eli: 3 charts -----
  addChart('eli-1', 'eli-piano', 'Week 1', 'casual-eli', 15, weeksAgo(4), [
    { key: 'eli-1-scale', category: 'scales', config: { name: 'C Major', octaves: 1, motion: 'HT' }, repetitions: 2 },
    { key: 'eli-1-rep', category: 'repertoire', config: { title: 'Twinkle Twinkle Little Star', composer: 'Traditional', sections: ['Full piece'] }, repetitions: 3 },
  ]);
  addChart('eli-2', 'eli-piano', 'Week 2', 'casual-eli', 15, weeksAgo(3), [
    { key: 'eli-2-scale', category: 'scales', config: { name: 'G Major', octaves: 1, motion: 'HT' }, repetitions: 2 },
    { key: 'eli-2-rep', category: 'repertoire', config: { title: 'Ode to Joy', composer: 'Beethoven', sections: ['Full piece'] }, repetitions: 3 },
  ]);
  addChart('eli-3', 'eli-piano', 'Week 3', 'casual-eli', 15, weeksAgo(2), [
    { key: 'eli-3-scale', category: 'scales', config: { name: 'F Major', octaves: 1, motion: 'HT' }, repetitions: 2 },
    { key: 'eli-3-rep', category: 'repertoire', config: { title: 'Musette in D Major', composer: 'Bach (attr.)', sections: ['Full piece'] }, repetitions: 3 },
  ]);

  // ----- Frank / Gina Piano: 4 charts -----
  const ginaRepertoire = [
    { title: 'Minuet in G Major', composer: 'Petzold/Bach', sections: ['A section', 'B section'] },
    { title: 'Sonatina in G Major, Op. 36 No. 2', composer: 'Clementi', sections: ['Exposition', 'Development'] },
    { title: 'Invention No. 1 in C Major, BWV 772', composer: 'Bach', sections: ['mm. 1-7', 'mm. 7-14', 'mm. 14-22'] },
    { title: 'Rondo Alla Turca', composer: 'Mozart', sections: ['A section', 'B section', 'Coda'] },
  ];
  for (let i = 0; i < 4; i++) {
    addChart(`gina-${i}`, 'gina-piano', `Week ${i + 1}`, 'parent-frank', 20, weeksAgo(8 - i * 2), [
      { key: `gina-${i}-scale`, category: 'scales', config: { name: ['C Major', 'G Major', 'D Major', 'A minor'][i], octaves: 2, motion: 'HT' }, repetitions: 3 },
      { key: `gina-${i}-rep`, category: 'repertoire', config: ginaRepertoire[i], repetitions: 3 },
      { key: `gina-${i}-theory`, category: 'theory', config: { description: `Complete exercises ${i * 4 + 1}-${i * 4 + 4} in Theory Book Level 1` }, repetitions: 1 },
    ]);
  }

  // ----- Frank / Henry Guitar: 4 charts -----
  const henryRepertoire = [
    { title: 'Romance (Jeux Interdits)', composer: 'Traditional/Yepes', sections: ['A section', 'B section'] },
    { title: 'Lagrima', composer: 'Tarrega', sections: ['A section', 'B section'] },
    { title: 'Adelita', composer: 'Tarrega', sections: ['Full piece'] },
    { title: 'Recuerdos de la Alhambra', composer: 'Tarrega', sections: ['A section', 'B section'] },
  ];
  for (let i = 0; i < 4; i++) {
    addChart(`henry-${i}`, 'henry-guitar', `Week ${i + 1}`, 'parent-frank', 20, weeksAgo(8 - i * 2), [
      { key: `henry-${i}-scale`, category: 'scales', config: { name: ['E minor pentatonic', 'A minor pentatonic', 'C Major', 'G Major'][i], octaves: 2, motion: 'Alternating i-m' }, repetitions: 3 },
      { key: `henry-${i}-rep`, category: 'repertoire', config: henryRepertoire[i], repetitions: 3 },
      { key: `henry-${i}-arp`, category: 'arpeggios', config: { name: ['A minor', 'E minor', 'C Major', 'G Major'][i], pattern: 'p-i-m-a' }, repetitions: 2 },
    ]);
  }

  // ----- Katie Demo: 1 chart -----
  addChart('katie-demo-1', 'katie-demo', 'Demo Chart', 'teacher-katie', 20, weeksAgo(2), [
    { key: 'katie-d-scale', category: 'scales', config: { name: 'C Major', octaves: 4, motion: 'HT' }, repetitions: 3 },
    { key: 'katie-d-rep', category: 'repertoire', config: { title: 'Clair de Lune', composer: 'Debussy', sections: ['mm. 1-26', 'mm. 27-50', 'mm. 51-72'] }, repetitions: 2 },
    { key: 'katie-d-sr', category: 'sight_reading', config: { grade: 4, minutes: 5 }, repetitions: 1 },
  ]);

  // ----- Nick: 20 charts -----
  const nickScalePool = [
    'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major',
    'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'A minor', 'D minor',
    'E minor', 'G minor', 'C minor', 'F minor', 'F# minor', 'C# minor',
    'B minor', 'Bb minor',
  ];
  for (let i = 0; i < 20; i++) {
    addChart(`nick-${i}`, 'nick-piano', `Week ${i + 1}`, 'stress-test-nick', 20, weeksAgo(20 - i), [
      { key: `nick-${i}-scale`, category: 'scales', config: { name: nickScalePool[i], octaves: 2, motion: 'HT' }, repetitions: 3 },
      { key: `nick-${i}-rep`, category: 'repertoire', config: { title: `Etude Op. 10 No. ${(i % 12) + 1}`, composer: 'Chopin', sections: ['Full piece'] }, repetitions: 3 },
      { key: `nick-${i}-arp`, category: 'arpeggios', config: { name: nickScalePool[i], octaves: 2 }, repetitions: 2 },
    ]);
  }

  // ----- Olivia: 1 chart -----
  addChart('olivia-1', 'olivia-piano', '\u041D\u0435\u0434\u0435\u043B\u044F 1', 'unicode-olivia', 20, weeksAgo(1), [
    { key: 'olivia-scale', category: 'scales', config: { name: 'A minor', octaves: 2, motion: 'HT' }, repetitions: 3 },
    { key: 'olivia-rep', category: 'repertoire', config: { title: 'Prelude in C# minor, Op. 3 No. 2', composer: 'Rachmaninoff', sections: ['A section', 'B section'] }, repetitions: 3 },
  ]);

  // ----- Pat: 1 chart with 4 items x 3 reps = 12 checkboxes -----
  addChart('pat-1', 'pat-piano', 'Week 1', 'mid-session-pat', 25, weeksAgo(1), [
    { key: 'pat-scale-c', category: 'scales', config: { name: 'C Major', octaves: 2, motion: 'HT' }, repetitions: 3 },
    { key: 'pat-scale-g', category: 'scales', config: { name: 'G Major', octaves: 2, motion: 'HT' }, repetitions: 3 },
    { key: 'pat-rep', category: 'repertoire', config: { title: 'Minuet in G Major', composer: 'Petzold/Bach', sections: ['A section', 'B section'] }, repetitions: 3 },
    { key: 'pat-arp', category: 'arpeggios', config: { name: 'C Major', octaves: 2 }, repetitions: 3 },
  ]);

  // ----- Iris, Jack, Kara: 1 chart each (created by Katie) -----
  addChart('iris-1', 'iris-piano', 'Week 1', 'teacher-katie', 20, weeksAgo(2), [
    { key: 'iris-scale', category: 'scales', config: { name: 'D Major', octaves: 2, motion: 'HT' }, repetitions: 3 },
    { key: 'iris-rep', category: 'repertoire', config: { title: 'Sonatina in F Major, Op. 36 No. 4', composer: 'Clementi', sections: ['Exposition', 'Development'] }, repetitions: 3 },
  ]);
  addChart('jack-1', 'jack-piano', 'Week 1', 'teacher-katie', 20, weeksAgo(2), [
    { key: 'jack-scale', category: 'scales', config: { name: 'A Major', octaves: 2, motion: 'HT' }, repetitions: 3 },
    { key: 'jack-rep', category: 'repertoire', config: { title: 'Invention No. 8 in F Major, BWV 779', composer: 'Bach', sections: ['mm. 1-17', 'mm. 17-34'] }, repetitions: 3 },
  ]);
  addChart('kara-1', 'kara-piano', 'Week 1', 'teacher-katie', 20, weeksAgo(2), [
    { key: 'kara-scale', category: 'scales', config: { name: 'Bb Major', octaves: 2, motion: 'HT' }, repetitions: 3 },
    { key: 'kara-rep', category: 'repertoire', config: { title: 'Arabesque No. 1', composer: 'Debussy', sections: ['A section', 'B section', "A' section"] }, repetitions: 3 },
  ]);

  await db.insert(schema.practiceCharts).values(allCharts);
  log(`Created ${allCharts.length} charts.`);
  await db.insert(schema.chartItems).values(allItems);
  log(`Created ${allItems.length} chart items.`);

  // -----------------------------------------------------------------------
  // 6. Practice sessions & checkoffs
  // -----------------------------------------------------------------------
  log('Creating sessions and checkoffs...');

  const allSessions: Array<{
    id: string; chartId: string; userId: string; startedAt: Date;
    completedAt: Date | null; durationSeconds: number | null; timerTargetSeconds: number;
  }> = [];
  const allCheckoffs: Array<{
    id: string; sessionId: string; chartItemId: string; repetitionNumber: number; checkedAt: Date;
  }> = [];

  /** Get item reps for a chart key */
  function getItemReps(chartKey: string): Array<{ id: string; reps: number }> {
    const chartId = makeId(`chart:${chartKey}`);
    return allItems.filter(it => it.chartId === chartId).map(it => ({ id: it.id, reps: it.repetitions }));
  }

  /** Create a completed session with checkoffs for all items */
  function addCompletedSession(
    key: string, chartKey: string, userSlug: string,
    startedAt: Date, durationMin: number,
  ) {
    const sessionId = makeId(`session:${key}`);
    const dur = durationMin * 60;
    const completedAt = new Date(startedAt.getTime() + dur * 1000);
    allSessions.push({
      id: sessionId,
      chartId: makeId(`chart:${chartKey}`),
      userId: uid(userSlug),
      startedAt,
      completedAt,
      durationSeconds: dur,
      timerTargetSeconds: dur,
    });

    const items = getItemReps(chartKey);
    let checkIdx = 0;
    for (const item of items) {
      for (let r = 1; r <= item.reps; r++) {
        allCheckoffs.push({
          id: makeId(`checkoff:${key}-${checkIdx}`),
          sessionId,
          chartItemId: item.id,
          repetitionNumber: r,
          checkedAt: new Date(startedAt.getTime() + (checkIdx + 1) * 60000),
        });
        checkIdx++;
      }
    }
  }

  /** Create an abandoned session (started but not completed, 1 checkoff) */
  function addAbandonedSession(key: string, chartKey: string, userSlug: string, startedAt: Date) {
    const sessionId = makeId(`session:${key}`);
    allSessions.push({
      id: sessionId,
      chartId: makeId(`chart:${chartKey}`),
      userId: uid(userSlug),
      startedAt,
      completedAt: null,
      durationSeconds: null,
      timerTargetSeconds: 20 * 60,
    });
    const items = getItemReps(chartKey);
    if (items.length > 0) {
      allCheckoffs.push({
        id: makeId(`checkoff:${key}-0`),
        sessionId,
        chartItemId: items[0].id,
        repetitionNumber: 1,
        checkedAt: new Date(startedAt.getTime() + 60000),
      });
    }
  }

  // ----- Dana: 15 completed + 3 abandoned across her 6 charts -----
  for (let c = 0; c < 6; c++) {
    const chartKey = danaChartKeys[c];
    const weekStart = weeksAgo(6 - c);
    const sessionsPerChart = c < 3 ? 2 : 3;
    for (let s = 0; s < sessionsPerChart; s++) {
      const durMin = 18 + ((c * 3 + s) % 28); // 18-45 min range
      const start = new Date(weekStart.getTime() + (s + 1) * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000);
      addCompletedSession(`dana-c${c}-s${s}`, chartKey, 'active-dana', start, durMin);
    }
  }
  addAbandonedSession('dana-abandoned-0', 'dana-2', 'active-dana', new Date(weeksAgo(4).getTime() + 10 * 60 * 60 * 1000));
  addAbandonedSession('dana-abandoned-1', 'dana-4', 'active-dana', new Date(weeksAgo(2).getTime() + 9 * 60 * 60 * 1000));
  addAbandonedSession('dana-abandoned-2', 'dana-5', 'active-dana', new Date(weeksAgo(1).getTime() + 11 * 60 * 60 * 1000));

  // ----- Eli: 4 completed sessions (short ~15 min) -----
  for (let s = 0; s < 4; s++) {
    const chartKey = `eli-${Math.min(s + 1, 3)}`;
    const start = new Date(weeksAgo(4 - s).getTime() + 17 * 60 * 60 * 1000);
    addCompletedSession(`eli-s${s}`, chartKey, 'casual-eli', start, 15);
  }

  // ----- Gina Piano: 10 sessions -----
  for (let s = 0; s < 10; s++) {
    const chartKey = `gina-${Math.min(s % 4, 3)}`;
    const start = new Date(weeksAgo(8 - s).getTime() + 16 * 60 * 60 * 1000);
    addCompletedSession(`gina-s${s}`, chartKey, 'child-gina', start, 20 + (s % 10));
  }

  // ----- Henry Guitar: 9 sessions -----
  for (let s = 0; s < 9; s++) {
    const chartKey = `henry-${Math.min(s % 4, 3)}`;
    const start = new Date(weeksAgo(8 - s).getTime() + 17 * 60 * 60 * 1000);
    addCompletedSession(`henry-s${s}`, chartKey, 'child-henry', start, 20 + (s % 8));
  }

  // ----- Nick: 100 sessions across 20 charts -----
  for (let s = 0; s < 100; s++) {
    const chartKey = `nick-${s % 20}`;
    const start = new Date(weeksAgo(20).getTime() + s * 1.5 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000);
    addCompletedSession(`nick-s${s}`, chartKey, 'stress-test-nick', start, 20 + (s % 15));
  }

  // ----- Pat: 1 in-progress session with 7 of 12 checkboxes -----
  const patSessionId = makeId('session:pat-inprog');
  const patStarted = minutesAgo(18);
  allSessions.push({
    id: patSessionId,
    chartId: makeId('chart:pat-1'),
    userId: uid('mid-session-pat'),
    startedAt: patStarted,
    completedAt: null,
    durationSeconds: null,
    timerTargetSeconds: 25 * 60,
  });
  const patItems = getItemReps('pat-1');
  let patCheckIdx = 0;
  let patChecked = 0;
  for (const item of patItems) {
    for (let r = 1; r <= item.reps; r++) {
      if (patChecked < 7) {
        allCheckoffs.push({
          id: makeId(`checkoff:pat-inprog-${patCheckIdx}`),
          sessionId: patSessionId,
          chartItemId: item.id,
          repetitionNumber: r,
          checkedAt: new Date(patStarted.getTime() + (patCheckIdx + 1) * 90000),
        });
        patChecked++;
      }
      patCheckIdx++;
    }
  }

  // Insert sessions in chunks
  const CHUNK = 200;
  for (let i = 0; i < allSessions.length; i += CHUNK) {
    await db.insert(schema.practiceSessions).values(allSessions.slice(i, i + CHUNK));
  }
  log(`Created ${allSessions.length} sessions.`);

  for (let i = 0; i < allCheckoffs.length; i += CHUNK) {
    await db.insert(schema.sessionCheckoffs).values(allCheckoffs.slice(i, i + CHUNK));
  }
  log(`Created ${allCheckoffs.length} checkoffs.`);

  // -----------------------------------------------------------------------
  // 7. Mastered items (Dana: 4)
  // -----------------------------------------------------------------------
  log('Creating mastered items...');
  const masteredRows = [
    { id: makeId('mastered:dana-0'), studioId: sid('dana-piano'), category: 'scales' as const, description: 'C Major, 2 octaves, HT', masteredAt: daysAgo(30).toISOString().slice(0, 10) },
    { id: makeId('mastered:dana-1'), studioId: sid('dana-piano'), category: 'scales' as const, description: 'G Major, 2 octaves, HT', masteredAt: daysAgo(23).toISOString().slice(0, 10) },
    { id: makeId('mastered:dana-2'), studioId: sid('dana-piano'), category: 'repertoire' as const, description: 'Sonatina in C Major, Op. 36 No. 1 - Clementi', masteredAt: daysAgo(16).toISOString().slice(0, 10) },
    { id: makeId('mastered:dana-3'), studioId: sid('dana-piano'), category: 'arpeggios' as const, description: 'C Major, 2 octaves', masteredAt: daysAgo(9).toISOString().slice(0, 10) },
  ];
  await db.insert(schema.masteredItems).values(masteredRows);
  log(`Created ${masteredRows.length} mastered items.`);

  // -----------------------------------------------------------------------
  // Done
  // -----------------------------------------------------------------------
  log('Seed complete!');
  log(`Summary: ${userRows.length} users, ${studioRows.length} studios, ${membershipRows.length} memberships, ${allCharts.length} charts, ${allItems.length} items, ${allSessions.length} sessions, ${allCheckoffs.length} checkoffs, ${masteredRows.length} mastered items`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
