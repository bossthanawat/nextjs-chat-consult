import { NextRequest, NextResponse } from "next/server";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";

import { ValueChat } from "@/app/Chat";

import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

import type { BaseMessage } from "@langchain/core/messages";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

import { StringOutputParser } from "@langchain/core/output_parsers";
import { VercelPostgres } from "@langchain/community/vectorstores/vercel_postgres";

import { pull } from "langchain/hub";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const model = (body.model || "gpt-3.5-turbo-1106") as string;
    const messages = body.messages as ValueChat[];

    //Chat Models
    const chat = new ChatOpenAI({
      // modelName: "gpt-3.5-turbo-1106",
      // modelName: "gpt-4o",
      modelName: model,
      temperature: 0.6,
    });

    // Chat History
    const ephemeralChatMessageHistory = new ChatMessageHistory();
    for (const message of messages) {
      if (message.role === "human") {
        await ephemeralChatMessageHistory.addMessage(
          new HumanMessage(message.content)
        );
      }
      if (message.role === "ai") {
        await ephemeralChatMessageHistory.addMessage(
          new AIMessage(message.content)
        );
      }
    }

    const vectorstore = await VercelPostgres.initialize(
      new OpenAIEmbeddings(),
      {}
    );

    await vectorstore.ensureTableInDatabase();

    // You are a helpful assistant. Only answer that relevant to context or answer AI gave earlier. Respond using markdown.
    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an assistant for a consultant. Please respond using Markdown format. Ensure your answer is based on the provided context. The context is: {context}.`
      ],
      new MessagesPlaceholder("messages"),
    ]);
    const retriever = vectorstore.asRetriever(6);

    const parseRetrieverInput = (params: { messages: BaseMessage[] }) => {
      return params.messages[params.messages.length - 1].content;
    };

    const documentChain = await createStuffDocumentsChain({
      llm: chat as any,
      prompt: questionAnsweringPrompt,
      outputParser: new StringOutputParser(),
    });

    const retrievalChain = RunnablePassthrough.assign({
      context: RunnableSequence.from([parseRetrieverInput, retriever]),
    }).assign({
      answer: documentChain,
    });

    const responseMessage = await retrievalChain.invoke({
      messages: await ephemeralChatMessageHistory.getMessages(),
    });

    return NextResponse.json({
      content: responseMessage?.answer,
      data: responseMessage,
    });
  } catch (e: any) {
    console.log("err", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
