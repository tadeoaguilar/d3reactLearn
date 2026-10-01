/**
 * Exercise 01.1: Profile cards. See README.md for instructions.
 */
import type { ReactNode } from "react";

interface Person {
  name: string;
  role: string;
  skills: string[];
  available: boolean;
}

const team: Person[] = [
  { name: "Grace Hopper", role: "Compiler Engineer", skills: ["COBOL", "Leadership"], available: true },
  { name: "Alan Turing", role: "Researcher", skills: ["Cryptography", "Math"], available: false },
  { name: "Katherine Johnson", role: "Data Scientist", skills: ["Orbital math", "Fortran"], available: true },
  { name: "Linus Torvalds", role: "Kernel Maintainer", skills: ["C", "Git"], available: false },
];

// TODO 1: Avatar({ name, size = 48 })
// Hint: const initials = name.split(" ").map((p) => p[0]).join("");

// TODO 2: Tag({ children })

// TODO 3: ProfileCard({ person })

// TODO 4: TeamGrid({ title, children })

export default function ProfileCards() {
  // TODO 5: replace this placeholder with <TeamGrid> + one <ProfileCard> per person.
  return <div className="todo-hint">Render {team.length} profile cards here.</div>;
}
