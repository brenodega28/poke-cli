import { Command } from "commander";
import { getParser } from "../parsers/decider";

export function evolvePokemon(
  fromPath: string,
  options: Record<string, string>,
) {
  const parser = getParser(fromPath);
  const outFile = options.outFile ?? fromPath;

  if (!options.party && !options.box)
    throw Error("Must provide party or box location using -p or -b");

  if (options.party)
    parser.evolvePokemon({
        partySlot: parseInt(options.party),
        outFile: outFile
    });
  else {
    const boxPos: string[] = options.box!.split(",")
    parser.evolvePokemon({
        boxSlot: [parseInt(boxPos[0] ?? "0"), parseInt(boxPos[1] ?? "0")],
        outFile: outFile
    });
  }
}

export function loadCloneCommand(program: Command) {
  program
    .command("evolvePokemon")
    .description(
      "Evolves a Pokémon from a save file",
    )
    .argument("<from-path>", "Path to the origin savefile")
    .option("-o --out <VALUE>", "Output destination save file")
    .option("-p --party <VALUE>", "Gets Pokémon from party")
    .option(
      "-b --box <VALUE>",
      "Gets Pokémon from box in format [box, position]",
    )
    .action(async (fromPath, options) => {
      evolvePokemon(fromPath, options);
    });
}
