import type { EvolvePokemonArgs } from "../parsers/base";
import { getParser } from "../parsers/decider";

/**
 * Evolve the selected party or box Pokémon in `save`. Returns the updated
 * save bytes.
 */
export async function evolvePokemon(
  save: Uint8Array,
  options: Record<string, string>,
): Promise<Uint8Array> {
  const parser = getParser(save);

  if (!options.party && !options.box)
    throw Error("Must provide party or box location using -p or -b");

  if (options.party)
    return parser.evolvePokemon({ partySlot: parseInt(options.party) });

  const boxPos: string[] = options.box!.split(",");
  const args: EvolvePokemonArgs = {
    boxSlot: [parseInt(boxPos[0] ?? "0"), parseInt(boxPos[1] ?? "0")],
  };

  if (options.specieid) {
    args.speciesID = parseInt(options.specieid);
  }

  return parser.evolvePokemon(args);
}
