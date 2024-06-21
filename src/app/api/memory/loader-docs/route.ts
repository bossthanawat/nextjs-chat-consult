import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { writeFile } from "fs";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const urls = [
      "https://www.everydaymarketing.co/knowledge/brazilian-flash-marketing-uses-contextual-marketing-to-win-consumers/",
      "https://www.everydaymarketing.co/knowledge/heineken-marketing-promotes-misbranding-but-sales-increase-32/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/furniture/ikea-guilty-pets-marketing-campaign-wins-the-hearts-of-animal-lovers/",
    ];

    const docs = [];

    for (const url of urls) {
      const loader = new CheerioWebBaseLoader(url);
      const loadedDocs = await loader.load();
      docs.push(...loadedDocs);
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splits = await textSplitter.splitDocuments(docs);
    const loaderDocsPath = path.join(process.cwd(), "src/app/api/memory/loader-docs");
    const filePath = path.join(loaderDocsPath, "allSplits.json");
    await writeFile(
      filePath,
      JSON.stringify(splits, null, 2),
      {},
      (data) => {}
    );

    return NextResponse.json({
      message: "success",
    });
  } catch (e: any) {
    console.log("err", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
