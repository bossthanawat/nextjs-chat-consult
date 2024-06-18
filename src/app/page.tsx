"use client";

import ChatSection from "./ChatSection";
import { useState } from "react";

export default function Home() {
  return (
    <div className="container mt-20">
      <h3 className="text-xl md:text-3xl font-medium">Chat Consultant</h3>

      <ChatSection />
    </div>
  );
}
