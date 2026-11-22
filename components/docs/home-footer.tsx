import { FooterCredit, FooterLinks } from "./footer";
import { FooterWordmark } from "./footer-wordmark";

export function HomeFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-[1335px] px-4 pt-16 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center text-sm md:flex-row md:justify-between md:text-left">
          <FooterCredit className="text-muted" />
          <FooterLinks className="max-md:flex-col max-md:items-center" />
        </div>
      </div>
      <FooterWordmark className="mt-4" />
    </footer>
  );
}
