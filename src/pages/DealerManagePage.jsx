import React, { useState, useMemo, useContext } from 'react';
import { Plus, Edit, Trash2, FileText, Truck, Calculator,PackageSearch } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Pagination, EmptyState, SearchBar } from '../components/common';
import { getLocalDate } from '../utils';

export const DealerManagePage = () => {
  const { dealerRecords, setDealerRecords, showConfirm, setActiveTab, setEditingRecord } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => dealerRecords.filter(item => item.dealer.includes(search) || item.productName.includes(search)), [dealerRecords, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full border border-slate-100 flex flex-col">
      <PageHeader 
        title="经销管理" 
        action={
          <button 
            onClick={()=>{setEditingRecord(null); setActiveTab('dealer-manage-create');}} 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex gap-1.5 shadow-md hover:bg-blue-700 hover:shadow-blue-500/20 transition-all"
          >
            <Plus size={16}/>新增调拨登记
          </button>
        } 
      />
      
      <div className="flex gap-3 mb-6">
        <SearchBar 
          value={search} 
          onChange={e=>{setSearch(e.target.value);setPage(1);}} 
          placeholder="搜索经销商或商品名称" 
          className="flex-1 sm:max-w-md" 
        />
      </div>

      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* PC 端表格展示 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium">节点经销商</th>
                <th className="p-4 font-medium">商品资产</th>
                <th className="p-4 font-medium">调拨数量</th>
                <th className="p-4 font-medium sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">管控操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((i, idx) => (
                <tr key={i.id || idx} className="border-b group hover:bg-slate-50/80 transition-colors border-slate-100">
                  <td className="p-4 font-bold text-slate-800">{i.dealer}</td>
                  <td className="p-4 text-blue-600 font-medium">{i.productName}</td>
                  <td className="p-4 font-bold text-slate-700">{i.qty}</td>
                  <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50/80 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap transition-colors">
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={()=>{setEditingRecord(i);setActiveTab('dealer-manage-create');}} 
                         className="text-blue-600 flex items-center gap-1.5 font-medium hover:text-blue-800 transition-colors"
                       >
                         <Edit size={16}/>调档编辑
                       </button>
                       <button 
                         onClick={()=>showConfirm('撤销记录', '确定注销该经销记录吗？此操作不可恢复。',()=>setDealerRecords(dealerRecords.filter(s=>s.id!==i.id)))} 
                         className="text-rose-500 flex items-center gap-1.5 font-medium hover:text-rose-700 transition-colors"
                       >
                         <Trash2 size={16}/>注销
                       </button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="4"><EmptyState/></td></tr>}
            </tbody>
          </table>
        </div>

        {/* 移动端卡片展示 */}
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 hover:border-blue-200 transition-colors">
               <div className="flex justify-between items-center">
                 <span className="font-bold text-slate-800 text-base">{i.dealer}</span>
               </div>
               <div className="text-sm text-slate-600 flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                 <span className="flex items-center gap-1.5">
                   <PackageSearch size={14} className="text-blue-500"/>
                   物资: <span className="font-medium text-blue-600">{i.productName}</span>
                 </span> 
                 <span>
                   数量: <span className="font-bold text-slate-800 text-base">{i.qty}</span>
                 </span>
               </div>
               <div className="flex gap-4 pt-2 border-t border-slate-50 justify-end">
                 <button 
                   onClick={()=>{setEditingRecord(i);setActiveTab('dealer-manage-create');}} 
                   className="text-blue-600 text-sm font-medium flex gap-1 items-center px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                 >
                   <Edit size={14}/>编辑
                 </button>
                 <button 
                   onClick={()=>showConfirm('撤销记录', '确定注销?',()=>setDealerRecords(dealerRecords.filter(s=>s.id!==i.id)))} 
                   className="text-rose-500 text-sm font-medium flex gap-1 items-center px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                 >
                   <Trash2 size={14}/>注销
                 </button>
               </div>
            </div>
          )) : <EmptyState />}
        </div>
        
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const DealerManageCreatePage = () => {
  const { setDealerRecords, setActiveTab, showMessage, products, editingRecord, setEditingRecord } = useContext(AppContext);
  const [dealer, setDealer] = useState(editingRecord ? editingRecord.dealer : '经销商A');
  const [date, setDate] = useState(editingRecord ? editingRecord.date : getLocalDate());
  const [remark, setRemark] = useState(editingRecord ? editingRecord.remark : '');
  const [items, setItems] = useState(editingRecord ? [{ id: editingRecord.id, product: editingRecord.productName, qty: editingRecord.qty, price: editingRecord.price }] : [{ id: Date.now() + Math.random(), product: products[0]?.name || '', qty: 1, price: products[0]?.price || 0 }]);
  
  const total = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);

  const handleSubmit = () => {
    if(!items.length) return showMessage('错误', '请至少添加一件商品！');
    if(items.some(i => Number(i.qty) <= 0)) return showMessage('数据防爆拦截', '调拨数量必须大于 0 ！');
    const uniqueProducts = new Set(items.map(i => i.product));
    if (uniqueProducts.size !== items.length) return showMessage('排重拦截', '不允许重复项，请合并！');

    const newRecords = items.map(item => {
       const pInfo = products.find(p => p.name === item.product) || { code: '-', spec: '-' };
       return { id: editingRecord ? editingRecord.id : Date.now() + Math.random(), dealer, date, remark, productCode: pInfo.code, productName: item.product, spec: pInfo.spec, qty: item.qty, price: Number(item.price).toFixed(2), operator: 'admin' };
    });

    if (editingRecord) setDealerRecords(prev => [...newRecords, ...prev.filter(r => r.id !== editingRecord.id)]);
    else setDealerRecords(prev => [...newRecords, ...prev]);
    
    setEditingRecord(null); setActiveTab('dealer-manage');
  };

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all hover:border-slate-300";

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto">
      <PageHeader title={editingRecord ? "编辑经销网络铺货" : "新建经销网络铺货"} onBack={() => { setEditingRecord(null); setActiveTab('dealer-manage'); }} />
      
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <h3 className="text-base font-bold flex items-center gap-2 mb-6 text-slate-800"><FileText size={18} className="text-blue-500" /> 铺货网点指派</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">指派经销商</label><select value={dealer} onChange={e=>setDealer(e.target.value)} className={inputClass}><option>经销商A</option><option>经销商B</option></select></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">下发日期</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inputClass} /></div>
          <div className="lg:col-span-3"><label className="block text-sm font-semibold text-slate-700 mb-1.5">调拨纪要</label><input value={remark} onChange={e=>setRemark(e.target.value)} className={inputClass} placeholder="记录相关批次与合同要求..." /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm flex-1">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold flex items-center gap-2 text-slate-800"><Truck size={18} className="text-emerald-500" /> 下发资产明细</h3>
          {!editingRecord && <button onClick={() => setItems([...items, { id: Date.now() + Math.random(), product: products[0]?.name||'', qty: 1, price: products[0]?.price||0 }])} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold flex gap-1.5 hover:bg-emerald-100 transition-colors"><Plus size={16}/> 增加一行</button>}
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4 font-medium text-slate-600 min-w-[200px]">调拨物资</th><th className="p-4 font-medium text-slate-600 w-32">下发数量</th><th className="p-4 font-medium text-slate-600 w-32">核定单价</th><th className="p-4 font-medium text-slate-600 w-32">估值小计</th>{!editingRecord && <th className="p-4 font-medium text-slate-600 w-20 sticky right-0 bg-slate-50">操作</th>}</tr></thead><tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="border-b group hover:bg-slate-50/50"><td className="p-3"><select value={item.product} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i, product: e.target.value, price: products.find(p=>p.name===e.target.value)?.price||0}:i))} className={`${inputClass} !py-2`}>{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></td><td className="p-3"><input type="number" min="1" value={item.qty} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,qty:e.target.value}:i))} className={`${inputClass} !py-2`}/></td><td className="p-3"><input type="number" min="0" step="0.01" value={item.price} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,price:e.target.value}:i))} className={`${inputClass} !py-2`}/></td><td className="p-3 text-emerald-600 font-bold text-base">¥{(Number(item.qty) * Number(item.price)).toFixed(2)}</td>{!editingRecord && <td className="p-3 cursor-pointer sticky right-0 bg-white group-hover:bg-slate-50/50"><button onClick={()=>setItems(items.filter(i=>i.id!==item.id))} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button></td>}</tr>
          ))}
        </tbody></table></div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 sm:px-8 border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200"><Calculator className="text-blue-600" size={24}/></div>
            <div><div className="text-sm text-slate-500 font-medium">本次下发网点资产估值</div><div className="text-3xl font-black text-slate-800 tracking-tight">¥{total.toFixed(2)}</div></div>
         </div>
         <div className="flex gap-4 w-full sm:w-auto">
            <button onClick={()=>{setEditingRecord(null); setActiveTab('dealer-manage');}} className="flex-1 sm:flex-none px-8 py-3 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm">取消返回</button>
            <button onClick={handleSubmit} className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all">确认发布数据</button>
         </div>
      </div>
    </div>
  );
};