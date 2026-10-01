/**
 * Exercise 00.1: replace every `any` with a proper type.
 * See README.md in this folder for the full instructions.
 */

// TODO 1 + 2: write `interface Movie` and `type Genre` here.

// TODO 3: type this array.
const movies: any[] = [
  { title: "Arrival", year: 2016, rating: 7.9, genre: "sci-fi", tags: ["aliens", "language"] },
  { title: "The Grand Budapest Hotel", year: 2014, rating: 8.1, genre: "comedy" },
  { title: "Moonlight", year: 2016, rating: 7.4, genre: "drama", tags: ["coming of age"] },
  { title: "Interstellar", year: 2014, rating: 8.7, genre: "sci-fi", tags: ["space"] },
  { title: "Paddington 2", year: 2017, rating: 7.8, genre: "comedy" },
];

// TODO 4: type parameters and return values.
function averageRating(list: any): any {
  if (list.length === 0) return 0;
  return list.reduce((sum: any, m: any) => sum + m.rating, 0) / list.length;
}

function moviesByGenre(list: any): any {
  const groups: any = { drama: [], comedy: [], "sci-fi": [] };
  for (const m of list) groups[m.genre].push(m);
  return groups;
}

function bestMovie(list: any): any {
  return [...list].sort((a: any, b: any) => b.rating - a.rating)[0];
}

// TODO 5: define LoadState and use it instead of `any`.
const state: any = { status: "ready", movies };

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
      {/* TODO 4: once bestMovie can return undefined, handle it here */}
      <p>
        Best movie: <strong>{best.title}</strong> ({best.year})
      </p>
      {Object.keys(groups).map((genre) => (
        <div key={genre}>
          <strong>{genre}</strong>: {groups[genre].map((m: any) => m.title).join(", ")}
        </div>
      ))}
    </div>
  );
}
