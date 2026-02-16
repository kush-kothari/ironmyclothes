import { useNavigate } from 'react-router-dom';
import { Package, Shirt, IndianRupee } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import FAB from '../components/FAB';
import { useEntries } from '../hooks/useEntries';
import { formatDate, formatCurrency } from '../utils/format';

export default function Dashboard() {
  const navigate = useNavigate();
  const { entries, stats, loading, error, reload } = useEntries();

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">{error.message}</p>
        <button onClick={() => reload()} className="mt-2 text-teal-600 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-100 p-2">
              <Package className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Entries</p>
              <p className="text-xl font-semibold text-gray-900">{stats?.totalActiveEntries ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2">
              <Shirt className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Clothes</p>
              <p className="text-xl font-semibold text-gray-900">{stats?.totalPendingClothes ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2">
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Amount</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats?.totalPendingAmount ?? 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Entry list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Entries</h2>
        <div className="space-y-3">
          {entries.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No entries yet. Tap the + button to add one.
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} onClick={() => navigate(`/entry/${entry.id}`)} className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{formatDate(entry.dateGiven)}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {entry.totalItems} items · {entry.pendingItems} pending
                    </p>
                    <p className="text-sm font-medium text-gray-700 mt-1">{formatCurrency(entry.totalAmount)}</p>
                  </div>
                  <Badge variant={entry.status === 'Pending' ? 'pending' : entry.status === 'Partial' ? 'partial' : 'completed'}>
                    {entry.status}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <FAB />
    </div>
  );
}
