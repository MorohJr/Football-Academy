// R-WKF (SPEC 14.12): weak foot & first touch, from the "changing internal self talk" worksheet (MINDSET.pdf):
// "2×10 mins receiving the ball from different types of passes / with different parts of the body and foot",
// "2×10 mins striking the ball continuously with different parts of my weaker foot". Light: low RPE.
import type { Workout } from './types';

export const weakFootWorkout: Workout = {
  id: 'weak-foot',
  title: 'Weak Foot & First Touch',
  subtitle: 'רגל חלשה ונגיעה ראשונה · 10 דק\'',
  category: 'recovery',
  location: 'any',
  durationMin: 10,
  equipment: ['כדור', 'קיר', '2 קונוסים'],
  notes: [
    'מדף העבודה "שינוי דיבור פנימי": שליטה לפני כוח. לא משתפרים בלי להשתמש בה.',
    'עצימות נמוכה (RPE 2-3). זה יום קל.',
  ],
  blocks: [
    {
      title: 'קבלת כדור',
      kind: 'sequence',
      exercises: [
        { name: 'Wall Pass: Ground Receive', reps: '2 דק\'', note: 'מסירה לקיר מ-5 מ\', קבלה ברגל החלשה לתוך שטח (לא מתחת לגוף).' },
        { name: 'Wall Pass: Bouncing Receive', reps: '2 דק\'', note: 'מסירה חזקה כך שהכדור חוזר בקפיצה. קבלה בכף הרגל החלשה.' },
        { name: 'Aerial Receive', reps: '2 דק\'', note: 'זריקה באוויר וקבלה: ירך, חזה, ואז הרגל החלשה.' },
      ],
    },
    {
      title: 'בעיטות ברגל החלשה',
      kind: 'sequence',
      exercises: [
        { name: 'Inside Foot Passing', reps: '2 דק\'', note: 'מסירות פנים-רגל לקיר, רק ברגל החלשה.' },
        { name: 'Laces Strikes', reps: '1 דק\'', note: 'בעיטות בגב כף הרגל. שליטה, לא כוח.' },
        { name: 'Outside Foot Touches', reps: '1 דק\'', note: 'מגע בחוץ-רגל בין שני קונוסים.' },
      ],
    },
  ],
};
