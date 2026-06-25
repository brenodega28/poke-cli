# AGENTS.md

Guidance for AI agents working in this TypeScript codebase. Follow these rules unless a file's existing convention clearly says otherwise.

## Core principles

- Type safety is non-negotiable. `strict` is on. Never use `any`; reach for `unknown` and narrow, or model the type properly.
- Let inference do the work. Annotate exported signatures and public boundaries; don't annotate what TypeScript already knows.
- Prefer immutability. Default to `const`; avoid `let` and in-place mutation. Treat data as read-only (`readonly`, `as const`).
- Write self-documenting code. Names carry the meaning, not comments.

## Modern patterns to enforce

- ESM only: `import`/`export`, named exports over default exports.
- Prefer `type` aliases over `interface` unless declaration merging is required.
- Model variants with discriminated unions, not inheritance or status flags.
- No `enum`. Use `as const` objects or string-literal unions.
- Functions over classes. Only use a class when identity, lifecycle, or shared mutable state genuinely requires it.
- `async`/`await` over `.then()` chains. Never leave a promise unawaited.
- Validate at boundaries (API input, env, parsed files) with a runtime schema (e.g. Zod); derive static types from the schema.
- Early returns over nested conditionals. Keep nesting shallow.
- Use `node:` prefix for Node builtins.
- Use built-in array/object methods (`map`, `filter`, `flatMap`, `Object.entries`) over manual loops where it reads cleaner.
- Handle errors explicitly. Don't swallow them; type them at the edges.

## Naming

- `camelCase` for variables and functions, `PascalCase` for types and components, `SCREAMING_SNAKE_CASE` for true constants.
- Booleans read as predicates: `isReady`, `hasAccess`, `canRetry`.
- No abbreviations or single letters except trivial loop/lambda params.

## Comments

Write close to zero comments. Code, names, and types should explain themselves.

- Never restate what the code does.
- Never leave commented-out code, TODOs, or changelog notes.
- A comment is allowed only to explain a non-obvious *why*: a workaround, a deliberate edge case, a constraint that isn't visible in the code. When you write one, make it earn its place.
- Public APIs may carry a short JSDoc when consumers need it; keep it to intent, not mechanics.

## Don't

- No `any`, no non-null `!` to silence the compiler, no `@ts-ignore` without an adjacent reason.
- No default exports for modules with multiple concerns.
- No barrel files that obscure dependency graphs.
- No premature abstraction. Duplicate twice before extracting.

## Files

- All math related files go into `src/utils/math.ts`.

## Parser structure
This part of the documentation defines how files must be organized inside `/src/parsers/`.
- `constants.ts` must keep all the constants.
- `parsers.ts` the main parser class that inherits `Base Parser`.
- `types.ts` all types and interfaces.
- `utils.ts` all the utils functions so that `parsers.ts` can work.