#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";

import { Command } from "commander";
import { login } from "./commands/auth/login.js";
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
    .addCommand(login);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((err) => {
  console.log(chalk.red("Error while running echoo CLI: ", err));
  process.exit(1);
});
