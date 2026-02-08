import { config } from "../../config/google.config.js";
import { google } from "@ai-sdk/google";
import { generateObject, streamText } from "ai";
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

      if (tools && Object.keys(tools).length > 0) {
        streamConfig.tools = tools;
        streamConfig.maxSteps = 5;

        console.log(
          chalk.gray(`[DEBUG] Tools enabled: ${Object.keys(tools).join(", ")}`),
        );
      }

      const result = streamText(streamConfig);

      let fullResponse = "";

      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      const fullResult = result;

      const toolCalls = [];
      const toolResults = [];

      if (fullResult.steps && Array.isArray(fullResult.steps)) {
        for (const step of fullResult.steps) {
          if (step.toolCalls && step.toolCalls.length > 0) {
            for (const toolCall of step.toolCalls) {
              toolCalls.push(toolCall);
              if (onToolCall) {
                onToolCall(toolCall);
              }
            }
          }
          if (step.toolResults && step.toolResults.length > 0) {
            toolResults.push(...step.toolResults);
          }
        }
      }

      return {
        content: fullResponse,
        finishResponse: fullResult.finishReason,
        usage: fullResult.usage,
        toolCalls,
        toolResults,
        steps: fullResult.steps,
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

    const result = await this.sendMessage(
      messages,
      (chunk) => {
        fullResponse += chunk;
      },
      tools,
    );

    return result.content;
  }

  /**
   * Generate structured output using zod schema
   * @param {Object} schema
   * @param {String} prompt
   * @param {Promise<Object>}
   */

  async generateStructured(schema, prompt) {
    try {
      const result = await generateObject({
        model: this.model,
        schema: schema,
        prompt: prompt,
      });

      return result.object;
    } catch (error) {
      console.error(
        chalk.red("AI Structured Generation Error:"),
        error.message,
      );
      throw error;
    }
  }
}
