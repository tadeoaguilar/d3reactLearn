/**
 * Exercise 01.1: reference solution.
 */
import type { ReactNode } from "react";
import { palette } from "../../../../shared/theme";

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

/** Bonus: the same name always gets the same color. */
function colorFor(name: string) {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[sum % palette.length];
}

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colorFor(name),
        color: "white",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 9px",
        borderRadius: 999,
        fontSize: 12,
        marginRight: 4,
        border: "1px solid var(--border)",
        background: tone === "success" ? "#e3f4e8" : "var(--surface-2)",
        color: tone === "success" ? "#2c8a4b" : "inherit",
      }}
    >
      {children}
    </span>
  );
}

function ProfileCard({ person }: { person: Person }) {
  return (
    <article className="card" style={{ width: 240 }}>
      <div className="row">
        <Avatar name={person.name} />
        <div>
          <strong>{person.name}</strong>
          <div className="muted" style={{ fontSize: 13 }}>
            {person.role}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {person.skills.map((skill) => (
          <Tag key={skill}>{skill}</Tag>
        ))}
        {person.available && <Tag tone="success">Available</Tag>}
      </div>
    </article>
  );
}

function TeamGrid({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      <div className="row" style={{ alignItems: "stretch" }}>
        {children}
      </div>
    </section>
  );
}

export default function ProfileCards() {
  return (
    <TeamGrid title="Our team">
      {team.map((person) => (
        <ProfileCard key={person.name} person={person} />
      ))}
    </TeamGrid>
  );
}
