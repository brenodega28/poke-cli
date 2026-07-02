import { getParser } from "../parsers/decider";
import type { Pokemon } from "../pokemon/types";

/**
 * Copy a Pokémon out of `origin` into the nearest empty box slot of
 * `destination`. Returns the updated `destination` save bytes.
 */
export function clonePokemon(
  origin: Uint8Array,
  destination: Uint8Array,
  options: Record<string, string>,
): Uint8Array {
  const originParser = getParser(origin);
  const destinationParser = getParser(destination);
  if (!options.party && !options.box)
    throw Error("Must provide party or box location using -p or -b");
  let pokemon;
  if (options.party)
    pokemon = originParser.readParty()[parseInt(options.party)];
  else {
    const [boxID, position]: string[] = (options.box || "0,0").split(",");
    pokemon = originParser.readBox(parseInt(boxID || "0"))[
      parseInt(position || "0")
    ];
  }

  return destinationParser.writePokemonToBoxSlot({
    pokemon: pokemon as Pokemon,
    boxSlot: destinationParser.getEmptyBoxSlot(),
  });
}
