import React, { useState, useEffect } from 'react';
import { X, PackageSearch, Upload, Image as ImageIcon, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkspaceDialog } from '../common/WorkspaceDialog';
import { LostFoundItem, ItemCategory } from '../../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType?: 'lost' | 'found';
  itemToEdit?: LostFoundItem | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  reportType = 'found',
  itemToEdit,
}) => {
  const { addLostFoundItem, updateLostFoundItem, currentDate, t } = useApp();

  const [type, setType] = useState<'lost' | 'found'>(reportType);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [description, setDescription] = useState('');
  const [dateReported, setDateReported] = useState(currentDate);
  const [location, setLocation] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [contactInformation, setContactInformation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (itemToEdit) {
      setType(itemToEdit.reportType);
      setItemName(itemToEdit.itemName);
      setCategory(itemToEdit.category);
      setDescription(itemToEdit.description);
      setDateReported(itemToEdit.dateReported);
      setLocation(itemToEdit.location);
      setReporterName(itemToEdit.reporterName);
      setContactInformation(itemToEdit.contactInformation || '');
      setImageUrl(itemToEdit.imageUrl || '');
    } else {
      setType(reportType);
      setItemName('');
      setCategory('Electronics');
      setDescription('');
      setDateReported(currentDate);
      setLocation('');
      setReporterName('');
      setContactInformation('');
      setImageUrl('');
    }
    setErrors({});
  }, [itemToEdit, reportType, currentDate, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 300_000) {
        setErrors((previous) => ({ ...previous, image: 'Choose a PNG, JPEG, or WebP image under 300 KB.' }));
        return;
      }
      setErrors((previous) => ({ ...previous, image: '' }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!itemName.trim()) errs.itemName = t.required;
    if (!location.trim()) errs.location = t.required;
    if (!reporterName.trim()) errs.reporterName = t.required;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (itemToEdit) {
      updateLostFoundItem(itemToEdit.id, {
        reportType: type,
        itemName: itemName.trim(),
        category,
        description: description.trim(),
        dateReported,
        location: location.trim(),
        reporterName: reporterName.trim(),
        contactInformation: contactInformation.trim() || undefined,
        imageUrl: imageUrl || undefined,
      });
    } else {
      addLostFoundItem({
        reportType: type,
        itemName: itemName.trim(),
        category,
        description: description.trim(),
        dateReported,
        location: location.trim(),
        reporterName: reporterName.trim(),
        contactInformation: contactInformation.trim() || undefined,
        imageUrl: imageUrl || undefined,
      });
    }
    onClose();
  };

  const categories: ItemCategory[] = [
    'Electronics',
    'Clothing',
    'Bags',
    'Books',
    'Accessories',
    'School Supplies',
    'Other',
  ];

  return (
    <WorkspaceDialog label={itemToEdit ? t.edit : type === 'lost' ? t.reportLostItem : t.reportFoundItem} onClose={onClose} className="max-w-lg">
      <div className="workspace-panel">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                type === 'lost'
                  ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {itemToEdit
                  ? 'Edit Item Record'
                  : type === 'lost'
                  ? t.reportLostItem
                  : t.reportFoundItem}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fill in item details to assist in matching and safe recovery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
          {/* Report Type selector */}
          {!itemToEdit && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Report Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('found')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    type === 'found'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Found Item (Turned In)
                </button>
                <button
                  type="button"
                  onClick={() => setType('lost')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    type === 'lost'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Lost Item (Missing)
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              {t.itemName} *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Scientific Calculator fx-991, Blue Backpack..."
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.itemName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.itemName && (
              <span className="text-[11px] text-red-500 mt-0.5 block">{errors.itemName}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                {t.category} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                {t.date} *
              </label>
              <input
                type="date"
                value={dateReported}
                onChange={(e) => setDateReported(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              {t.location} *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Lab 3, Library 2nd floor, Main Gymnasium..."
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.location ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.location && (
              <span className="text-[11px] text-red-500 mt-0.5 block">{errors.location}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                {t.reportedBy} *
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Name of finder or student"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  errors.reporterName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.reporterName && (
                <span className="text-[11px] text-red-500 mt-0.5 block">{errors.reporterName}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Internal Contact Info
              </label>
              <input
                type="text"
                value={contactInformation}
                onChange={(e) => setContactInformation(e.target.value)}
                placeholder="Phone or staff extension"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              {t.description}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Color, brand, distinguishing marks, stickers, serial details..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Optional Photo Attachment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Photo / Image Preview (Optional)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {errors.image && <p role="alert" className="mt-1 text-xs text-red-600">{errors.image}</p>}
              {imageUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-red-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs md:text-sm rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </WorkspaceDialog>
  );
};
