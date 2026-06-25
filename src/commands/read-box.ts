import { Command } from "commander";
import { getParser } from "../parsers/decider";

export function loadReadBoxCommand(program: Command) {
  program
    .command("readBox")
    .description("Reads all pokemon from a box")
    .argument('<path>', 'Path to the savefile')
    .argument('<box-index>', 'Box index')
    .action(async (path, boxIndex) => {
      const parser = getParser(path)
      const box = parser.readBox(parseInt(boxIndex))
      
      box.forEach(async (pokemon) =>{
        await parser.printPokemon(pokemon)
      })
    });
}
