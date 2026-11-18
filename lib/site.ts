const REPO = "offset-ui/offset-ui";
const GITHUB = `https://github.com/${REPO}`;

export const SITE = {
  name: "Offset UI",
  tagline: "Small interactions, big memories.",
  description: "Open-source React components built pixel-for-pixel from Figma, with motion you will remember.",
  url: "https://offset-ui-beta.vercel.app",
  repo: REPO,
  github: GITHUB,
  requestComponent: `${GITHUB}/issues/new?template=component_request.yml`,
  install: "npm install motion clsx tailwind-merge",
  newsletter: "",
  creator: { handle: "adityaarora", url: "" },
  socials: { x: "", instagram: "", email: "", portfolio: "" },
};

export const repoUrl = (path = "") => `${GITHUB}${path}`;

const { x, instagram, email, portfolio } = SITE.socials;
export const SOCIAL_LINKS = (
  [
    ["X", x],
    ["Instagram", instagram],
    ["Email", email && `mailto:${email}`],
    ["Portfolio", portfolio],
  ] as [string, string][]
).filter(([, href]) => href);
