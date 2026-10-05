export interface HowTo {
  why?: string;
  start?: string;
  steps?: string[];
  cues?: string[];
  mistake?: string;
  easier?: string;
  harder?: string;
  /** the exact movement pattern is best seen in the video */
  video?: boolean;
}

/** An alias entry: same explanation as another exercise, optional extra note. */
export interface Ref {
  ref: string;
  note?: string;
}

export function h(why: string, start: string, steps: string[], cues: string[], mistake?: string, easier?: string, harder?: string, video = false): HowTo {
  return { why, start, steps, cues, mistake, easier, harder, video };
}
