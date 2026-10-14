import { useState } from 'react';
import { DIY_DRINKS, DRINKS_WARNINGS, EATING_SCHEDULES, HALF_TIME_SNACKS, HYDRATION, MATCH_DAY_RULES, NUTRITION_COACHING, POST_MATCH, PRE_MATCH_MEALS, PRE_MATCH_SNACKS, SEVEN_TIPS, SUPPLEMENT_RULES, SUPPLEMENTS } from '../../../content/nutrition';
import { VideoLinks } from '../../components/common';

// ---------------------------------------------------------------- guide
export function Guide() {
  const [open, setOpen] = useState<string | null>('bible');
  const sec = (key: string, title: string, body: React.ReactNode) => (
    <div className="card">
      <div className="ch tap" onClick={() => setOpen(open === key ? null : key)}>
        {title} <span>{open === key ? '−' : '+'}</span>
      </div>
      {open === key && body}
    </div>
  );
  const ul = (xs: readonly string[]) => (
    <ul className="clean small">
      {xs.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
  return (
    <>
      {sec(
        'bible',
        'עקרונות החיטוב (Bible)',
        ul([
          'גירעון של 250-500 קלוריות מהתחזוקה. לא מורידים פחמימות לפני אימון: מרכזים אותן סביב האימון, ובשאר הארוחות חלבון, ירקות ואגוזים.',
          '30-40 ג\' חלבון בכל ארוחה, כל 3-4 שעות, וגם לפני השינה.',
          'בשר טרי פעם ביום: לבן בימי מנוחה וקלים, אדום בימים עצימים ובימי משחק. נתחים רזים (עד 5% שומן), בלי מעובד.',
          'לחם: בחיטוב מלא/נבוט. לפני משחק לבן.',
          'סוכר רק בזמן מאמץ. פרוקטוז (בננה) בארוחה 3 שעות לפני.',
          'אגוזים: עדיפות למלך ולמקדמיה, משאר הסוגים חופן קטן.',
          'בריאות המעי: אוכל טבעי. להימנע ממשקאות ממותקים, ממתקים ושמנים צמחיים עשירים באומגה 6. שמן זית עדיף.',
          '"סופר-פודס": בטטה (1-2 ביום), סלמון, יוגורט יווני לפני שינה, שיבולת שועל, אגוזים, אוכמניות.',
          'אסור בעונה: צום לסירוגין, ודיאטה דלת פחמימות לפני משחק.',
          'אלכוהול: עד 0.5 ג\' לק"ג כדי לא לפגוע בהתאוששות.',
          'יעד אחוז שומן: 8-12%.',
        ]),
      )}
      {sec(
        'kosher',
        'כשרות (R-KSH)',
        ul(['ארוחה לא מערבבת בשר וחלב. אי אפשר לשמור ארוחה כזו.', 'בשר ודג באותה ארוחה: אזהרה.', 'אחרי בשרי מחכים שעתיים לפני חלבי (ניתן לשינוי בהגדרות). אחרי חלבי שוטפים את הפה ואפשר בשרי.', 'שייק אחרי אימון כשאכלת בשר לפני פחות משעתיים: חלבון סויה (פרווה), "האפשרות הבאה הכי טובה" לפי ה-Bible.', 'תוספים: לבדוק הכשר (אומגה 3 וג\'לטין בכמוסות).']),
      )}
      {sec('tips', '7 הטיפים', ul(SEVEN_TIPS))}
      {sec(
        'water',
        'שתייה ומשקאות ביתיים',
        <>
          {ul(HYDRATION)}
          {DIY_DRINKS.map((d) => (
            <div key={d.name} className="small mt">
              <b>{d.name}:</b> {d.recipe}. <span className="muted">{d.why}</span>
            </div>
          ))}
          {ul(DRINKS_WARNINGS)}
        </>,
      )}
      {sec('match', 'יום משחק', ul(MATCH_DAY_RULES))}
      {sec(
        'prematch',
        '10 ארוחות לפני משחק',
        <>
          {PRE_MATCH_MEALS.map((m) => (
            <div key={m.name} className="small" style={{ marginBottom: 6 }}>
              <b>{m.name}</b>
              <div className="xs muted">{m.note}</div>
            </div>
          ))}
          <div className="small mt">
            <b>נשנוש לפני:</b> {PRE_MATCH_SNACKS.join(', ')}
          </div>
          <div className="small">
            <b>במחצית:</b> {HALF_TIME_SNACKS.join(', ')}
          </div>
        </>,
      )}
      {sec('post', 'אחרי משחק', ul(POST_MATCH))}
      {sec(
        'sched',
        'לו"ז אכילה לפי שעת המשחק',
        <>
          {(
            [
              ['morning', 'משחק בבוקר'],
              ['afternoon', 'משחק אחר הצהריים'],
              ['evening', 'משחק בערב'],
            ] as const
          ).map(([k, l]) => (
            <div key={k} className="mt">
              <b className="small">{l}</b>
              {ul(EATING_SCHEDULES[k])}
            </div>
          ))}
        </>,
      )}
      {sec(
        'supp',
        'תוספים',
        <>
          {ul(SUPPLEMENT_RULES)}
          {SUPPLEMENTS.map((x) => (
            <div key={x.name} className="small mt">
              <b className="ltr">{x.name}</b>: {x.text}
            </div>
          ))}
        </>,
      )}
      {sec('videos', 'סרטוני תזונה', <VideoLinks videos={NUTRITION_COACHING} />)}
    </>
  );
}
