/**
 * Exercise 00.1: reference solution.
 */

type Genre = "drama" | "comedy" | "sci-fi";

interface Movie {
  title: string;
  year: number;
  rating: number; // 0–10
  genre: Genre;
  tags?: string[];
}

type LoadState = { status: "loading" } | { status: "ready"; movies: Movie[] } | { status: "error"; message: string };

const movies: Movie[] = [
  { title: "Arrival", year: 2016, rating: 7.9, genre: "sci-fi", tags: ["aliens", "language"] },
  { title: "The Grand Budapest Hotel", year: 2014, rating: 8.1, genre: "comedy" },
  { title: "Moonlight", year: 2016, rating: 7.4, genre: "drama", tags: ["coming of age"] },
  { title: "Interstellar", year: 2014, rating: 8.7, genre: "sci-fi", tags: ["space"] },
  { title: "Paddington 2", year: 2017, rating: 7.8, genre: "comedy" },
];

function averageRating(list: Movie[]): number {
  if (list.length === 0) return 0;
  return list.reduce((sum, m) => sum + m.rating, 0) / list.length;
}

function moviesByGenre(list: Movie[]): Record<Genre, Movie[]> {
  const groups: Record<Genre, Movie[]> = { drama: [], comedy: [], "sci-fi": [] };
  for (const m of list) groups[m.genre].push(m);
  return groups;
}

function bestMovie(list: Movie[]): Movie | undefined {
  return [...list].sort((a, b) => b.rating - a.rating)[0];
}

// Annotating as LoadState (not the narrower inferred type) keeps all three
// branches below valid.
const state = { status: "ready", movies } as LoadState;

export default function TypeTheData() {
  if (state.status === "loading") return <p>Loading…</p>;
  if (state.status === "error") return <p>Error: {state.message}</p>;

  const groups = moviesByGenre(state.movies);
  const best = bestMovie(state.movies);

  return (
    <div className="stack">
      <p>
        Average rating: <strong>{averageRating(state.movies).toFixed(2)}</strong>
      </p>
      <p>
        Best movie:{" "}
        {best ? (
          <strong>
            {best.title} ({best.year})
          </strong>
        ) : (
          <em>none</em>
        )}
      </p>
      {/* Object.keys returns string[]. The cast tells TS these are Genre keys. */}
      {(Object.keys(groups) as Genre[]).map((genre) => (
        <div key={genre}>
          <strong>{genre}</strong>: {groups[genre].map((m) => m.title).join(", ")}
        </div>
      ))}
    </div>
  );
}
