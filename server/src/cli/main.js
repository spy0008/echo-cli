#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";

import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
dotenv.config();

async function main() {
  //display banner
  console.log(
    chalk.yellowBright(
      figlet.textSync("Echoo CLI", {
        font: "Standard",
        horizontalLayout: "default",
      }),
    ),
  );

  console.log(chalk.gray("A cli based AI Tool. \n"));

  const program = new Command("echoo");
  program
    .version("1.0.0")
    .description("Echoo CLI - A cli Based AI Tool.")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami);

  if (!process.argv.slice(2).length) {
    program.help();
  }

  program.parse(process.argv);
}

main().catch((err) => {
  console.log(chalk.red("Error while running echoo CLI: ", err));
  process.exit(1);
});
