import { Link, useLocation } from 'react-router-dom';
import { Shirt, Settings2 } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-soft">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2 text-gray-900 font-semibold">
            <Shirt className="w-6 h-6 text-teal-600" />
            <span>IronTrack</span>
          </Link>
          <Link
            to="/categories"
            className={`p-2 rounded-xl transition ${location.pathname === '/categories' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Categories"
          >
            <Settings2 className="w-5 h-5" />
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-auto pb-24">
        {children}
      </main>
    </div>
  );
}
