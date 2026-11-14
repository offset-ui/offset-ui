import { SITE } from "@/lib/site";

export type Section = { heading?: string; text?: string[]; list?: string[]; code?: string; links?: [string, string][] };
export type InfoPage = { title: string; description: string; updated?: string; sections: Section[] };

const { x, instagram, email, portfolio } = SITE.socials;
const elsewhere: [string, string][] = [["X", x], ["Instagram", instagram], ["Email", email && `mailto:${email}`], ["Portfolio", portfolio]].filter(([, href]) => href) as [string, string][];
const UPDATED = "November 15, 2026";

export const PAGES: Record<string, InfoPage> = {
  about: {
    title: "About",
    description: "Why Offset UI exists, and the open-source licence it ships under.",
    sections: [
      {
        heading: "Why Offset UI exists",
        text: [
          "Most component libraries give you a button that works. We wanted components that feel like someone cared about the last few pixels: a checkbox that crosses itself out like a pen, a switch where a hand reaches in and drags the knob across.",
          "Offset UI is a small, growing library of React components built pixel for pixel from Figma designs, with motion you will remember. Every component is one file you copy into your project and own. There is nothing to install, no theme to fight and no black box to debug.",
        ],
      },
      {
        heading: "Why the name",
        text: ["Look at the logo: a card with its twin nudged just out of line. Good interfaces do the same thing. They are the familiar pattern, shifted a few pixels to where it surprises you."],
      },
      {
        heading: "What makes it different",
        list: [
          "Designed in Figma first, then built to match it exactly, not approximated.",
          "Every component has a Copy for AI button, so your coding assistant gets the full prompt and code in one click.",
          "Small on purpose: one file per component, a few well-chosen props and sensible defaults.",
          "Accessible by default: keyboard support, visible focus, screen reader labels and respect for reduced motion.",
        ],
      },
      {
        heading: "Open source",
        text: [
          "The components are open source under the MIT licence. In plain words: you can use them in personal and commercial projects, change them, and ship them, as long as you keep the licence notice with the code you copy. You do not need to credit us in your product.",
          "Code that has been released under MIT stays MIT. If we ever add something new on different terms, we will say so clearly and it will not change what you already have.",
          "The licence covers the code. The Offset UI name, logo and the design of this website are not part of it.",
        ],
        links: [["Read the full licence on GitHub", `${SITE.github}/blob/main/LICENSE`], ["View the source", SITE.github]],
      },
      {
        heading: "Built in public",
        text: ["The code, the issues and the roadmap live on GitHub. If something is missing or broken, or you want a component, tell us there."],
        links: [["Request a component", SITE.requestComponent]],
      },
    ],
  },
  contact: {
    title: "Contact",
    description: "How to reach us.",
    sections: [
      {
        text: ["Offset UI is a small project, so replies can take a few days. We read everything."],
      },
      {
        heading: "Bugs and questions",
        text: ["Open an issue on GitHub. Say which component and browser you used, and what you expected to happen. A short screen recording helps a lot."],
        links: [["Open an issue", `${SITE.github}/issues/new/choose`]],
      },
      {
        heading: "Ask for a component",
        text: ["Tell us what you would like to see and where you would use it. Requests shape what we build next."],
        links: [["Request a component", SITE.requestComponent]],
      },
      {
        heading: "Security problems",
        text: ["Please do not post these publicly. Report them privately through GitHub and we will reply within 7 days."],
        links: [["Report privately", `${SITE.github}/security/advisories/new`]],
      },
      ...(elsewhere.length ? [{ heading: "Elsewhere", links: elsewhere }] : []),
    ],
  },
  faq: {
    title: "FAQ",
    description: "Quick answers about Offset UI.",
    sections: [
      { heading: "Is Offset UI free?", text: ["Yes. The components are free to use under the MIT licence. Code released under MIT stays MIT."] },
      { heading: "Can I use it in client or commercial work?", text: ["Yes. Use it in personal, client and commercial projects. Keep the licence notice with the code you copy. You do not need to credit us in your product."] },
      { heading: "How do I add a component?", text: ["Open its page, copy the file into your project, and install the three small packages once.", "Then import it and use it. Each page shows the exact steps."], code: SITE.install },
      { heading: "Does it need Tailwind CSS?", text: ["The components are styled with Tailwind CSS v4 classes, so your project needs Tailwind. They also use the motion, clsx and tailwind-merge packages."] },
      { heading: "Which frameworks does it work with?", text: ["Any React project, such as Next.js or Vite. We build and test on React 19."] },
      { heading: "What is Copy for AI?", text: ["A button on every component page that copies a ready-made prompt with the full code, so Cursor, Claude or ChatGPT can add the component to your project for you."] },
      { heading: "Is it accessible?", text: ["That is the goal for every component: keyboard support, visible focus, labels for screen readers and respect for reduced motion. If you find a gap, please open an issue."] },
      { heading: "Can I change how a component looks?", text: ["Yes. Each component has a few props, usually colours, size and labels. And because the file is yours, you can change anything else directly."] },
      { heading: "How do I ask for a new component?", text: ["Send a request on GitHub. We read every one."], links: [["Request a component", SITE.requestComponent]] },
      { heading: "Will it stay free?", text: ["What has been released under MIT stays MIT. We may add new things later, and if they come on different terms we will say so clearly."] },
    ],
  },
  terms: {
    title: "Terms",
    description: "The simple rules for using this site and its code.",
    updated: UPDATED,
    sections: [
      { text: ["These terms are short on purpose. By using this website or the code on it, you agree to them."] },
      { heading: "Using the site", text: ["You can browse the site and copy the code without an account or any payment."] },
      {
        heading: "The code",
        text: ["The components are released under the MIT licence. You can use, copy, change and share them, including in commercial work, as long as you keep the licence notice with the code you copy.", "The code is provided as it is, with no warranty of any kind. Please test it in your own project before you rely on it. To the extent the law allows, we are not responsible for any loss that comes from using the site or the code."],
        links: [["Read the licence", `${SITE.github}/blob/main/LICENSE`]],
      },
      { heading: "What is not covered by the licence", text: ["The Offset UI name, logo and the design of this website belong to us. Please do not use them in a way that suggests we made or approved your product. The sample content in component previews is for demonstration only."] },
      { heading: "Contributions", text: ["If you send code or artwork to the repository, only send work you have the right to share under the MIT licence."] },
      { heading: "Other people's code and sites", text: ["The components use open-source packages, each with its own licence. When you follow a link to another site, such as GitHub, that site's own terms apply."] },
      { heading: "Changes", text: ["The site and the components may change or be removed over time. We may update these terms too, and the date at the top will change when we do."] },
      { heading: "Questions", text: ["Reach us on the Contact page."] },
    ],
  },
  privacy: {
    title: "Privacy",
    description: "What this site collects, in plain words.",
    updated: UPDATED,
    sections: [
      { text: ["The short version: Offset UI does not ask you to sign up, does not run analytics or ads, and does not set cookies."] },
      {
        heading: "What we collect",
        text: ["We do not collect personal information from you ourselves. The site is hosted on Vercel, which, like any web host, keeps standard server logs, such as your IP address, browser type and the page you asked for. That is part of running a website securely. We do not use these logs to identify or follow you."],
      },
      {
        heading: "What happens in your browser",
        list: [
          "Copy buttons copy to your clipboard. Nothing is sent anywhere.",
          "Component previews run in your browser. Anything you type into them stays there.",
          "Fonts are served from this site, not requested from other companies when you visit.",
          "The GitHub star count is fetched by our server about once an hour, so your browser does not contact GitHub for it.",
        ],
      },
      { heading: "Newsletter", text: ["The \"Get the next component\" box currently just links to GitHub releases and collects nothing. If that ever changes, we will update this page first."] },
      { heading: "Links to other sites", text: ["When you click through to GitHub or another site, that site's own privacy policy applies."] },
      { heading: "Your data", text: ["Since we do not keep personal information about you, there is very little to access or delete. If you have a question or concern, tell us on the Contact page."] },
      { heading: "Changes", text: ["If we change how the site works, we will update this page and the date at the top."] },
    ],
  },
};
