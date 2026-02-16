import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ImagePlus } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import PhotoThumbnail from '../components/PhotoThumbnail';
import { useCategories } from '../hooks/useCategories';
import { takeGroupPhoto, pickIndividualPhotos, requestCameraPermissions } from '../services/camera';
import { insertEntry } from '../services/database';
import { formatCurrency } from '../utils/format';

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function AddEntry() {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();
  const [dateGiven, setDateGiven] = useState(todayISO());
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<Record<number, number>>({}); // categoryId -> quantity
  const [groupPhotoUri, setGroupPhotoUri] = useState<string | null>(null);
  const [individualPhotoUris, setIndividualPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleCategory = (id: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const setQuantity = (id: number, qty: number) => {
    if (qty < 1) {
      setSelected((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setSelected((prev) => ({ ...prev, [id]: qty }));
    }
  };

  const totalAmount = categories.reduce((sum, c) => sum + (selected[c.id] ?? 0) * c.price, 0);

  // Cart rows for summary: only selected categories with qty > 0
  const cartRows = categories
    .filter((c) => (selected[c.id] ?? 0) > 0)
    .map((c) => ({
      name: c.name,
      qty: selected[c.id]!,
      unitPrice: c.price,
      lineTotal: selected[c.id]! * c.price,
    }));

  const handleGroupPhoto = async () => {
    await requestCameraPermissions();
    const uri = await takeGroupPhoto();
    if (uri) setGroupPhotoUri(uri);
  };

  const handleIndividualPhotos = async () => {
    await requestCameraPermissions();
    const uris = await pickIndividualPhotos(10);
    if (uris.length) setIndividualPhotoUris((prev) => [...prev, ...uris]);
  };

  const handleSubmit = async () => {
    const items = Object.entries(selected)
      .filter(([, qty]) => qty > 0)
      .map(([catId, qty]) => ({ categoryId: parseInt(catId, 10), quantityGiven: qty }));
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const photoUris = [...(groupPhotoUri ? [groupPhotoUri] : []), ...individualPhotoUris];
      const id = await insertEntry({
        dateGiven,
        expectedReturnDate: expectedReturnDate || null,
        notes: notes || null,
        totalAmount,
        items,
        photoUris,
      });
      navigate(`/entry/${id}`);
    } catch (e) {
      console.error('Failed to save entry', e);
      // Could show toast or inline error here
    } finally {
      setSubmitting(false);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <h1 className="text-lg font-semibold text-gray-900">Add ironing entry</h1>

      {/* Categories + quantities */}
      <Card className="p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Categories & quantity</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 py-1 border-b border-gray-100 last:border-0">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={selected[c.id] != null && selected[c.id] > 0}
                  onChange={() => toggleCategory(c.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-gray-900">{c.name}</span>
                <span className="text-gray-500 text-sm">₹{c.price}</span>
              </label>
              {selected[c.id] != null && selected[c.id] > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(c.id, Math.max(0, (selected[c.id] ?? 1) - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={selected[c.id] ?? 1}
                    onChange={(e) => setQuantity(c.id, parseInt(e.target.value, 10) || 0)}
                    className="w-12 text-center border border-gray-300 rounded-lg py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(c.id, (selected[c.id] ?? 0) + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Cart summary – visible when at least one item selected */}
      {cartRows.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Cart summary</h2>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-1 font-medium text-gray-600">Category</th>
                  <th className="text-center py-2 px-1 font-medium text-gray-600 w-14">Qty</th>
                  <th className="text-right py-2 px-1 font-medium text-gray-600">Unit</th>
                  <th className="text-right py-2 px-1 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {cartRows.map((row) => (
                  <tr key={row.name} className="border-b border-gray-100">
                    <td className="py-2.5 px-1 text-gray-900">{row.name}</td>
                    <td className="py-2.5 px-1 text-center text-gray-700">{row.qty}</td>
                    <td className="py-2.5 px-1 text-right text-gray-600">{formatCurrency(row.unitPrice)}</td>
                    <td className="py-2.5 px-1 text-right font-medium text-gray-900">{formatCurrency(row.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 font-medium">
                  <td className="py-2.5 px-1 text-gray-600">Total</td>
                  <td className="py-2.5 px-1 text-center font-semibold text-gray-900">
                    {cartRows.reduce((s, r) => s + r.qty, 0)}
                  </td>
                  <td className="py-2.5 px-1 text-right text-gray-600">—</td>
                  <td className="py-2.5 px-1 text-right font-semibold text-gray-900">{formatCurrency(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Photos */}
      <Card className="p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Photos</h2>
        <div className="flex flex-wrap gap-2">
          {groupPhotoUri && (
            <div className="relative">
              <PhotoThumbnail uri={groupPhotoUri} className="w-20 h-20" />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">Group</span>
            </div>
          )}
          {individualPhotoUris.map((uri, i) => (
            <PhotoThumbnail key={i} uri={uri} className="w-20 h-20" />
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" onClick={handleGroupPhoto} className="gap-2">
            <Camera className="w-4 h-4" /> Group photo
          </Button>
          <Button variant="outline" onClick={handleIndividualPhotos} className="gap-2">
            <ImagePlus className="w-4 h-4" /> Add photos
          </Button>
        </div>
      </Card>

      {/* Dates & notes */}
      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date given</label>
            <input
              type="date"
              value={dateGiven}
              onChange={(e) => setDateGiven(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected return (optional)</label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2"
              placeholder="Optional notes"
            />
          </div>
        </div>
      </Card>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={Object.keys(selected).length === 0 || submitting}
      >
        {submitting ? 'Saving...' : 'Save entry'}
      </Button>
    </div>
  );
}
