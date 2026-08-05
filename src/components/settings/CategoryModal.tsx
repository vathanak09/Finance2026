import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, Check, Palette, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Category } from '../../types/finance';
import {
  CATEGORY_ICONS,
  SOLID_COLORS,
  GRADIENT_COLORS,
  ALL_CATEGORY_COLORS,
  CategoryBadge
} from '../../utils/categoryIcons';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, editingCategory }) => {
  const { addCategory, updateCategory } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState<string>(SOLID_COLORS[0].value);
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0].id);
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>('solid');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      const curColor = editingCategory.color || SOLID_COLORS[0].value;
      setColor(curColor);
      setIcon(editingCategory.icon || CATEGORY_ICONS[0].id);
      setColorMode(curColor.includes('from-') ? 'gradient' : 'solid');
    } else {
      setName('');
      setType('expense');
      setColor(SOLID_COLORS[0].value);
      setIcon(CATEGORY_ICONS[0].id);
      setColorMode('solid');
    }
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, { name, type, color, icon });
    } else {
      await addCategory({ name, type, color, icon });
    }
    onClose();
  };

  const selectedColorObj = ALL_CATEGORY_COLORS.find(c => c.value === color) || {
    id: 'custom',
    name: color.startsWith('#') ? 'ពណ៌រាបស្មើ' : 'ពណ៌លាយ',
    value: color,
    type: colorMode
  };
  const selectedIconObj = CATEGORY_ICONS.find(i => i.id === icon) || CATEGORY_ICONS[0];

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative z-[101] animate-scale-in border border-slate-200 dark:border-slate-800 my-auto max-h-[92vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Tag className="w-4 h-4" />
            </div>
            <span>{editingCategory ? 'កែប្រែចំណាត់ថ្នាក់' : 'បង្កើតចំណាត់ថ្នាក់ថ្មី'}</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">ឈ្មោះចំណាត់ថ្នាក់ *</label>
            <input
              type="text"
              required
              placeholder="ឧ. អាហារ, ប្រាក់ខែ, សាំង, ផ្ទះ..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Type Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">ប្រភេទលំហូរ *</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                  type === 'expense' 
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                ចំណាយ (-)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                  type === 'income' 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                ចំណូល (+)
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CategoryBadge color={color} icon={icon} size="lg" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">មើលគំរូ (Preview)</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {name.trim() ? name : 'ឈ្មោះចំណាត់ថ្នាក់'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                type === 'expense'
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              }`}>
                {type === 'expense' ? 'ចំណាយ' : 'ចំណូល'}
              </span>
              <div className="text-[10px] text-slate-500 mt-1">
                {selectedIconObj.name} • {selectedColorObj.name.split(' ')[0]}
              </div>
            </div>
          </div>

          {/* Color Mode Switcher & Palette */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                ជម្រើសពណ៌ (Color Palette) *
              </label>
              <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setColorMode('solid')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    colorMode === 'solid'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Palette className="w-3 h-3" />
                  <span>ពណ៌រាបស្មើ ({SOLID_COLORS.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('gradient')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    colorMode === 'gradient'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>ពណ៌លាយ ({GRADIENT_COLORS.length})</span>
                </button>
              </div>
            </div>

            {/* Solid Colors Grid */}
            {colorMode === 'solid' && (
              <div className="grid grid-cols-8 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto">
                {SOLID_COLORS.map((col) => {
                  const isSelected = color === col.value;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      title={col.name}
                      onClick={() => setColor(col.value)}
                      style={{ backgroundColor: col.value }}
                      className={`group relative aspect-square rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-110 shadow-md z-10' 
                          : 'hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Gradient Colors Grid */}
            {colorMode === 'gradient' && (
              <div className="grid grid-cols-8 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto">
                {GRADIENT_COLORS.map((col) => {
                  const isSelected = color === col.value;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      title={col.name}
                      onClick={() => setColor(col.value)}
                      className={`group relative aspect-square rounded-lg bg-gradient-to-br ${col.value} flex items-center justify-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-110 shadow-md z-10' 
                          : 'hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SVG Icon Selection (34 Popular Icons) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                ជម្រើសរូបតំណាង SVG Icons *
              </label>
              <span className="text-[11px] text-slate-500 font-medium">{CATEGORY_ICONS.length} រូបតំណាង</span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-44 overflow-y-auto p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {CATEGORY_ICONS.map((ico) => {
                const isSelected = icon === ico.id;
                const IconComponent = ico.Icon;
                return (
                  <button
                    key={ico.id}
                    type="button"
                    title={ico.name}
                    onClick={() => setIcon(ico.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all cursor-pointer aspect-square ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-400'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/30 transition-all cursor-pointer active:scale-[0.99]"
            >
              {editingCategory ? 'រក្សាទុកការប្រែប្រួល' : 'បន្ថែមចំណាត់ថ្នាក់ថ្មី'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
