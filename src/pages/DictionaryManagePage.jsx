import React, { useContext } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader } from '../components/common';

export const DictionaryManagePage = () => {
  const { systemDict, setSystemDict, showForm, showConfirm, addLog } = useContext(AppContext);

  const handleAdd = (key, title) => {
    showForm(`新增${title}`, [{ name: 'value', label: `输入新${title}名称` }], {}, (data) => {
      if (!data.value || data.value.trim() === '') return;
      if (systemDict[key].includes(data.value)) return; 
      setSystemDict({ ...systemDict, [key]: [...systemDict[key], data.value] });
      addLog('数据字典', '新增字典项', `为 [${title}] 增加了新的选项: ${data.value}`);
    });
  };

  const handleDel = (key, val, title) => {
    showConfirm('删除字典项', `确定要从系统中移除字典项 [${val}] 吗？此操作不可逆。`, () => {
      setSystemDict({ ...systemDict, [key]: systemDict[key].filter(v => v !== val) });
      addLog('数据字典', '移除字典项', `删除了 [${title}] 中的选项: ${val}`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100 relative">
      <PageHeader title="全局数据字典控制台" />
      <div className="text-sm text-slate-500 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-3 items-center">
        <BookOpen size={24} className="text-blue-500 flex-shrink-0" />
        在此处配置的字典选项，将实时对全系统所有“下拉选择框”动态生效（例如新增商品时的分类、入库时的仓库选择等）。
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { key: 'categories', title: '商品体系分类' },
          { key: 'units', title: '商品计量单位' },
          { key: 'warehouses', title: '物理仓库节点' }
        ].map(section => (
          <div key={section.key} className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col shadow-sm">
             <div className="flex justify-between items-center mb-5 border-b border-slate-200 pb-3">
               <h3 className="font-bold text-slate-800">{section.title}</h3>
               <button onClick={()=>handleAdd(section.key, section.title)} className="text-blue-600 hover:text-blue-800 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 transition-colors"><Plus size={16}/></button>
             </div>
             <div className="flex flex-wrap gap-2.5">
                {systemDict[section.key].map(c => (
                  <span key={c} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm flex items-center gap-2 shadow-sm text-slate-700 font-medium group transition-all hover:border-blue-300">
                    {c} 
                    <button onClick={()=>handleDel(section.key, c, section.title)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                  </span>
                ))}
                {systemDict[section.key].length === 0 && <span className="text-xs text-slate-400">暂无配置数据</span>}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};