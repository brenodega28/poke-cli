import { Command } from "commander";
import { getParser } from "../parsers/decider";

export function loadDebugCommands(program: Command) {
  program
    .command("readParty")
    .description("Reads an active party pokemon from a savefile")
    .argument("<path>", "Path to the savefile")
    .option("-i --index <index>", "Pokemon party index")
    .action(async (path, options) => {
      const parser = getParser(path);
      const party = parser.readParty();
      const index = options.index;

      if (index) {
        const pokemon = index <= party.length ? party[index] : undefined;

        if (!pokemon) {
          console.log("No Pokémon at index", index);
          return;
        }

        await parser.printPartyPokemon(pokemon);
        return;
      }

      party.forEach(async (pokemon) => {
        await parser.printPartyPokemon(pokemon);
      });
    });

  program
    .command("readBox")
    .description("Reads all pokemon from a box")
    .argument("<path>", "Path to the savefile")
    .argument("<box-index>", "Box index")
    .action(async (path, boxIndex) => {
      const parser = getParser(path);
      const box = parser.readBox(parseInt(boxIndex));

      box.forEach(async (pokemon, i) => {
        await parser.printBoxPokemon(pokemon, [boxIndex, i]);
      });
    });

  program
    .command("getEmptyBoxSlot")
    .description("Returns the closest empty box slot in form [boxID, slot]")
    .argument("<path>", "Path to the savefile")
    .action(async (path) => {
      const parser = getParser(path);

      console.log(parser.getEmptyBoxSlot());
    });
}
