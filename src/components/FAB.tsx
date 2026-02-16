import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function FAB() {
  return (
    <Link
      to="/add"
      className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 active:scale-95 transition"
      aria-label="Add entry"
    >
      <Plus className="w-6 h-6" />
    </Link>
  );
}
