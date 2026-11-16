import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { NotFoundContent } from "@/components/layout/not-found-content";

/** For a URL that matches no route, so there is no layout to sit inside. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <NotFoundContent />
      </main>
      <SiteFooter />
    </>
  );
}
