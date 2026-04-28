import React, { useState, useMemo, useContext } from 'react';
import { Search, RotateCw } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState } from '../components/common';

export const InventoryQueryPage = () => {
  const { inventory, products, systemDict } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [page, setPage] = useState(1);

  const enhanced = useMemo(() => inventory.map(item => {
    const prod = products.find(p => p.name === item.name) || {};
    return { 
      ...item, 
      code: item.code || prod.code || '-', 
      category: prod.category || '-', 
      unit: prod.unit || '-', 
      status: Number(item.currentStock) < Number(item.minStock || 50) ? '库存预警' : '正常' 
    };
  }).filter(i => 
    (i.name.includes(search) || (i.code && i.code.includes(search))) && 
    (warehouse === '' || i.warehouse === warehouse)
  ), [inventory, products, search, warehouse]);

  const safePage = Math.max(1, Math.min(page, Math.ceil(enhanced.length / 10) || 1));
  const paginated = enhanced.slice((safePage - 1) * 10, safePage * 10);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader 
        title="库存查询" 
        action={
          <button onClick={()=>{setSearch('');setWarehouse('');setPage(1);}} className="text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 flex items-center gap-1.5">
            <RotateCw size={16}/>刷新
          </button>
        } 
      />
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 md:max-w-xs">
          <input type="text" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="商品编码/名称" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white"/>
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18}/>
        </div>
        <select value={warehouse} onChange={e=>{setWarehouse(e.target.value);setPage(1);}} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 md:w-40 focus:ring-4 focus:border-blue-500">
          <option value="">全部仓库</option>
          {systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* PC Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr><th className="p-4">仓库</th><th className="p-4">编码</th><th className="p-4">名称</th><th className="p-4">分类</th><th className="p-4">单位</th><th className="p-4">当前库存</th><th className="p-4">状态</th></tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                  <td className="p-4 font-medium">{item.warehouse}</td>
                  <td className="p-4 text-slate-500 font-mono">{item.code}</td>
                  <td className="p-4 text-blue-600 font-bold">{item.name}</td>
                  <td className="p-4">{item.category}</td>
                  <td className="p-4">{item.unit}</td>
                  <td className={`p-4 font-bold text-base ${item.status==='库存预警'?'text-rose-500':'text-slate-800'}`}>{item.currentStock}</td>
                  <td className="p-4"><Badge text={item.status}/></td>
                </tr>
              )) : <tr><td colSpan="7"><EmptyState /></td></tr>}
            </tbody>
          </table>
        </div>
        {/* Mobile Card */}
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
          {paginated.length > 0 ? paginated.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600 text-base">{item.name}</span> <Badge text={item.status} /></div>
               <div className="text-sm text-slate-600 flex justify-between"><span>编码: {item.code}</span> <span>仓库: <span className="font-medium text-slate-800">{item.warehouse}</span></span></div>
               <div className="text-sm text-slate-600 flex justify-between"><span>分类: {item.category}</span> <span>库存: <span className={`font-bold text-base ${item.status==='库存预警'?'text-rose-500':'text-slate-800'}`}>{item.currentStock}</span> {item.unit}</span></div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={enhanced.length} totalPages={Math.ceil(enhanced.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};