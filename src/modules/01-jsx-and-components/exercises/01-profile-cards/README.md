# Exercise 01.1: Profile cards

Build a small component library for a "team" page.

## Tasks

1. **`Avatar`**: props `name: string` and `size?: number` (default `48`). Render a circle (a `<div>` with `borderRadius: "50%"`) that shows the person's **initials** ("Grace Hopper" → "GH"). Use `size` for width, height and a proportional font size.
2. **`Tag`**: props `children: ReactNode`. A small pill-shaped label.
3. **`ProfileCard`**: props `person: Person` (the interface is already in the starter). It shows:
   - an `Avatar`
   - name and role
   - one `Tag` per skill
   - a **"Available"** tag only if `person.available` is `true` (hint: `&&`)
4. **`TeamGrid`**: props `title: string` and `children: ReactNode`. It renders the title and lays its children out in a wrapping row.
5. In the default export, render a `TeamGrid` that contains one `ProfileCard` per person in `team`.

## Bonus

- Give `Avatar` a background color that depends on the name, so each person always gets the same color. Hint: add up the character codes and pick from `palette` (imported from `src/shared/theme`).

## Done when

- [ ] Four people render in a wrapping grid with initials, role and skills
- [ ] Only available people show the "Available" tag
- [ ] Passing a number as `name` to `Avatar` is a TypeScript error
