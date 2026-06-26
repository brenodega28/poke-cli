#!/usr/bin/env node

import { Command } from "commander";
import { loadPokemonCommands } from "./commands/pokemon";
import { loadDebugCommands } from "./commands/debug";

const program = new Command();
program
  .name("poke-cli")
  .description("CLI tool to work with Pokémon saves")
  .version("1.0.0");
loadDebugCommands(program);
loadPokemonCommands(program);
program.parse(process.argv);
