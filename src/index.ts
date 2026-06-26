#!/usr/bin/env bun

import { Command } from "commander";
import { loadMutationCommands } from "./commands/mutations";
import { loadGetCommands } from "./commands/getters";

const program = new Command();
program
  .name("poke-cli")
  .description("CLI tool to work with Pokémon saves")
  .version("1.0.0");
loadGetCommands(program);
loadMutationCommands(program);
program.parse(process.argv);
