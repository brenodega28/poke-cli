import { Command } from "commander";
import { getParser } from "../parsers/decider";
import type { Pokemon } from "../pokemon/types";

export function clonePokemon(
  fromPath: string,
  toPath: string,
  options: Record<string, string>,
) {
  const originParser = getParser(fromPath);
  const destinationParser = getParser(toPath);
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

  destinationParser.writePokemonToBoxSlot({
    pokemon: pokemon as Pokemon,
    boxSlot: destinationParser.getEmptyBoxSlot(),
    outFile: options.out || toPath,
  });
}

export function loadCloneCommand(program: Command) {
  program
    .command("clonePokemon")
    .description(
      "Clones a Pokémon from a save file to another in the closest available box position",
    )
    .argument("<from-path>", "Path to the origin savefile")
    .argument("<to-path>", "Path to the destination savefile")
    .option("-o --out <VALUE>", "Output destination save file")
    .option("-p --party <VALUE>", "Gets Pokémon from party")
    .option(
      "-b --box <VALUE>",
      "Gets Pokémon from box in format [box, position]",
    )
    .action(async (fromPath, toPath, options) => {
      clonePokemon(fromPath, toPath, options);
    });
}
