// Library entry point. Re-exports the public API so the package can be used
// programmatically. The CLI lives in `cli.ts` (the `poke-cli` bin).

// Actions — high-level, path-based operations (read a save, write the result).
export { clonePokemon } from "./actions/clone-pokemon";
export { evolvePokemon } from "./actions/evolve-pokemon";
export { getBox } from "./actions/get-box";
export { getParty } from "./actions/get-party";
export { getEmptyBoxSlot } from "./actions/get-empty-box-slot";

// Parser — low-level, bytes-in/bytes-out API (browser-safe, no filesystem).
export { getParser } from "./parsers/decider";
export { BaseParser } from "./parsers/base";
export type { EvolvePokemonArgs, WritePokemonToBoxSlotArgs } from "./parsers/base";
export { Gen4Parser } from "./parsers/gen4/parser";

// Domain types.
export type * from "./pokemon/types";
