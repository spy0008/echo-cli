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
import chalk from "chalk";
import open from "open";
import {
  clearStoredToken,
  getStoredToken,
  isTokenExpired,
  requeredAuth,
  storeToken,
} from "../../../lib/token.js";
dotenv.config();

const URL = process.env.BASE_URL;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts) {
  const options = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });

  const serverUrl = options.serverUrl || URL;
  const clientId = options.clientId || CLIENT_ID;

  intro(chalk.bold("🔒 Auth CLI Login"));

  //TODO: chnage this with token management utils
  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

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
      const urlToOpen = verification_uri_complete || verification_uri;
      await open(urlToOpen);
    }

    console.log(
      chalk.gray(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60,
        )} minutes)...`,
      ),
    );

    const token = await pollForToken(
      authClient,
      device_code,
      clientId,
      interval,
    );

    if (token) {
      const saved = await storeToken(token);

      if (!saved) {
        console.log(
          chalk.yellow("\n Warning: Could not save authentication token."),
        );

        console.log(chalk.yellow("You may need to login again on next use."));
      }

      //get user data

      outro(chalk.greenBright("Login successfull!!!"));

      console.log(chalk.gray(`\n Token saved to ${TOKEN_FILE}`));

      console.log(
        chalk.yellow("You can now use AI commands without logging in again.\n"),
      );
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red("\nLogin Failed: "), error.message);
  }
}

async function pollForToken(
  authClient,
  deviceCode,
  clientId,
  initialIntervalValue,
) {
  let pollingInterval = initialIntervalValue;
  const spinner = yoctoSpinner({
    text: "",
    color: "yellow",
  });
  let dots = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      dots = (dots + 1) % 4;
      spinner.text = chalk.gray(
        `Polliing for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`,
      );
      if (!spinner.isSpinning) spinner.start();

      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
          fetchOptions: {
            headers: {
              "user-agent": `My CLI`,
            },
          },
        });

        if (data?.access_token) {
          console.log(
            chalk.bold.yellow(`Your access token: ${data.access_token}`),
          );

          spinner.stop();
          resolve(data);
          return;
        } else if (error) {
          switch (error.error) {
            case "authorization_pending":
              break;
            case "slow_down":
              pollingInterval += 5;
              console.log(`⚠️  Slowing down polling to ${pollingInterval}s`);
              break;
            case "access_denied":
              console.error("❌ Access was denied by the user");
              process.exit(1);
            case "expired_token":
              console.error(
                "❌ The device code has expired. Please try again.",
              );
              process.exit(1);
            default:
              spinner.stop();
              logger.error("❌ Error:", error.error_description);
              process.exit(1);
          }
        }
      } catch (error) {
        spinner.stop();
        console.error("❌ Network error:", err.message);
        process.exit(1);
      }

      setTimeout(poll, pollingInterval * 1000);
    };

    setTimeout(poll, pollingInterval * 1000);
  });
}

export async function logoutAction() {
  intro(chalk.bold("Logout dude?"));

  const token = await getStoredToken();

  if (!token) {
    console.log(chalk.yellow("You're not logged in."));
    process.emit(0);
  }

  const shouldLogout = await confirm({
    message: "Are you sure dude, you want to logout?",
    initialValue: false,
  });

  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel("Logout cancelled");
    process.emit(0);
  }

  const cleared = await clearStoredToken();

  if (cleared) {
    outro(chalk.greenBright("Successfully logged out!, see you leter dude."));
  } else {
    console.log(chalk.yellow("Could not clear token file."));
  }
}

export async function whoamiAction() {
  const token = await requeredAuth();

  if (!token?.access_token) {
    console.log("No access token found, Please login.");
    process.emit(1);
  }

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

  //output user session info
  console.log(
    chalk.bold.yellowBright(
      `\n User: ${user.name} \n Email: ${user.email} \n ID: ${user.id}`,
    ),
  );
}

//COMMANDER SETUP --

export const login = new Command("login")
  .description("Login To Better Auth")
  .option("--server-url <url>", "The Better Auth Server URL", URL)
  .option("--client-id <id>", "The OAuth Client ID", CLIENT_ID)
  .action(loginAction);

export const logout = new Command("logout")
  .description("Logout and clear stored credentials.")
  .action(logoutAction);

export const whoami = new Command("whoami")
  .description("Show current authenticated user.")
  .option("--server-url <url>", "The Better Auth Server URL", URL)
  .action(whoamiAction);
