import { Command } from "commander";
import { evolvePokemon } from "../actions/evolve-pokemon";
import { clonePokemon } from "../actions/clone-pokemon";

export function loadPokemonCommands(program: Command) {
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

  program
    .command("evolvePokemon")
    .description("Evolves a Pokémon from a save file")
    .argument("<from-path>", "Path to the origin savefile")
    .option("-o --out <VALUE>", "Output destination save file")
    .option("-p --party <VALUE>", "Gets Pokémon from party")
    .option(
      "-s --specieid <VALUE>",
      "Specify the species to evolve to for branching evolutions",
    )
    .option(
      "-b --box <VALUE>",
      "Gets Pokémon from box in format [box, position]",
    )
    .action(async (fromPath, options) => {
      evolvePokemon(fromPath, options);
    });
}
