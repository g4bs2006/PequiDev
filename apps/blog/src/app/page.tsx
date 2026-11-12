import { PageTransition } from "@/components/motion/PageTransition";
import { Hero } from "@/modules/hero";
import { About, FeaturedProjects, LatestPosts, SiteJsonLd } from "@/modules/home";

export default function HomePage() {
  return (
    <>
      <SiteJsonLd />
      <PageTransition>
        <Hero />
        <FeaturedProjects />
        <LatestPosts />
        <About />
      </PageTransition>
    </>
  );
}
