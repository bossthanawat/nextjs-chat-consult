import { NextRequest, NextResponse } from "next/server";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";

import { ValueChat } from "@/app/Chat";

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

import type { BaseMessage } from "@langchain/core/messages";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

import { allSplits } from "./allSplits";

import { StringOutputParser } from "@langchain/core/output_parsers";

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
      temperature: 0.4,
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

    const vectorstore = await MemoryVectorStore.fromDocuments(
      allSplits,
      new OpenAIEmbeddings()
    );
    // You are a helpful assistant. Only answer that relevant to context or answer AI gave earlier. Respond using markdown.
    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are an assistant for consultant. Use the following pieces of retrieved context to answer the question. Please respond using Markdown format. Context:{context}. ",
      ],
      new MessagesPlaceholder("messages"),
    ]);

    const retriever = vectorstore.asRetriever(4);

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
    });
  } catch (e: any) {
    console.log("err", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
