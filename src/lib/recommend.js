import { movies } from "../data/movies.js";

// Maps casual words a user might type to IMDB genres / interests / plot terms.
const SYNONYMS = {
  // moods / vibes
  dark: ["dark", "grim", "bleak", "noir"],
  gritty: ["grim", "dark", "crime"],
  epic: ["epic"],
  tragic: ["tragedy", "tragic"],
  sad: ["tragedy", "melancholy"],
  intense: ["action", "thriller", "tense"],
  tense: ["thriller", "tense"],
  chaotic: ["chaos", "thriller", "action"],
  violent: ["crime", "action", "gangster"],
  // genres
  crime: ["crime"],
  drama: ["drama"],
  action: ["action"],
  thriller: ["thriller"],
  superhero: ["superhero"],
  gangster: ["gangster", "crime"],
  mafia: ["gangster", "crime", "dynasty"],
  mob: ["gangster", "crime"],
  noir: ["noir", "crime"],
  comedy: ["comedy"],
  horror: ["horror"],
  scifi: ["sci-fi", "science fiction"],
  "sci-fi": ["sci-fi", "science fiction"],
  anime: ["anime"],
  // themes / subjects
  family: ["family", "dynasty", "patriarch"],
  dynasty: ["dynasty", "family"],
  power: ["power", "empire", "control"],
  empire: ["empire", "dynasty"],
  joker: ["joker", "chaos", "villain"],
  villain: ["villain", "chaos"],
  batman: ["batman", "superhero", "vigilante"],
  vigilante: ["vigilante", "superhero"],
  gotham: ["gotham", "superhero", "crime"],
  chaos: ["chaos", "thriller"],
  corruption: ["crime", "corruption"],
  heist: ["heist", "crime"],
  detective: ["detective", "crime", "thriller"],
  war: ["war", "epic"],
  revenge: ["revenge", "tragedy"],
  scary: ["horror", "dread", "unsettling", "eerie"],
  creepy: ["eerie", "unsettling", "dread"],
  spooky: ["horror", "eerie", "supernatural"],
  terrifying: ["horror", "dread"],
  weird: ["surreal", "eerie"],
  strange: ["surreal", "eerie", "unsettling"],
  space: ["sci-fi", "alien", "nebula", "stars"],
  alien: ["sci-fi", "alien", "extraterrestrial"],
  future: ["sci-fi", "dystopia", "ai", "cyberpunk"],
  robot: ["ai", "replicant", "cyborg"],
  ai: ["ai", "replicant", "cyborg", "consciousness"],
  anime: ["anime"],
  japanese: ["anime", "tokyo", "korea"],
  thriller: ["thriller", "tense", "grim"],
  tense: ["tense", "dread"],
  dark: ["bleak", "grim", "moody", "horror"],
  sad: ["melancholy", "bleak"],
  dreamy: ["dreamlike", "surreal", "mesmerizing"],
  dream: ["dreamlike", "surreal", "dreams", "psyche"],
  mind: ["psychological", "surreal", "identity", "memory"],
  mindbending: ["surreal", "psychological", "identity"],
  "mind-bending": ["surreal", "psychological", "identity"],
  trippy: ["surreal", "dreamlike", "vibrant"],
  neon: ["neon", "neo-noir", "cyberpunk"],
  rainy: ["rain", "neo-noir"],
  noir: ["neo-noir", "detective", "moody"],
  detective: ["detective", "noir", "mystery"],
  murder: ["serial killer", "crime", "thriller"],
  killer: ["serial killer", "hitman", "crime"],
  cult: ["cult", "folk horror", "ritual"],
  forest: ["forest", "folk horror", "isolation"],
  isolated: ["isolation", "claustrophobic", "island"],
  lonely: ["loneliness", "melancholy", "isolation"],
  psychological: ["psychological", "identity", "delusion"],
  slow: ["slow", "bleak"],
  atmospheric: ["moody", "eerie", "mesmerizing"],
  intense: ["intense", "tense", "chaotic"],
  beautiful: ["mesmerizing", "vibrant", "moody"],
  gore: ["body horror", "horror"],
  gorey: ["body horror", "horror"],
  bloody: ["body horror", "horror"],
  supernatural: ["supernatural", "horror"],
  ghost: ["supernatural", "horror"],
  witch: ["witch", "folk horror"],
  dystopia: ["dystopia", "future", "cyberpunk"],
  cyberpunk: ["cyberpunk", "neon", "future"],
  haunted: ["supernatural", "horror", "haunting"],
  haunting: ["haunting", "eerie", "melancholy"],
  melancholy: ["melancholy", "moody", "bleak"],
  surreal: ["surreal", "dreamlike"],
  claustrophobic: ["claustrophobic", "isolation"],
  paranoia: ["paranoid", "psychological"],
  paranoid: ["paranoid", "psychological"],
  crime: ["crime", "thriller", "detective"],
  revenge: ["revenge", "violence"],
  heist: ["heist", "crime"],
  biker: ["biker", "neon", "tokyo"],
  desert: ["desert", "border", "western"],
  western: ["neo-western", "desert"],
};

const STOPWORDS = new Set([
  "a", "an", "the", "i", "me", "my", "we", "our", "you", "your",
  "of", "to", "in", "on", "for", "with", "and", "or", "but", "is",
  "are", "be", "about", "like", "something", "movies", "movie", "film",
  "films", "show", "shows", "watch", "want", "feel", "feeling", "recommend",
  "please", "give", "that", "this", "it", "at", "by", "from",
]);

// --- Build a searchable text blob per movie from the IMDB schema -------------
function buildSearchBlob(movie) {
  const parts = [
    ...(movie.genres || []),
    ...(movie.interests || []),
    movie.title || "",
    movie.originalTitle || "",
    movie.description || "",
  ];
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

// Precompute once.
const index = movies.map((m) => ({
  movie: m,
  terms: new Set(buildSearchBlob(m)),
  genres: (m.genres || []).map((g) => g.toLowerCase()),
  interests: (m.interests || []).map((i) => i.toLowerCase()),
}));

function tokenize(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function expandTerms(tokens) {
  const terms = new Set();
  for (const token of tokens) {
    terms.add(token);
    const syns = SYNONYMS[token];
    if (syns) syns.forEach((s) => terms.add(s));
  }
  return [...terms];
}

// Score a movie against the query terms.
// - exact genre/interest match: strong
// - term appears in the movie's text blob: medium
// - partial/substring match: weak
function scoreMovie(entry, terms) {
  let score = 0;
  for (const term of terms) {
    // Genres & interests carry the most weight.
    for (const g of entry.genres) {
      if (g === term) score += 5;
      else if (g.includes(term) || term.includes(g)) score += 2;
    }
    for (const intr of entry.interests) {
      if (intr === term) score += 4;
      else if (intr.includes(term) || term.includes(intr)) score += 2;
    }
    // Full text blob (title, description, etc.).
    for (const blobTerm of entry.terms) {
      if (blobTerm === term) score += 2;
      else if (blobTerm.includes(term) || term.includes(blobTerm)) score += 1;
    }
  }
  // Slight tie-breaker toward higher-rated films.
  score += (entry.movie.averageRating || 0) * 0.05;
  return score;
}

// --- AI summarize of the query --------------------------------------------
// Picks the most salient concept words from the query and renders them into a
// quoted phrase used as the row heading.
function summarizeQuery(query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return "your search";

  const terms = expandTerms(tokens);
  const allGenres = movies.flatMap((m) => m.genres || []).map((g) => g.toLowerCase());
  const allInterests = movies.flatMap((m) => m.interests || []).map((i) => i.toLowerCase());

  const ranked = tokens
    .map((t) => {
      let strength = 0;
      if (allGenres.some((g) => g.includes(t))) strength += 3;
      if (allInterests.some((i) => i.includes(t))) strength += 2;
      if (SYNONYMS[t]) strength += 1;
      return { t, strength };
    })
    .sort((a, b) => b.strength - a.strength);

  const top = ranked.slice(0, 2).map((r) => r.t);
  const phrase = top.join(" + ");
  return phrase || tokens.slice(0, 3).join(" ");
}

export function recommend(query) {
  const tokens = tokenize(query);
  const terms = expandTerms(tokens);

  if (terms.length === 0) {
    return { summary: "your search", results: movies.slice(0, 10) };
  }

  const scored = index
    .map((entry) => ({ movie: entry.movie, score: scoreMovie(entry, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.movie);

  return {
    summary: summarizeQuery(query),
    results: scored.length > 0 ? scored : movies.slice(0, 10),
  };
}