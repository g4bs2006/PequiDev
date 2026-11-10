import { GitHubIcon } from "@/components/atoms/icons";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-[84rem] flex-wrap items-center justify-between gap-4 px-5 py-10 text-ink-soft md:px-10">
      <p>
        <span className="font-display font-bold text-ink">{site.name}</span> · blog e portfólio do{" "}
        {site.author.name}
      </p>
      <a
        href={site.author.github}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full font-medium text-ink underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4"
      >
        <GitHubIcon className="text-lg" />
        GitHub
      </a>
    </footer>
  );
}
