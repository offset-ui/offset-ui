import { repoUrl, SITE } from "@/lib/site";

export type Section = { heading?: string; text?: string[]; list?: string[]; code?: string; links?: [string, string][]; closing?: string[] };
export type InfoPage = { title: string; description?: string; updated?: string; sections: Section[] };

export const PAGES: Record<string, InfoPage> = {
  about: {
    title: "About",
    description: "A little about the idea behind Offset UI, why I started building it, and what I'm trying to make along the way.",
    sections: [
      {
        heading: "Why Offset UI exists",
        text: [
          "I've always been drawn to the little details in design. The tiny interactions, the unexpected movements and those few pixels that somehow make an interface feel more alive.",
          "Most component libraries give you things that work. And that's great. But I always felt there was room to make them feel a little more special.",
          "That's where Offset UI started.",
          "What began as an experiment turned into a growing collection of React components, each designed in Figma and brought to life with code, motion and a lot of attention to detail.",
          "I'm building this one component at a time, trying to make things that are not only useful but genuinely enjoyable to use.",
          "Every component comes with its own code, ready to copy, customise and make your own. No complicated setup or hidden layers. Just the things you need, without getting in your way.",
        ],
      },
      {
        heading: "What makes it different",
        list: [
          "**Designed in Figma, built with care.** Every component starts with a design. I work through the details in Figma before bringing them to code, making sure the final interaction feels as close to the original idea as possible.",
          "**Made for the way we build today.** Each component comes with a Copy for AI option, giving your coding assistant the complete prompt and code to help bring it into your project.",
          "**No unnecessary complexity.** One component, one file. A few thoughtful props, sensible defaults and code you can actually understand and make your own.",
          "**The details matter, including accessibility.** Keyboard interactions, visible focus states, screen reader labels and reduced-motion support are considered throughout the process.",
        ],
      },
      {
        heading: "Open source",
        text: [
          "I believe good ideas are better when they're shared.",
          "That's why the component code in Offset UI is released under the MIT licence. You can use it in personal or commercial projects, modify it, build on it and ship it as part of your own work.",
          "All I ask is that you retain the original licence notice alongside the code you use. No additional credit is required in your product.",
          "The licence applies to the component code, not the Offset UI name, logo or website design.",
          "And just to be clear, code that's already released under MIT stays under MIT, even if the project evolves or introduces things under different terms in the future.",
        ],
        links: [["Read the full licence on GitHub", repoUrl("/blob/main/LICENSE")], ["Explore the source code", SITE.github]],
      },
      {
        heading: "Built in public",
        text: [
          "Offset UI is something I'm actively building, experimenting with and learning from.",
          "The code, issues and roadmap are all out there on GitHub. I'll keep adding components, refining existing ones and exploring new interactions as I go.",
          "And I'd love for you to be part of that process.",
          "Found something broken? Have an idea for a component? Think something could be done better? Feel free to open an issue or share your thoughts. I'm always happy to hear them.",
        ],
        links: [["Suggest a component", SITE.requestComponent]],
      },
      {
        text: [
          "One last little credit: the people featured in the homepage illustration are from [Open Peeps by Pablo Stanley](https://www.openpeeps.com/), released into the public domain under CC0.",
          "Thanks for being here. I hope you find something you love building with.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    description: "Have a question, spotted something that needs fixing, or just have an idea you'd like to share? Here's where to find me.",
    sections: [
      {
        heading: "Let's talk",
        text: [
          "Offset UI is an independent project, built and maintained by me. That means I'm the one designing the components, working on the code, updating the website and keeping things moving.",
          "So if you reach out, you're talking directly to the person behind it.",
          "Whether it's a question about a component, feedback on something I've built or just an interesting idea, I'd love to hear from you.",
          "A little context goes a long way, though. The more specific your message is, the easier it is for me to understand what you need and get back to you.",
        ],
      },
      {
        heading: "Find me around the internet",
        list: [
          `Website: [Offset UI](${SITE.url})`,
          `GitHub: [Explore the source](${SITE.github})`,
          "Portfolio: My portfolio",
          `Email: [${SITE.socials.email}](mailto:${SITE.socials.email})`,
          `X / Twitter: [Say hello](${SITE.socials.x})`,
        ],
        closing: ["Feel free to reach out through any of these. For anything that needs a proper conversation, email is probably the easiest way to reach me."],
      },
      {
        heading: "A little about my inbox",
        text: [
          "There's no support team or ticketing system behind Offset UI. It's just me managing things alongside everything else I'm working on.",
          "I try to keep an eye on incoming messages and respond whenever I can. It might not always be immediate, but I do read them.",
          "One small favour: please avoid sending vague messages or unsolicited promotional emails. A little context about why you're reaching out makes a big difference.",
        ],
      },
      {
        heading: "Found something broken?",
        text: [
          "If you've spotted a bug, a visual inconsistency or something that doesn't quite behave as expected, GitHub is the best place to report it.",
          `[Browse existing issues ↗](${repoUrl("/issues")}) or [open a new issue ↗](${repoUrl("/issues/new")}).`,
          "When reporting something, try to include:",
        ],
        list: [
          "What you were doing when the issue appeared.",
          "What happened versus what you expected.",
          "The component name or relevant page.",
          "Your browser or environment, if relevant.",
          "A screenshot or recording, if possible.",
        ],
        closing: ["This helps me understand the problem without having to guess what went wrong."],
      },
      {
        heading: "Have an idea?",
        text: [
          "Some of my favourite things to build start with a simple idea.",
          "Maybe there's a component you'd love to see in Offset UI, an interaction you've come across, or a small detail you think could be done better.",
          "I'm always open to suggestions. You don't need a perfectly written proposal or a detailed specification. Just tell me what you have in mind and why you think it would be useful.",
        ],
        links: [["Suggest a component on GitHub", SITE.requestComponent]],
        closing: ["You can also email me if you'd rather talk through an idea first."],
      },
      {
        heading: "Just saying hello?",
        text: [
          "That's welcome too.",
          "Not every message needs to be about a bug or a feature request. If you've been using Offset UI, found something interesting or simply want to say hi, my inbox is open.",
          "Have something in mind? I'd love to hear it.",
        ],
        links: [["Get in touch", `mailto:${SITE.socials.email}`]],
      },
      {
        heading: "Related",
        text: ["Want to know a little more about the project? Head over to [About Offset UI](/about) to read why I started building it, how the components come together and what the project is all about.", "You can also explore the [component library](/components) or browse the [source code on GitHub](" + SITE.github + ")."],
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    updated: "November 2026",
    sections: [
      {
        heading: "1. Overview",
        text: [
          `These Terms govern your use of Offset UI ([${SITE.url.replace("https://", "")}](${SITE.url})), including its website, component library and related resources.`,
          "Offset UI is an independent project built and maintained by me. By accessing or using the website, you agree to these Terms. If you don't agree with them, please stop using the website.",
          "These Terms are here to keep things clear about how the project can be used, what you can expect from it and what responsibilities come with using the components.",
        ],
      },
      {
        heading: "2. The website and components",
        text: [
          "Offset UI provides a collection of React components, design references and related resources intended to help developers and designers build better interfaces.",
          `The component code is released under the [MIT License](${repoUrl("/blob/main/LICENSE")}), unless a particular file or resource states otherwise.`,
          "You're free to copy, modify, adapt and use the components in personal and commercial projects, subject to the terms of the applicable licence.",
          "Once you copy a component into your project, you're responsible for how you modify, implement and use it.",
        ],
      },
      {
        heading: "3. Using the website",
        text: ["You're welcome to explore the website, browse components, copy code and use the resources available here.", "While using Offset UI, you agree not to:"],
        list: [
          "Use the website for unlawful activities or purposes.",
          "Attempt to disrupt, damage or gain unauthorised access to the website or its infrastructure.",
          "Introduce malicious code, scripts or harmful content.",
          "Scrape, overload or abuse the website in ways that affect its availability for others.",
          "Misrepresent Offset UI or suggest an official association or endorsement where none exists.",
        ],
        closing: ["I reserve the right to restrict access if someone uses the website in a way that could harm the project, its visitors or its infrastructure."],
      },
      {
        heading: "4. Open-source licence",
        text: [
          "The component code available through Offset UI is licensed under MIT.",
          "This means you can use it in personal and commercial projects, modify it, distribute it and include it in your own products, provided you follow the licence conditions.",
          "You must retain the original copyright and licence notices in copies or substantial portions of the licensed code.",
          "The MIT licence applies to the code, not automatically to everything associated with Offset UI.",
          "The Offset UI name, logo, website design, branding and other original visual assets are not included in the MIT licence unless explicitly stated otherwise.",
          `For the complete terms, please read the [MIT License on GitHub](${repoUrl("/blob/main/LICENSE")}).`,
        ],
      },
      {
        heading: "5. Intellectual property",
        text: [
          "The original branding, logo, website design, written content and visual identity of Offset UI belong to their respective owners.",
          "You're welcome to reference the project and share links to its components, but you may not present the Offset UI brand, website or original visual assets as your own.",
          "Some illustrations, fonts or other resources may belong to their respective creators and may have separate licensing conditions. Their use is subject to those individual licences.",
        ],
      },
      {
        heading: "6. Third-party services and links",
        text: [
          "Offset UI may contain links to external websites, repositories or services, including GitHub and Vercel.",
          "These websites and services are not controlled by me. I'm not responsible for their content, availability, privacy practices or terms of use.",
          "If you choose to visit or use an external service, its own terms and policies will apply.",
        ],
      },
      {
        heading: "7. Availability and updates",
        text: [
          "I do my best to keep Offset UI running smoothly and its components working as intended, but I can't promise that the website will always be available or that every component will work perfectly in every environment.",
          "The project is continuously evolving. Components, documentation, features and website content may be updated, changed or removed as development continues.",
          "I may also introduce new features or services in the future, which may come with additional terms where necessary.",
        ],
      },
      {
        heading: "8. Disclaimer",
        text: [
          `Offset UI and its components are provided on an "as is" and "as available" basis, without warranties of any kind, express or implied.`,
          "I don't guarantee that:",
        ],
        list: [
          "Every component will be free of bugs or errors.",
          "Components will work with every framework, library or development setup.",
          "The website will always be available without interruptions.",
          "Using a component will produce a particular result in your project.",
        ],
        closing: ["You're responsible for testing and reviewing any code before using it in your application or production environment."],
      },
      {
        heading: "9. Limitation of liability",
        text: [
          "To the fullest extent permitted by applicable law, Offset UI and its maintainer will not be held responsible for indirect, incidental or consequential damages, loss of data, lost profits or other issues arising from the use of the website or its components.",
          "This includes issues resulting from modifying, implementing or integrating copied components into your own projects.",
          "Nothing in these Terms excludes liability where applicable law does not allow such an exclusion.",
        ],
      },
      {
        heading: "10. Changes to these Terms",
        text: [
          "As Offset UI grows, these Terms may need to change to reflect new features, services or changes to how the project works.",
          "Whenever meaningful changes are made, I'll update the date at the top of this page.",
          "Your continued use of the website after updated Terms are published means you accept the revised Terms, to the extent permitted by applicable law.",
        ],
      },
      {
        heading: "11. Contact",
        text: [
          "Have a question about these Terms, the MIT licence or how something works?",
          "Feel free to reach out through the [Contact page](/contact).",
          "I'll be happy to help clarify things.",
          "You can also read the [Privacy Policy](/privacy) to understand how information is handled when you use Offset UI.",
          "These Terms are intended to provide general information about using Offset UI. They are not personalised legal advice. If you need advice about your specific legal obligations, please consult a qualified lawyer.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "November 2026",
    sections: [
      {
        heading: "Overview",
        text: [
          `Offset UI ([${SITE.url.replace("https://", "")}](${SITE.url})) is an independent project featuring a growing collection of React components.`,
          "I believe in keeping things simple, including how user data is handled. This website does not intentionally collect personal information just for browsing or exploring the component library, and I do not sell or rent personal data to anyone.",
        ],
      },
      {
        heading: "Analytics and tracking",
        text: [
          "I currently do not use third-party analytics or advertising trackers to monitor your activity across the website.",
          "I also do not use analytics cookies to build user profiles or track your browsing behaviour.",
          "If this changes in the future, I'll update this page to explain what is being used and how it handles your information.",
        ],
      },
      {
        heading: "Contact",
        text: [
          "If you reach out to me through email or another contact channel, I'll use the information you share only to understand and respond to your message.",
          "I don't add people to marketing lists or send promotional emails without their consent.",
          "Please keep in mind that email communication passes through third-party email providers, which may process your information under their own privacy policies.",
          "For questions about privacy or how your information is handled, you can reach me through the [Contact page](/contact).",
          "**Maintainer:** Offset UI",
          `**Email:** [${SITE.socials.email}](mailto:${SITE.socials.email})`,
        ],
      },
      {
        heading: "Third-party hosting",
        text: [
          "Offset UI is hosted on [Vercel](https://vercel.com/), which handles the infrastructure needed to make the website accessible.",
          "Like most hosting providers, Vercel may process certain technical information, such as IP addresses, browser details, requested URLs and server logs, to deliver, maintain and secure the website.",
          "This information is handled by Vercel under its own privacy policy. You can learn more about how it processes data in the [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy).",
        ],
      },
      {
        heading: "Open source components",
        text: [
          "The components available on Offset UI are designed to be copied and used in your own projects.",
          "Once you copy a component into your application, it runs within your own environment. Any data collection, cookies, tracking or other privacy practices associated with your application are your responsibility.",
          "Offset UI does not control how copied components are used after they become part of another project.",
        ],
      },
      {
        heading: "Children's privacy",
        text: ["Offset UI is not specifically directed at children, and I do not knowingly collect personal information from children through this website."],
      },
      {
        heading: "Changes to this policy",
        text: [
          "This policy may change as Offset UI grows and new features or services are introduced.",
          "Whenever I make meaningful changes, I'll update the date at the top of this page. I encourage you to check back occasionally to stay informed about how the website handles information.",
        ],
      },
      {
        heading: "Questions?",
        text: ["If something here isn't clear or you have a question about privacy, feel free to [get in touch](/contact).", "I'm happy to clarify."],
      },
    ],
  },
};
