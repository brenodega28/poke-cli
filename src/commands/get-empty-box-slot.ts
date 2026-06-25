import { Command } from "commander";
import { getParser } from "../parsers/decider";

export function loadGetEmptyBoxSlot(program: Command) {
  program
    .command("getEmptyBoxSlot")
    .description("Returns the closest empty box slot in form [boxID, slot]")
    .argument('<path>', 'Path to the savefile')
    .action(async (path) => {
      const parser = getParser(path)

      console.log(parser.getEmptyBoxSlot())
    });
}
