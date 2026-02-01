import { config } from "../../config/google.config.js";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import chalk from "chalk";

export class AIService {
  constructor() {
    if (!config.googleApuKey) {
      throw new Error("Unable to read GOOGLE API KEY.");
    }

    this.model = google(config.model, {
      apikey: config.googleApuKey,
    });
  }

  /**
   * send a message and get a streaming response
   * @param {Array} messages
   * @param {Function} onChunk
   * @param {Object} tools
   * @param {Function} onToolCall
   * @returns {Promise<Object>}
   *
   */

  async sendMessage(messages, onChunk, tools = undefined, onToolCall = null) {
    try {
      const streamConfig = {
        model: this.model,
        messages: messages,
      };

      const result = streamText(streamConfig);

      let fullResponse = "";

      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      const fullResult = result;

      return {
        content: fullResponse,
        finishResponse: fullResult.finishReason,
        usage: fullResult.usage,
      };
    } catch (error) {
      console.error(chalk.red("AI Service Error: ", error.message));
      throw error;
    }
  }

  /**
   * get a non-streaming response
   * @param {Array} messages
   * @param {Object} tools
   * @returns {Promise<string>}
   */

  async getMessage(messages, tools = undefined) {
    let fullResponse = "";

    await this.sendMessage(messages, (chunk) => {
      fullResponse += chunk;
    });

    return fullResponse;
  }
}
