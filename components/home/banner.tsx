import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export default function Banner() {
  return (
    <section className="lg:max-w-6xl mx-auto flex flex-col z-0 items-center justify-center py-28 sm:pt-32 transition-all animate-in">
      <h1 className="py-6 text-center">
        Turn your words into{" "}
        <span className="underline underline-offset-8 decoration-dashed decoration-purple-200">
          fascinating
        </span>{" "}
        blog posts
      </h1>
      <h2 className=" text-center px-4 lg:px-0 lg:max-w-4xl">
        Convert your video or voice into a SEO friendly Blog Post in sec. with the power
        of VlogVerse AI!
      </h2>

      <Button
        variant={"link"}
        className="mt-6 text-xl rounded-full px-12 py-8 lg:mt-20 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold shadow-lg hover:no-underline"
      >
        <Link href="/dashboard" className="flex gap-2 items-center">
          <span className="relative">Try VlogVerse </span>
          <ArrowRight className="animate-pulse" />
        </Link>
      </Button>
    </section>
  );
}
