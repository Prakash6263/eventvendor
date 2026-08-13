import MerchantAuthProvider from "./components/MerchantAuthProvider";
import LegacyScripts from "./components/LegacyScripts";
import "./globals.css";

export const metadata = {
  title: "Eventuna",
  description: "Eventuna vendor dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="min-vh-100" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" type="image/png" href="/images/fav.png" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet" />
        <link href="/vendor/unicons-2.0.1/css/unicons.css" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet" />
        <link href="/css/style.css" rel="stylesheet" />
        <link href="/css/responsive.css" rel="stylesheet" />
        <link href="/css/night-mode.css" rel="stylesheet" />
        <link href="/vendor/fontawesome-free/css/all.min.css" rel="stylesheet" />
        <link href="/vendor/OwlCarousel/assets/owl.carousel.css" rel="stylesheet" />
        <link href="/vendor/OwlCarousel/assets/owl.theme.default.min.css" rel="stylesheet" />
        <link href="/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
        <link href="/vendor/bootstrap-select/dist/css/bootstrap-select.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="d-flex flex-column min-vh-100">
        <MerchantAuthProvider>{children}</MerchantAuthProvider>
        <LegacyScripts />
      </body>
    </html>
  );
}
