#!/usr/bin/env node

import { Command } from "commander";
import { loadReadPartyCommand } from "./commands/read-party";
import { loadReadBoxCommand } from "./commands/read-box";
import { loadGetEmptyBoxSlot } from "./commands/get-empty-box-slot";
import { loadCloneCommand } from "./commands/clone-pokemon";

const program = new Command();
program
.name('poke-cli')
.description('CLI tool to work with Pokémon saves')
.version('1.0.0');
loadReadPartyCommand(program);
loadReadBoxCommand(program);
loadGetEmptyBoxSlot(program);
loadCloneCommand(program);
program.parse(process.argv);