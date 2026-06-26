import type { EvolvePokemonArgs } from "../parsers/base";
import { getParser } from "../parsers/decider";

export async function evolvePokemon(
  fromPath: string,
  options: Record<string, string>,
) {
  const parser = getParser(fromPath);
  const outFile = options.out ?? fromPath;

  if (!options.party && !options.box)
    throw Error("Must provide party or box location using -p or -b");

  if (options.party)
    await parser.evolvePokemon({
        partySlot: parseInt(options.party),
        outFile: outFile
    });
  else {
    const boxPos: string[] = options.box!.split(",")
    const args: EvolvePokemonArgs = {
        boxSlot: [parseInt(boxPos[0] ?? "0"), parseInt(boxPos[1] ?? "0")],
        outFile: outFile,
    }

    if(options.specieid){
        args.speciesID = parseInt(options.specieid)
    }

    await parser.evolvePokemon(args);
  }
}