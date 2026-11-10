import { PageTransition } from "@/components/motion/PageTransition";
import { Hero } from "@/modules/hero";
import { About, FeaturedProjects, LatestPosts } from "@/modules/home";

export default function HomePage() {
  return (
    <PageTransition>
      <Hero />
      <FeaturedProjects />
      <LatestPosts />
      <About />
    </PageTransition>
  );
}
