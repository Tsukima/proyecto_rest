import { Outlet } from "react-router";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { CookieConsent } from "../CookieConsent";

export function RootLayout() {
  return (
    <div className="cafi-site-shell min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
