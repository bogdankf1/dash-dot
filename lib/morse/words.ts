// Curated word bank of 2-5 letter English words (A-Z only)
const WORD_BANK: string[] = [
  // 2-letter words
  'AT', 'AM', 'AN', 'AS', 'BE', 'BY', 'DO', 'GO', 'HE', 'IF',
  'IN', 'IS', 'IT', 'ME', 'MY', 'NO', 'OF', 'ON', 'OR', 'SO',
  'TO', 'UP', 'US', 'WE',
  // 3-letter words
  'ACE', 'ACT', 'ADD', 'AGE', 'AID', 'AIM', 'AIR', 'ATE', 'ART',
  'BAD', 'BAG', 'BAN', 'BAT', 'BED', 'BIG', 'BIT', 'BOW', 'BOX',
  'BUS', 'BUT', 'BUY', 'CAN', 'CAP', 'CAR', 'CUP', 'CUT',
  'DAD', 'DAM', 'DIG', 'DIM', 'DIP', 'DOG', 'DOT', 'DUG',
  'EAR', 'EAT', 'END', 'ERA', 'EYE',
  'FAN', 'FAR', 'FAT', 'FED', 'FIG', 'FIN', 'FIT', 'FIX', 'FLY', 'FOR', 'FOX', 'FUN', 'FUR',
  'GAP', 'GAS', 'GET', 'GOD', 'GOT', 'GUM', 'GUN', 'GUT',
  'HAD', 'HAM', 'HAS', 'HAT', 'HER', 'HID', 'HIM', 'HIS', 'HIT', 'HOT', 'HOW', 'HUG',
  'ICE', 'INN',
  'JAM', 'JAR', 'JAW', 'JET', 'JOB', 'JOG', 'JOY',
  'KEY', 'KID', 'KIT',
  'LAP', 'LAW', 'LAY', 'LED', 'LEG', 'LET', 'LID', 'LIE', 'LIT', 'LOG', 'LOT', 'LOW',
  'MAD', 'MAN', 'MAP', 'MAT', 'MEN', 'MET', 'MIX', 'MOM', 'MUD',
  'NAP', 'NET', 'NEW', 'NIT', 'NOR', 'NOT', 'NOW', 'NUN', 'NUT',
  'OAK', 'ODD', 'OFF', 'OIL', 'OLD', 'ONE', 'OUR', 'OUT', 'OWE', 'OWN',
  'PAN', 'PAT', 'PAW', 'PEN', 'PET', 'PIE', 'PIN', 'PIT', 'POT', 'PUT',
  'RAN', 'RAT', 'RAW', 'RED', 'RID', 'RIM', 'RIP', 'ROD', 'ROW', 'RUG', 'RUN',
  'SAD', 'SAT', 'SAW', 'SET', 'SIT', 'SIX', 'SKI', 'SKY', 'SON', 'SUM', 'SUN',
  'TAN', 'TAP', 'TEA', 'TEN', 'TIE', 'TIN', 'TIP', 'TOE', 'TOP', 'TOW', 'TUG',
  'USE',
  'VAN', 'VET', 'VOW',
  'WAR', 'WAS', 'WAX', 'WAY', 'WEB', 'WET', 'WHO', 'WIG', 'WIN', 'WIT', 'WON', 'WOW',
  'YAM', 'YES', 'YET', 'YOU',
  'ZAP', 'ZEN', 'ZIP', 'ZOO',
  // 4-letter words
  'AREA', 'ATOM', 'EARN', 'EAST', 'EMIT', 'GATE', 'GAME', 'ITEM',
  'MAIN', 'MAKE', 'MANE', 'MATE', 'MEAN', 'MEAT', 'MINE', 'MINT',
  'NAME', 'NEAT', 'NINE', 'NOTE', 'RAIN', 'RATE', 'RENT', 'RISE',
  'SAME', 'SAND', 'SEAT', 'SIDE', 'SIGN', 'SING', 'STEM', 'STAR',
  'SWIM', 'TAKE', 'TALE', 'TAME', 'TEAM', 'TEAR', 'TIME', 'TIDE',
  'TIRE', 'TONE', 'TRIM', 'TURN', 'TWIN', 'UNIT', 'VINE', 'WAIT',
  'WAKE', 'WARM', 'WARN', 'WAVE', 'WIDE', 'WIND', 'WINE', 'WIRE',
  'WISE', 'WORD', 'WORN',
  // 5-letter words
  'DRAIN', 'DREAM', 'EARTH', 'GRAIN', 'MINER', 'MOUNT', 'NIGHT',
  'PAINT', 'RAISE', 'RINSE', 'STEAM', 'STONE', 'STORM', 'SWEAR',
  'TEASE', 'TIMER', 'TOWER', 'TRADE', 'TRAIN', 'WATER', 'WRITE',
];

/**
 * Returns all words from the bank that can be spelled using only the given letters.
 */
export function getAvailableWords(learnedLetters: Set<string>): string[] {
  const upperLetters = new Set(
    Array.from(learnedLetters).map((l) => l.toUpperCase())
  );
  return WORD_BANK.filter((word) =>
    word.split('').every((ch) => upperLetters.has(ch))
  );
}

/**
 * Picks a random subset of available words for a word lesson.
 */
export function getWordsForLesson(
  learnedLetters: Set<string>,
  count: number = 8
): string[] {
  const available = getAvailableWords(learnedLetters);
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Minimum number of available words required to show a word lesson.
 */
export const MIN_WORDS_FOR_LESSON = 3;
