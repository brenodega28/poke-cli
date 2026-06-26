#!/usr/bin/env node

import { Command } from "commander";
import { loadCloneCommand } from "./commands/clone-pokemon";
import { loadDebugCommands } from "./commands/debug";

const program = new Command();
program
  .name("poke-cli")
  .description("CLI tool to work with Pokémon saves")
  .version("1.0.0");
loadDebugCommands(program);
loadCloneCommand(program);
program.parse(process.argv);
