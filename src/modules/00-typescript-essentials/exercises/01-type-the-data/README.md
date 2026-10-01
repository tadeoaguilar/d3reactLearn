# Exercise 00.1: Type the data

`Starter.tsx` has working JavaScript-style code that uses `any` everywhere. Your job is to **replace every `any` with a real type**. The page already renders. When you're done it should render exactly the same, but the compiler will now catch mistakes.

## Tasks

1. Write an `interface Movie` with `title` (string), `year` (number), `rating` (number, 0–10) and an optional `tags` (array of strings).
2. Write a union type `Genre` for the values `"drama"`, `"comedy"` and `"sci-fi"`, and add a `genre: Genre` field to `Movie`.
3. Type the `movies` array.
4. Type the parameters and return values of `averageRating`, `moviesByGenre` and `bestMovie`.
   - `bestMovie` returns `undefined` for an empty list. Make the return type say so, and handle that case in the JSX.
5. Write a discriminated union `LoadState` with `{ status: "loading" }`, `{ status: "ready"; movies: Movie[] }` and `{ status: "error"; message: string }`. Use it to type `state`.
6. **Try to break it:** add `{ title: "Oops", year: "1999" }` to the array. You should get a red squiggle. Remove it.

## Done when

- [ ] Searching the file for `any` finds nothing
- [ ] `npm run typecheck` passes
- [ ] The page renders the same as before

## Hints

<details><summary>How do I type a function that returns "a Movie or nothing"?</summary>

`function bestMovie(list: Movie[]): Movie | undefined { … }`
</details>

<details><summary>How do I group by genre with types?</summary>

Return `Record<Genre, Movie[]>` and start from `{ drama: [], comedy: [], "sci-fi": [] }`.
</details>
