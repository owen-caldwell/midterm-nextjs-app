import Link from "next/link";
import { defineQuery } from "next-sanity";
import { client } from "@/sanity/client";

const options = { next: { revalidate: 60 } };

const FILMS_QUERY = defineQuery(`*[
  _type == "film"
  && defined(slug.current)
]{_id, title, slug, date}|order(date desc)`);

export default async function IndexPage() {
  const films = await client.fetch(FILMS_QUERY, {}, options);

  return (
    <main className="flex bg-gray-100 min-h-screen flex-col p-24 gap-12">
      <h1 className="text-4xl font-bold tracking-tighter">Films</h1>
      <ul className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {films.map((film) => (
          <li className="bg-white p-4 rounded-lg" key={film._id}>
            <Link
              className="hover:underline"
              href={`/films/${film?.slug?.current}`}
            >
              <h2 className="text-xl font-semibold">{film?.title}</h2>
              {film?.date && (
                <p className="text-gray-500">
                  {new Date(film.date).toLocaleDateString()}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}