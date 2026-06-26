import { Command } from "commander";
import { getParty } from "../actions/get-party";
import { getBox } from "../actions/get-box";
import { getEmptyBoxSlot } from "../actions/get-empty-box-slot";

export function loadGetCommands(program: Command) {
  program
    .command("get-party")
    .description("Reads an active party pokemon from a savefile")
    .argument("<path>", "Path to the savefile")
    .option("-i --index <index>", "Pokemon party index")
    .action(getParty);

  program
    .command("get-box")
    .description("Reads all pokemon from a box")
    .argument("<path>", "Path to the savefile")
    .argument("<box-index>", "Box index")
    .action(getBox);

  program
    .command("get-empty-box-slot")
    .description("Returns the closest empty box slot in form [boxID, slot]")
    .argument("<path>", "Path to the savefile")
    .action(getEmptyBoxSlot);
}
