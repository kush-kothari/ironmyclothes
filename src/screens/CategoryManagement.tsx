import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useCategories } from '../hooks/useCategories';

export default function CategoryManagement() {
  const { categories, loading, error, updatePrice, addCategory, removeCategory } = useCategories();
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('10');
  const [editingPrice, setEditingPrice] = useState<Record<number, string>>({});

  const handleSavePrice = async (id: number) => {
    const raw = editingPrice[id];
    if (raw == null) return;
    const price = parseFloat(raw);
    if (!Number.isNaN(price) && price >= 0) {
      await updatePrice(id, price);
      setEditingPrice((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleAddCustom = async () => {
    const name = newName.trim();
    const price = parseFloat(newPrice);
    if (!name || Number.isNaN(price) || price < 0) return;
    await addCategory(name, price);
    setNewName('');
    setNewPrice('10');
  };

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
      </div>
    );
  }

  const predefined = categories.filter((c) => c.isCustom === 0);
  const custom = categories.filter((c) => c.isCustom === 1);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Category & price</h1>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Predefined categories</h2>
        <div className="space-y-2">
          {predefined.map((c) => (
            <Card key={c.id} className="p-4 flex items-center justify-between gap-2">
              <span className="font-medium text-gray-900">{c.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">₹</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={editingPrice[c.id] ?? c.price}
                  onChange={(e) => setEditingPrice((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  onBlur={() => handleSavePrice(c.id)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-right"
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Custom categories</h2>
        {custom.length > 0 && (
          <div className="space-y-2">
            {custom.map((c) => (
              <Card key={c.id} className="p-4 flex items-center justify-between gap-2">
                <span className="font-medium text-gray-900">{c.name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editingPrice[c.id] ?? c.price}
                    onChange={(e) => setEditingPrice((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    onBlur={() => handleSavePrice(c.id)}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-right"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(c.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="border border-gray-300 rounded-xl px-3 py-2 flex-1 min-w-[120px]"
          />
          <input
            type="number"
            min={0}
            step={1}
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="w-20 border border-gray-300 rounded-xl px-2 py-2 text-right"
          />
          <Button onClick={handleAddCustom} className="gap-1">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
