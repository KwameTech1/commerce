import OpengraphImage from "components/opengraph-image";
import { getCollection } from "lib/data";
import { notFound } from "next/navigation";

export default async function Image({
  params,
}: {
  params: { collection: string };
}) {
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  const title = collection.seo?.title || collection.title;

  return await OpengraphImage({ title });
}
