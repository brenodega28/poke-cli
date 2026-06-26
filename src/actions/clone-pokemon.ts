import { readFileSync, writeFileSync } from "node:fs";
import { getParser } from "../parsers/decider";
import type { Pokemon } from "../pokemon/types";

export function clonePokemon(
  fromPath: string,
  toPath: string,
  options: Record<string, string>,
) {
  const originParser = getParser(readFileSync(fromPath));
  const destinationParser = getParser(readFileSync(toPath));
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

  const updated = destinationParser.writePokemonToBoxSlot({
    pokemon: pokemon as Pokemon,
    boxSlot: destinationParser.getEmptyBoxSlot(),
  });

  writeFileSync(options.out || toPath, updated);
}