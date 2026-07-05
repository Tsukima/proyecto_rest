import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";
import { WeekdayMenuPage } from "./pages/WeekdayMenuPage";
import { WeekendMenuPage } from "./pages/WeekendMenuPage";
import { BeveragesPage } from "./pages/BeveragesPage";
import { GalleryPage } from "./pages/GalleryPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPanelPage } from "./pages/AdminPanelPage";
import { DevClearReservations } from "./pages/DevClearReservations";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { CookiePolicyPage } from "./pages/CookiePolicyPage";
import { WineListPage } from "./pages/WineListPage";
import { ChatPage } from "./pages/ChatPage";
import { CafiChatOnlyPage } from "./pages/CafiChatOnlyPage";

export const router = createBrowserRouter([
  { path: "/cafi", Component: CafiChatOnlyPage },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "menu", Component: MenuPage },
      { path: "menu-dia", Component: WeekdayMenuPage },
      { path: "menu-fin-de-semana", Component: WeekendMenuPage },
      { path: "beverages", Component: BeveragesPage },
      { path: "carta-vinos", Component: WineListPage },
      { path: "gallery", Component: GalleryPage },
      { path: "reservations", Component: ReservationsPage },
      { path: "chat", Component: ChatPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "profile", Component: ProfilePage },
      { path: "politica-privacidad", Component: PrivacyPolicyPage },
      { path: "politica-cookies", Component: CookiePolicyPage },
      { path: "admin", Component: AdminPanelPage },
      { path: "dev-clear", Component: DevClearReservations },
    ],
  },
]);
