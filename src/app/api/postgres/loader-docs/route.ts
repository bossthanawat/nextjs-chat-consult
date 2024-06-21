import { NextRequest, NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { VercelPostgres } from "@langchain/community/vectorstores/vercel_postgres";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function GET(request: NextRequest) {
  try {
    const vercelPostgresStore = await VercelPostgres.initialize(
      new OpenAIEmbeddings(),
      {}
    );

    await vercelPostgresStore.ensureTableInDatabase();

    const urls = [
      "https://www.everydaymarketing.co/pr/line-man-wongnai-marketing-creates-environmentally-friendly-containers-join-hands-with-4-partners-give-a-special-discount/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/mcdonalds-marketing-give-promotions-to-customers-for-throwing-garbage-right-place-to-preserve-the-environment/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/the-marketing-war-between-pizza-company-and-pizza-hut/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/heinz-marketing-campaign-invites-food-stylists-to-show-that-ketchup-needs-no-spruce-up/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/pressbyran-marketing-innovates-transition-hot-dog-campaign/",
      "https://www.everydaymarketing.co/pr/marketing-the-pizza-company-x-central-pattana-targets-families/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/wholegreen-bekery-im-sydney-creates-awareness-of-customers-perspectives-on-gluten/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/arroz-super-extra-marketing-campaign-turns-rice-grains-into-golden-tickets/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/food/britannia-good-day-marketing-campaign-wins-the-hearts-of-gen-z/",
      "https://www.everydaymarketing.co/business-and-marketing-case-study/kfc-marketing-the-recipe-run-wins-hearts-gamer-create-trend-around-the-world/",
    ];

    const docs = [];

    for (const url of urls) {
      const loader = new CheerioWebBaseLoader(url);
      const loadedDocs = await loader.load();
      docs.push(...loadedDocs);
    }

    // RecursiveCharacterTextSplitter, TokenTextSplitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splits = await textSplitter.splitDocuments(docs);

    await vercelPostgresStore.addDocuments(splits);

    // const results = await typeormVectorStore.similaritySearch("hello", 2);

    return NextResponse.json({
      message: "success",
    });
  } catch (e: any) {
    console.log("err", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
