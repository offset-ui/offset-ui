const REPO = "offset-ui/offset-ui";
const GITHUB = `https://github.com/${REPO}`;

export const SITE = {
  name: "Offset UI",
  author: "Aditya Arora",
  tagline: "Small interactions, big memories.",
  description: "Open-source React components built pixel-for-pixel from Figma, with motion you will remember.",
  url: "https://offset-ui-beta.vercel.app",
  repo: REPO,
  github: GITHUB,
  requestComponent: `${GITHUB}/issues/new?template=component_request.yml`,
  install: "npm install motion clsx tailwind-merge",
  socials: { x: "https://x.com/ux_adityaa", linkedin: "https://www.linkedin.com/in/adityaarora20/", email: "adityaarora.ux@gmail.com" },
};

export const repoUrl = (path = "") => `${GITHUB}${path}`;

const { x, linkedin, email } = SITE.socials;
export const SOCIAL_LINKS = (
  [
    ["X", x],
    ["LinkedIn", linkedin],
    ["Email", email && `mailto:${email}`],
  ] as [string, string][]
).filter(([, href]) => href);
