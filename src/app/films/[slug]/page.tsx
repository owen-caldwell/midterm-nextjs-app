import { defineQuery, PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import dotenv from "dotenv";
dotenv.config();

const options = { next: { revalidate: 60 } };

const FILM_QUERY = defineQuery(`*[
    _type == "film" &&
    slug.current == $slug
  ][0]{
  ...,
  "date": coalesce(date, now()),
  "doorsOpen": coalesce(doorsOpen, 0),
  image->,
  vimeo,
}`);

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

export default async function FilmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const film = await client.fetch(FILM_QUERY, await params, options);
  if (!film) {
    notFound();
  }
  const { title, date, headline, image, details, filmType, doorsOpen, vimeo } =
    film;
  const filmImageUrl = image
    ? urlFor(image)?.width(550).height(310).url()
    : null;
  const filmDate = new Date(date).toDateString();
  const filmTime = new Date(date).toLocaleTimeString();
  const doorsOpenTime = new Date(
    new Date(date).getTime() - doorsOpen * 60000
  ).toLocaleTimeString();
  console.log("VIMEO:", vimeo);
  const formattedVimeo = vimeo.split("/").pop();
  let Vimeo = require("vimeo").Vimeo;
  let vimClient = new Vimeo(
    process.env.VIMEO_CLIENT_ID,
    process.env.VIMEO_CLIENT_SECRET,
    process.env.VIMEO_ACCESS_TOKEN
  );

  async function fetchVimeoData(videoId: string) {
    return new Promise((resolve, reject) => {
      vimClient.request(
        {
          method: "GET",
          path: `/videos/${videoId}`,
        },
        function (error: any, body: any, status_code: number, headers: any) {
          if (error) {
            console.log("VIMEO:", error);
            reject(error);
          } else {
            console.log("VIMEO BODY:", body);
            resolve(body);
          }
        }
      );
    });
  }

  const vimeoData = await fetchVimeoData(formattedVimeo);
  console.log("data:", vimeoData);
  let videoEmbed = vimeoData?.player_embed_url;
  let vimeoDetails = vimeoData?.description;
  if (typeof vimeoDetails === 'string') {
    vimeoDetails = [{ _type: 'block', children: [{ _type: 'span', text: vimeoDetails }] }];
  }
  return (
    <main className="container mx-auto grid gap-12 p-12">
      <div className="mb-4">
        <Link href="/">← Back to films</Link>
      </div>
      <div className="grid items-top gap-12 sm:grid-cols-2">
        <iframe src={videoEmbed}></iframe>
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-4">
            {filmType ? (
              <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800 capitalize">
                {filmType.replace("-", " ")}
              </div>
            ) : null}
            {title ? (
              <h1 className="text-4xl font-bold tracking-tighter mb-8">
                {title}
              </h1>
            ) : null}
            <dl className="grid grid-cols-2 gap-1 text-sm font-medium sm:gap-2 lg:text-base">
              <dd className="font-semibold">Date</dd>
              <div>{filmDate && <dt>{filmDate}</dt>}</div>
            </dl>
          </div>
          {vimeoDetails ? (
            <div className="prose max-w-none">
              <PortableText value={vimeoDetails} />
            </div>
          ) : (
            details &&
            details.length > 0 && (
              <div className="prose max-w-none">
                <PortableText value={details} />
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
