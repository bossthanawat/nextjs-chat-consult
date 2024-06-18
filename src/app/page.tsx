"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChatSection from "./ChatSection";
import { useState } from "react";

export default function Home() {
  const [model, setModel] = useState("");
  return (
    <div className="container mt-20">
      <h3 className="text-xl md:text-3xl font-medium">Chat Consultant</h3>
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
        <ChatSection modelName={model} />
      </div>
    </div>
  );
}
