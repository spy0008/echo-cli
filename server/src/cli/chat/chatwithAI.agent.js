import chalk from "chalk";
import boxen from "boxen";
import {
  text,
  isCancel,
  cancel,
  intro,
  confirm,
  outro,
} from "@clack/prompts";
import yoctoSpinner from "yocto-spinner";
import { AIService } from "../ai/google.service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../../lib/token.js";
import prisma from "../../lib/db.js";
import { generateApplication } from "../../config/agent.config.js";

const aiService = new AIService();
const chatService = new ChatService();

async function getUserFromToken() {
  const token = await getStoredToken();

  if (!token.access_token) {
    throw new Error("Not authenticated, Please run 'echoo login' first.");
  }

  const spinner = yoctoSpinner({
    text: "Authenticating...",
  }).start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.access_token },
      },
    },
  });

  if (!user) {
    spinner.error("User not found");
    throw new Error("User not found, Please login again.");
  }

  spinner.success(`Welcome back, ${user.name}`);

  return user;
}

async function initConversation(userId, conversationId = null, mode = "agent") {

  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode,
  );

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n` +
      `${chalk.gray("ID:")} ${conversation.id}\n` +
      `${chalk.gray("Mode:")} ${chalk.blue("Agent (Code Generator)")}\n` +
      `${chalk.yellow("Working Directory:")} ${process.cwd()}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "yellow",
      title: "Agent Mode",
      titleAlignment: "center",
    },
  );

  console.log(conversationInfo);

  return conversation;
}

async function saveMessage(conversationId, role, content) {
  return await chatService.addMessage(conversationId, role, content);
}

async function agentLoop(conversation) {
  const helpBox = boxen(
    `${chalk.yellow.bold("what can the agent do?")}\n\n` +
      `${chalk.gray("* Generate complete application from descriptions")}\n` +
      `${chalk.gray("* Create all necessary files and folders")}\n` +
      `${chalk.gray("* Include setup instructions and commands")}\n` +
      `${chalk.gray("* Generate production-ready code")}\n\n` +
      `${chalk.yellow.bold("Examples")}\n` +
      `${chalk.white('* "Build a todo app with React and Tailwind"')}\n` +
      `${chalk.white('* "Create a REST API with Express and MongoDB"')}\n` +
      `${chalk.white('* "Make a weather app using OpenWeatherMap API"')}\n\n` +
      `${chalk.gray('Type "exit" to end the session')}\n`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "yellow",
      title: "Agent Instructions",
    },
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.blue("What would you like to build today?"),
      placeholder: "Describe your application...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Description connot be empty";
        }

        if (value.trim().length < 10) {
          return "Please provide more detailed (at least 10 charactors)";
        }
      },
    });

    if (isCancel(userInput)) {
      console.log(chalk.yellow("\n Agent session cancelled\n"));
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      console.log(chalk.yellow("\n Agent session cancelled\n"));
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 Your Request",
    });
    console.log(userBox);

    await saveMessage(conversation.id, "user", userInput);

    try {
      const result = await generateApplication(
        userInput,
        aiService,
        process.cwd(),
      );

      if (result && result.success) {
        const responseMessage =
          `Generated application: ${result.folderName}\n` +
          `Files created: ${result.files.length}\n` +
          `Location: ${result.appDir}\n\n` +
          `Setup command:\n${result.commands.join("\n")}`;

        await saveMessage(conversation.id, "assistant", responseMessage);

        const continuePrompt = await confirm({
          message: chalk.yellow(
            "Would you like to generate another application?",
          ),
          initialValue: false,
        });

        if (isCancel(continuePrompt) || !continuePrompt) {
          console.log(chalk.yellow("\n Great! Check your new application.\n"));
          break;
        }
      } else {
        throw new Error("Generation returned no result");
      }
    } catch (error) {
      console.log(chalk.red(`\n Error: ${error.message}`));

      await saveMessage(
        conversation.id,
        "assistant",
        `Error: ${error.message}`,
      );

      const retry = await confirm({
        message: chalk.yellow("Would you like to try again?"),
        initialValue: true,
      });

      if (isCancel(retry) || !retry) {
        break;
      }
    }
  }
}

export async function startAgentChat(conversationId = null) {
  try {
    intro(
      boxen(
        chalk.bold.yellow("Echoo AI - Agent Mode\n\n") +
          chalk.gray("Autonomous Application Generator"),
        {
          padding: 1,
          borderStyle: "double",
          borderColor: "yellow",
        },
      ),
    );

    const user = await getUserFromToken();

    const shouldContinue = await confirm({
      message: chalk.yellow(
        "⚠️ The agent will create files and folders in the current direactory. continue?",
      ),
      initialValue: true,
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel(chalk.yellow("Agent mode cancelled"));
      process.exit(0);
    }

    const conversation = await initConversation(
      user.id,
      conversationId,
      "agent",
    );

    await agentLoop(conversation);

    outro(chalk.green("✨ Thanks For using Agent Mode, See you leter."));
  } catch (error) {
    const errorBox = boxen(chalk.bold.red(`Error: ${error.message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    });
    console.log(errorBox);
    process.exit(1);
  }
}
