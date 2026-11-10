import { Hero } from "@/modules/hero";
import { About, FeaturedProjects, LatestPosts } from "@/modules/home";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProjects />
      <LatestPosts />
      <About />
    </>
  );
}
