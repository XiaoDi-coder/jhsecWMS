import { useState, useContext } from 'react';
import { Plus, Tag, X, Layers, Ruler } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, EmptyState } from '../components/common';

export const DictionaryManagePage = () => {
  const { systemDict, setSystemDict, showMessage, addLog } = useContext(AppContext);
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');

  // 防御性保护
  const safeDict = systemDict || {};
  const categories = Array.isArray(safeDict.categories) ? safeDict.categories : [];
  const units = Array.isArray(safeDict.units) ? safeDict.units : [];

  const handleAddCategory = () => {
    if (!newCategory.trim()) return showMessage('提示', '不可添加空标签！');
    if (categories.includes(newCategory.trim())) return showMessage('提示', '该分类标签已存在！');
    
    setSystemDict({ ...safeDict, categories: [...categories, newCategory.trim()] });
    addLog('数据字典', '新增字典项', `向 [物资分类池] 中添加了: ${newCategory.trim()}`);
    setNewCategory('');
  };

  const handleDeleteCategory = (item) => {
    setSystemDict({ ...safeDict, categories: categories.filter(i => i !== item) });
    addLog('数据字典', '移除字典项', `移除了 [物资分类池] 中的: ${item}`);
  };

  const handleAddUnit = () => {
    if (!newUnit.trim()) return showMessage('提示', '不可添加空标签！');
    if (units.includes(newUnit.trim())) return showMessage('提示', '该计量单位已存在！');
    
    setSystemDict({ ...safeDict, units: [...units, newUnit.trim()] });
    addLog('数据字典', '新增字典项', `向 [标准计量单位] 中添加了: ${newUnit.trim()}`);
    setNewUnit('');
  };

  const handleDeleteUnit = (item) => {
    setSystemDict({ ...safeDict, units: units.filter(i => i !== item) });
    addLog('数据字典', '移除字典项', `移除了 [标准计量单位] 中的: ${item}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="系统数据字典" />

      {/* 使用 grid 布局在 PC 端让两块内容并排显示，在移动端自动堆叠 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-4">
        
        {/* 物资分类池配置 */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Layers size={18} className="text-blue-500" />
            物资分类池 配置
          </h3>

          <div className="flex gap-3 mb-6">
            <input 
              type="text" 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder="输入新的分类标签并按回车..." 
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white transition-all w-full" 
            />
            <button 
              onClick={handleAddCategory} 
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
            >
              <Plus size={16} />添加
            </button>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100 flex-1 flex flex-col">
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {categories.map((item, idx) => (
                  <div key={idx} className="group bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm hover:border-blue-300 hover:bg-white transition-all animate-in zoom-in-95 duration-200">
                    <Tag size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    {item}
                    <button 
                      onClick={() => handleDeleteCategory(item)} 
                      className="w-5 h-5 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-colors flex-shrink-0"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-[150px]"><EmptyState /></div>
            )}
          </div>
        </div>

        {/* 标准计量单位配置 */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Ruler size={18} className="text-emerald-500" />
            标准计量单位 配置
          </h3>

          <div className="flex gap-3 mb-6">
            <input 
              type="text" 
              value={newUnit} 
              onChange={e => setNewUnit(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAddUnit()}
              placeholder="输入新的单位标签并按回车..." 
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white transition-all w-full" 
            />
            <button 
              onClick={handleAddUnit} 
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
            >
              <Plus size={16} />添加
            </button>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100 flex-1 flex flex-col">
            {units.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {units.map((item, idx) => (
                  <div key={idx} className="group bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-3 shadow-sm hover:border-emerald-300 hover:bg-white transition-all animate-in zoom-in-95 duration-200">
                    <Tag size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    {item}
                    <button 
                      onClick={() => handleDeleteUnit(item)} 
                      className="w-5 h-5 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-colors flex-shrink-0"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-[150px]"><EmptyState /></div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};