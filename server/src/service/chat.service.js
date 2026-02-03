import prisma from "../lib/db.js";

export class ChatService {
  /**
   * create a new conversation
   * @param {string} userId
   * @param {string} mode
   * @param {string} title
   */

  async createConversation(userId, mode = "chat", title = null) {
    return prisma.conversation.create({
      data: {
        userId,
        mode,
        title: title || `New ${mode} Conversation`,
      },
    });
  }

  /**
   * get or create a conversation for user
   * @param {string} userId
   * @param {string} conversationId
   * @param {string} mode
   */

  async getOrCreateConversation(userId, conversationId = null, mode = "chat") {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (conversation) {
        return conversation;
      }
    }

    return await this.createConversation(userId, mode);
  }

  /**
   * add a message to conversation
   * @param {string} conversationId
   * @param {string} role
   * @param {string|object} content
   */

  async addMessage(conversationId, role, content) {
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);

    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content: contentStr,
      },
    });
  }

  /**
   * get conversation messages
   * @param {string} conversationId
   */

  async getMessages(conversationId) {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((msg) => ({
      ...msg,
      content: this.parseContent(msg.content),
    }));
  }

  /**
   * Get all conversations for a user
   * @param {string} userId
   */

  async getUserConversation(userId) {
    return await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * delete a conversation
   * @param {string} conversationId
   * @param {string} userId
   */

  async deleteConversation(conversationId, userId) {
    return await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });
  }

  /**
   * create a new conversation
   * @param {string} conversationId
   * @param {string} title
   */
  async updateTitle(conversationId, title) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Helper to parse content (JSON or string)
   */

  parseContent(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      return content;
    }
  }

  /**
   * Format message for AI SDK
   * @param {Array} messages
   */

  formatMessageForAI(messages) {
    return messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));
  }
}
