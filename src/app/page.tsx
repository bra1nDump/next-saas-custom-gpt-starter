import { Button } from "@nextui-org/button";
import Link from "next/link";

export default function HomePage() {
  // TODO: Factor this out into a separate component - Landing,
  // and show it here conditionally - if user is signed in - show core product: search,
  // if not - show landing
  // The downside of this is this becoms a dynamic route and cant be statically generated - even
  // though the landing is pretty much static
  // - Lets not worry about it - even Next.js docs suggest to not worry about it https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering

  return (
    <main className="flex h-full grow flex-col items-center justify-center space-y-8 bg-gradient-to-b from-[#2e026d] to-[#15162c] p-10 text-white">
      <div>Why we do it</div>
      <div>What we do</div>
      <div>How we do it</div>
    </main>
  );
}
