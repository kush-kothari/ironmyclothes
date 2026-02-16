import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PhotoThumbnail from '../components/PhotoThumbnail';
import { useEntryDetail } from '../hooks/useEntryDetail';
import { formatDate, formatCurrency } from '../utils/format';
import { getItemStatus, getPendingQuantity } from '../models/types';

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const entryId = id ? parseInt(id, 10) : null;
  const { entry, loading, error, markReturned } = useEntryDetail(entryId);

  if (entryId == null || isNaN(entryId)) {
    return (
      <div className="p-4">
        <p className="text-red-600">Invalid entry ID</p>
        <Button variant="ghost" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-4">
        <p className="text-red-600">{error?.message ?? 'Entry not found'}</p>
        <Button variant="ghost" onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  const totalPendingQty = entry.items.reduce((s, i) => s + getPendingQuantity(i.quantityGiven, i.quantityReturned), 0);
  const totalPendingAmount = entry.items.reduce(
    (s, i) => s + getPendingQuantity(i.quantityGiven, i.quantityReturned) * (i.pricePerItem ?? 0),
    0
  );
  const completedCount = entry.items.reduce(
    (s, i) => s + (i.quantityReturned >= i.quantityGiven ? 1 : 0),
    0
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-gray-100" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Entry · {formatDate(entry.dateGiven)}</h1>
      </div>

      {/* Photos */}
      {entry.photos.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Photos</h2>
          <div className="grid grid-cols-3 gap-2">
            {entry.photos.map((p) => (
              <PhotoThumbnail key={p.id} uri={p.uri} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Notes & dates */}
      {(entry.notes || entry.expectedReturnDate) && (
        <Card className="p-4">
          {entry.notes && <p className="text-gray-700 text-sm">{entry.notes}</p>}
          {entry.expectedReturnDate && (
            <p className="text-sm text-gray-500 mt-2">Expected return: {formatDate(entry.expectedReturnDate)}</p>
          )}
        </Card>
      )}

      {/* Category breakdown with return controls */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-2">Items</h2>
        <div className="space-y-2">
          {entry.items.map((item) => {
            const status = getItemStatus(item.quantityGiven, item.quantityReturned);
            const pending = getPendingQuantity(item.quantityGiven, item.quantityReturned);
            return (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{item.categoryName}</p>
                    <p className="text-sm text-gray-500">
                      Given: {item.quantityGiven} · Returned: {item.quantityReturned} · Pending: {pending}
                    </p>
                    <p className="text-sm text-gray-600">{formatCurrency((item.pricePerItem ?? 0) * item.quantityGiven)}</p>
                  </div>
                  <Badge variant={status === 'Pending' ? 'pending' : status === 'Partial' ? 'partial' : 'completed'}>
                    {status}
                  </Badge>
                </div>
                {pending > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Mark returned:</span>
                    {[1, 2, 3].filter((n) => n <= pending).map((n) => (
                      <Button
                        key={n}
                        variant="outline"
                        className="!py-1 !px-2 text-sm"
                        onClick={() => markReturned(item.id, item.quantityReturned + n)}
                      >
                        +{n}
                      </Button>
                    ))}
                    <Button
                      variant="primary"
                      className="!py-1 !px-2 text-sm"
                      onClick={() => markReturned(item.id, item.quantityGiven)}
                    >
                      All
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4 bg-gray-50">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Summary</h2>
        <div className="space-y-1 text-sm">
          <p className="flex justify-between"><span>Total amount</span><span>{formatCurrency(entry.totalAmount)}</span></p>
          <p className="flex justify-between"><span>Pending amount</span><span>{formatCurrency(totalPendingAmount)}</span></p>
          <p className="flex justify-between"><span>Pending items</span><span>{totalPendingQty}</span></p>
          <p className="flex justify-between"><span>Completed items</span><span>{completedCount}</span></p>
        </div>
      </Card>
    </div>
  );
}
