"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import Chat, { UnitType, ValueChat, ValueForm } from "@/app/Chat";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ChatSectionProps = {};

const ChatSection = (props: ChatSectionProps) => {
  const [model, setModel] = useState("gpt-3.5-turbo-1106");
  const mutateGPT = useMutation({
    mutationFn: ({ messages }: { messages: any }) =>
      axios.post(
        "/api/postgres/chat-consult",
        {
          messages: messages,
          model: model,
        },
        {
          timeout: 60 * 1000,
        }
      ),
  });

  const [chats, setChats] = useState<ValueChat[]>([]);

  const onSubmit = async (data: ValueForm) => {
    if (data.message === "") return;
    const humanMessage = {
      content: data.message,
      role: "human" as UnitType,
    };

    setChats((prev) => [
      ...prev,
      humanMessage,
      {
        content: "",
        role: "ai" as UnitType,
        isLoading: true,
      },
    ]);

    mutateGPT.mutate(
      { messages: [...chats, humanMessage] },
      {
        onSuccess: async ({ data }) => {
          console.log(data);
          setChats((prev) => {
            const items = prev.slice(0, prev.length - 1);
            return [
              ...items,
              {
                content: data.content,
                role: "ai" as UnitType,
                isLoading: false,
              },
            ];
          });
        },
        onError: (error) => {
          setChats((prev) => {
            const items = prev.slice(0, prev.length - 1);
            return [
              ...items,
              {
                content: "Something went wrong :(",
                role: "ai" as UnitType,
                isLoading: false,
              },
            ];
          });
        },
      }
    );
  };

  return (
    <>
      <div className="my-2">
        <Select
          onValueChange={(e) => setModel(e)}
          defaultValue="gpt-3.5-turbo-1106"
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="gpt-3.5-turbo-1106">
                gpt-3.5-turbo-1106
              </SelectItem>
              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 mx-auto w-full bg-white border [box-shadow:5px_5px_rgb(82_82_82)] rounded-lg overflow-hidden p-2">
        <Chat
          chats={chats}
          onSubmit={onSubmit}
          disabledType={mutateGPT.isPending}
        />
      </div>
      <div className="my-6">
        <p className="text-lg font-bold">Context retriever</p>
        <div className="flex flex-col gap-2 divide-y-2">
          {mutateGPT?.data &&
            mutateGPT?.data?.data?.data?.context.map((e: any, i: any) => {
              const { pageContent, metadata } = e;
              return (
                <div key={i} className="flex flex-col gap-2 py-2">
                  <p className="text-sm">{pageContent}</p>
                  <p className="text-sm">{metadata?.source}</p>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};

export default ChatSection;
