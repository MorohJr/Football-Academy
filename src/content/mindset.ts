// MINDSET.pdf (SPEC 9).
import type { VideoLink } from './types';

const V = (label: string, id: string): VideoLink => ({ label, url: `https://vimeo.com/${id}` });

export interface Lesson {
  id: string;
  title: string;
  video: VideoLink;
}
export interface MindsetPart {
  id: string;
  title: string;
  he: string;
  lessons: Lesson[];
}

const L = (id: string, title: string, vid: string): Lesson => ({ id, title, video: V(title, vid) });
/** Lessons with no link in the PDF get a YouTube link (SPEC 12.4). */
const YT = (id: string, title: string, yt: string): Lesson => ({ id, title, video: { label: title, url: `https://www.youtube.com/watch?v=${yt}`, external: true } });

export const MINDSET_PARTS: MindsetPart[] = [
  {
    id: 'goals', title: 'Goal Setting & Perfectionism', he: 'הצבת מטרות ופרפקציוניזם',
    lessons: [
      L('avoid-uncontrollable', 'Avoid Uncontrollable Goals', '309155876/aebd0f4984'),
      L('filling-bars', 'Filling Up Your Bars To Feel Prepared', '309156239/c9836cf86d'),
      L('profiling', 'Profiling The Next Level', '309271755/5b29122b9f'),
      L('role-models', 'Remodelling Your Role Models', '309157141/a5250e47c3'),
      L('reverse-engineering', 'Reverse Engineering Your Success', '309099740/91aec0ccfc'),
    ],
  },
  {
    id: 'nerves', title: 'Nerves, Anxiety & Motivation', he: 'לחץ, חרדה ומוטיבציה',
    lessons: [
      L('controlling-nerves', 'Controlling Nerves Before A Match', '309099420/c40a6a03af'),
      L('setbacks', 'Discover The Set Backs Of Top Players', '309156150/364a7c4693'),
      L('why', 'Finding Your "Why"', '309156328/9b14dcec22'),
      L('intention', 'How To Train With Intention', '309157270/f01ce68053'),
      L('watching', 'Imagine People Are Watching', '309156541/8b196037e3'),
      L('crespo', 'Interview With Crespo Kamara', '203091807/f7767edf73'),
      L('music', 'Using Music To Control Nerves', '309157376/3ea6ab3d1a'),
      L('why-nervous', 'Why Do You Feel Nervous?', '309157420/db825e5601'),
    ],
  },
  {
    // The PDF titles this page "Concentration, Focus & Inconsistency" but the lessons are about confidence.
    id: 'confidence', title: 'Confidence & Mental Toughness', he: 'ביטחון וחוסן מנטלי',
    lessons: [
      L('confidence-look', 'What Does Confidence Look Like?', '309100770/ccc8d321f1'),
      L('positive-past', 'Triggering Positive Feeling From The Past', '309157335/e11f3454a1'),
      L('confidence-injury', 'How To Increase Confidence When Returning From Injury', '309156037/ba9964c69f'),
    ],
  },
  {
    id: 'focus', title: 'Concentration, Focus & Inconsistency', he: 'ריכוז, פוקוס וחוסר עקביות',
    lessons: [
      YT('wrong-thing', 'Being Focused, But On The Wrong Thing', 'TeIsliPr18E'),
      YT('next-thing', 'Only The Next Thing', '_di4z7oga7Y'),
    ],
  },
  {
    id: 'visualisation', title: 'Visualisation, Mental Imagery & Relaxation', he: 'דמיון מודרך והרפיה',
    lessons: [
      L('power-visualisation', 'The Power Of Visualisation', '347502554/db8a30d9ab'),
      L('drained', 'Stop Feeling Drained At Kick Off', '309156201/4ebe4d31eb'),
      L('ten-breaths', 'Ten Breathes Visualisation', '309157193'),
      L('best-month', 'Producing The Best Possible Month', '309273413'),
      L('animals', 'Mimicking Animals', '309156635'),
      L('vis-gk', 'Pre-Match Visualisation: Goalkeepers', '309156892/3bfac2643c'),
      L('vis-cb', 'Pre-Match Visualisation: Centre Backs', '309156762/729e6a5dde'),
      L('vis-fb', 'Pre-Match Visualisation: Full Backs', '309156825/bbc39e4219'),
      L('vis-mid', 'Pre-Match Visualisation: Midfielders', '309156953/9aec536e64'),
      L('vis-wing', 'Pre-Match Visualisation: Wingers', '309157077/cdb82fb5e5'),
      L('vis-st', 'Pre-Match Visualisation: Strikers', '309157014/96a92fb395'),
    ],
  },
  {
    id: 'selftalk', title: 'Self Control & Self Talk', he: 'שליטה עצמית ודיבור פנימי',
    lessons: [
      L('self-talk', 'Introduction To Self Talk', '309274522/f6315a9d8e'),
      L('mistakes', 'Making Mistakes In Matches', '309156588/268b482019'),
      L('hormones', 'Controlling Hormone Release', '309156097/b9b4fb30b3'),
    ],
  },
  {
    id: 'attitude', title: 'Attitude & Competitiveness', he: 'גישה ותחרותיות',
    lessons: [
      L('talent', 'Mindset Is A Talent', '309156681/67ea743d53'),
      L('closed-doors', 'Work Behind Closed Doors', '309157468/2a81c624c3'),
      L('never-path', 'Avoiding The "Never Path"', '309155805/aec6621561'),
      L('brutal-honesty', 'Brutal Honesty', '309155919/ab0dd9701e'),
      L('champions', 'The Champions Of Tomorrow Analyse The Champions Of Today', '309155985/54483f08e2'),
      L('ppi', 'Performance = Potential - Interference', '309156727/e60f3a9442'),
      L('actors', 'Footballers Are Actors', '309156504/dc4a992b30'),
      L('unrealistic', '"You\'re Being Unrealistic"', '309157516/093c9d82cd'),
      L('final-tips', 'Final Tips For Maximal Results', '309190296/55f2944ecd'),
    ],
  },
];

/** Re-listening schedule (page 13) → lesson ids */
export const RELISTEN: { when: 'day-before' | 'six-hours' | 'after-match' | 'training'; he: string; lessons: string[] }[] = [
  { when: 'day-before', he: 'יום/ערב לפני משחק', lessons: ['avoid-uncontrollable', 'filling-bars', 'confidence-look', 'self-talk', 'wrong-thing', 'power-visualisation', 'animals', 'controlling-nerves'] },
  { when: 'six-hours', he: '6 שעות לפני / בדרך למשחק', lessons: ['positive-past', 'mistakes', 'hormones', 'next-thing', 'ten-breaths', 'music', 'watching'] },
  { when: 'after-match', he: 'אחרי משחק', lessons: ['brutal-honesty'] },
  { when: 'training', he: 'סביב אימונים', lessons: ['intention', 'crespo'] },
];

export const MINDSET_INTRO = [
  'הכול מתחיל בראש. רוב השחקנים מקשיבים לקול הפנימי ("מה אם אטעה?"). כאן לומדים לדבר אליו ולכוון אותו.',
  'בהתחלה תרגיש עייפות מנטלית. המוח רץ על גלוקוז: פחמימות לפני ואחרי כל אימון ומשחק.',
  'כדאי לחזור לשיעורים כמה פעמים עד שזה נטמע.',
];

// ---------- Worksheets (printouts) ----------
export const POST_MATCH_ANALYSIS = {
  intro: 'פונים למישהו שראה אותך מקרוב ושאתה סומך עליו שיגיד 100% אמת: חבר, מאמן או בן משפחה. אתה בוחר אותו. לחכות לשמוע את השלילי: זה מה שמראה על מה לעבוד.',
  fields: [
    { key: 'standout', he: '2 רגעים בולטים במשחק', count: 2, withWhy: true },
    { key: 'better', he: '2 רגעים שיכולת לעשות טוב יותר', count: 2, withWhy: true },
    { key: 'best', he: 'הרגע הכי טוב שלך (לדעתך)', count: 1, withWhy: false },
    { key: 'worst', he: 'הרגע הכי גרוע שלך (לדעתך)', count: 1, withWhy: false },
    { key: 'fix', he: 'איך מתקנים את זה במשחק הבא?', count: 1, withWhy: false },
  ],
};

export const TRAINING_SCRIPT_FIELDS = [
  { key: 'position', he: 'עמדה', count: 1 },
  { key: 'mainGoal', he: 'מטרת המיינדסט הראשית (לא בשליטתך) באימון היום', count: 1 },
  { key: 'controllable', he: '3 מטרות בשליטתך שייתנו את הסיכוי הכי טוב', count: 3 },
  { key: 'goingWell', he: 'איך אדע שהאימון הולך טוב?', count: 3 },
  { key: 'notWell', he: 'איך אדע שהאימון לא הולך טוב?', count: 3 },
  { key: 'wentWell', he: 'מה הלך טוב היום?', count: 3 },
  { key: 'didntGoWell', he: 'מה לא הלך טוב?', count: 3 },
];

export const MATCHDAY_SCRIPT_FIELDS = [
  { key: 'position', he: 'עמדה', count: 1 },
  { key: 'mainGoal', he: 'המטרה הראשית (לא בשליטתך) היום', count: 1 },
  { key: 'controllable', he: '3 מטרות בשליטתך שייתנו את הסיכוי הכי טוב', count: 3 },
  { key: 'greatGame', he: 'איך נראה משחק מעולה שלך? (תחשוב על אחד הטובים)', count: 3 },
  { key: 'badGame', he: 'איך נראה משחק גרוע שלך?', count: 3 },
  { key: 'badSituations', he: 'מה אעשה אם... (3 מצבים רעים ותגובה לכל אחד)', count: 3 },
  { key: 'confidence', he: 'אם אתחיל לאבד ביטחון/מוטיבציה, מה אעשה?', count: 3 },
];

export const SELF_TALK_STEPS = [
  { step: 1, he: 'במשך שבועיים: כל פעם שתופס את עצמך מדבר לעצמך שלילי (בראש או בקול), רושמים מיד אחרי האימון/משחק.', example: '"הנגיעה הראשונה שלי זבל היום", "אני חלש באוויר", "הרגל השמאלית שלי גרועה"' },
  { step: 2, he: 'לכל משפט: מה גרם לו? חוויה מהעבר, מישהו צעק עליך, נראית טיפש, לא היית מרוכז, הרגשת חלש פיזית?' },
  { step: 3, he: 'כותבים את אותה מחשבה בצורה חיובית + 2 דרכים לשפר.', example: 'במקום "הרגל השמאלית שלי גרועה": "אם צריך את החלשה, אלך על שליטה ולא על כוח. לא אשתפר אם לא אשתמש בה." + 2×10 דק\' בעיטות בחלשה בשבוע הבא.' },
];
