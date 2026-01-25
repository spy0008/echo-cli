import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import * as z from "zod/v4";
import dotenv from "dotenv";
import prisma from "../../../lib/db.js";
import path from "path";
import os from "os";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import fs from "node:fs/promises";
import chalk from "chalk";
import open from "open";
dotenv.config();

const URL = process.env.BASE_URL;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts) {
  const options = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });

  const serverUrl = options.serverUrl || URL;
  const clientId = options.clientId || CLIENT_ID;

  intro(chalk.bold("🔒 Auth CLI Login"));

  //TODO: chnage this with token management utils
  const existingToken = false;
  const expired = false;

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already loggedIn. Do You Want To Login Again?",
      initialValue: false,
    });

    if (isCancel(shouldReAuth) && !shouldReAuth) {
      cancel("Login Cancelled.");
      process.exit(0);
    }
  }

  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yoctoSpinner({
    text: "Requesting device authrization...",
  });

  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });

    spinner.stop();

    if (error || !data) {
      logger.error(
        `Failed to request device authorization: ${error.error_description}`,
      );

      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      expires_in,
      interval = 5,
    } = data;

    console.log(chalk.yellowBright("Device Authorization Requered"));

    console.log(
      `Please visit ${chalk.underline.blueBright(verification_uri || verification_uri_complete)}`,
    );

    console.log(`Enter Code: ${chalk.bold.yellow(user_code)}`);

    const shouldOpen = await confirm({
      message: "Open browser authentically",
      initialValue: true,
    });

    if (!isCancel(shouldOpen) && shouldOpen) {
      const urlToOpen = verification_uri || verification_uri_complete;
      await open(urlToOpen);
    }

    console.log(
      chalk.gray(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60,
        )} minutes)...`,
      ),
    );
  } catch (error) {}
}

//COMMANDER SETUP --

export const login = new Command("login")
  .description("Login To Better Auth")
  .option("--server-url <url>", "The Better Auth Server URL", URL)
  .option("--client-id <id>", "The OAuth Client ID", CLIENT_ID)
  .action(loginAction);
