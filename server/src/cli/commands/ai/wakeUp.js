import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../../../lib/token.js";
import prisma from "../../../lib/db.js";
import { select } from "@clack/prompts";
import { startChat } from "../../chat/chatWithAI.js";
import { startToolChat } from "../../chat/chatWithAI.tool.js";

const wakeUpAction = async () => {
  const token = await getStoredToken();

  if (!token.access_token) {
    console.log(chalk.red("Not Authenticated. Please Login."));
    return;
  }

  const spinner = yoctoSpinner({
    text: "Fething user information...",
  });

  spinner.start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  spinner.stop();

  if (!user) {
    console.log(chalk.red("User not found."));
    return;
  }

  console.log(chalk.green(`Welcome back, ${user.name}!\n`));

  const choice = await select({
    message: "Select AI Mode:",
    options: [
      {
        value: "chat",
        label: "Chat",
        hint: "Simple chat with AI",
      },
      {
        value: "tool",
        label: "Tool Calling",
        hint: "Chat with tools (Google Search, Code Execution)",
      },
      {
        value: "agent",
        label: "Agentic Mode",
        hint: "Advanced AI agent (Coming soon)",
      },
    ],
  });

  switch (choice) {
    case "chat":
      await startChat("chat");
      break;
    case "tool":
      await startToolChat();
      break;
    case "agent":
      console.log(chalk.yellow("Agentic mode coming soon"));
      break;
  }
};

export const wakeUp = new Command("wekeup")
  .description("Wake up the ai.")
  .action(wakeUpAction);
