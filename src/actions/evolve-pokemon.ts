import { readFileSync, writeFileSync } from "node:fs";
import type { EvolvePokemonArgs } from "../parsers/base";
import { getParser } from "../parsers/decider";

export async function evolvePokemon(
  fromPath: string,
  options: Record<string, string>,
) {
  const parser = getParser(readFileSync(fromPath));
  const outFile = options.out ?? fromPath;

  if (!options.party && !options.box)
    throw Error("Must provide party or box location using -p or -b");

  let updated: Uint8Array;
  if (options.party)
    updated = await parser.evolvePokemon({
        partySlot: parseInt(options.party),
    });
  else {
    const boxPos: string[] = options.box!.split(",")
    const args: EvolvePokemonArgs = {
        boxSlot: [parseInt(boxPos[0] ?? "0"), parseInt(boxPos[1] ?? "0")],
    }

    if(options.specieid){
        args.speciesID = parseInt(options.specieid)
    }

    updated = await parser.evolvePokemon(args);
  }

  writeFileSync(outFile, updated);
}