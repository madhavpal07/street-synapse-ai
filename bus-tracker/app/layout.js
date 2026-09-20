import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata = {
  title: 'StreetSynapse | Live Bus Tracker',
  description: 'Live bus locations from a driver’s smartphone, with GPS accuracy and connection status.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
