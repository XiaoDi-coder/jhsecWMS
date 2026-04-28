import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
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
      <PageHeader title="经销管理" action={<button onClick={()=>{setEditingRecord(null); setActiveTab('dealer-manage-create');}} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex gap-1.5"><Plus size={16}/>记录登记</button>} />
      <div className="flex mb-6"><SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索记录" className="w-full max-w-xs" /></div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* PC Table */}
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4">经销商</th><th className="p-4">商品名称</th><th className="p-4">数量</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={i.id || idx} className="border-b group hover:bg-slate-50"><td className="p-4 font-bold">{i.dealer}</td><td className="p-4 text-blue-600">{i.productName}</td><td className="p-4">{i.qty}</td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">
              <div className="flex items-center gap-4">
                 <button onClick={()=>{setEditingRecord(i);setActiveTab('dealer-manage-create');}} className="text-blue-600 flex items-center gap-1"><Edit size={16}/>编辑</button>
                 <button onClick={()=>showConfirm('删除', '确定删除?',()=>setDealerRecords(dealerRecords.filter(s=>s.id!==i.id)))} className="text-rose-500 flex items-center gap-1"><Trash2 size={16}/>删除</button>
              </div>
            </td></tr>
          )) : <tr><td colSpan="4"><EmptyState/></td></tr>}
        </tbody></table></div>
        {/* Mobile Card */}
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-slate-800">{i.dealer}</span></div>
               <div className="text-sm text-slate-600 flex justify-between border-b border-slate-50 pb-2"><span>商品: <span className="font-medium text-blue-600">{i.productName}</span></span> <span>数量: <span className="font-bold text-slate-800">{i.qty}</span></span></div>
               <div className="flex gap-4 pt-1 justify-end">
                 <button onClick={()=>{setEditingRecord(i);setActiveTab('dealer-manage-create');}} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Edit size={14}/>编辑</button>
                 <button onClick={()=>showConfirm('删除', '确定删除?',()=>setDealerRecords(dealerRecords.filter(s=>s.id!==i.id)))} className="text-rose-500 text-sm font-medium flex gap-1 items-center"><Trash2 size={14}/>删除</button>
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
    if(items.some(i => Number(i.qty) <= 0)) return showMessage('数据防爆拦截', '发货铺货数量必须大于 0 ！');
    
    const uniqueProducts = new Set(items.map(i => i.product));
    if (uniqueProducts.size !== items.length) return showMessage('排重拦截', '同一张单据内禁止分多行录入同款商品，请合并数量！');

    const newRecords = items.map(item => {
       const pInfo = products.find(p => p.name === item.product) || { code: '-', spec: '-' };
       return {
         id: editingRecord ? editingRecord.id : Date.now() + Math.random(),
         dealer, date, remark, productCode: pInfo.code, productName: item.product,
         spec: pInfo.spec, qty: item.qty, price: Number(item.price).toFixed(2), operator: 'admin'
       };
    });

    if (editingRecord) {
       setDealerRecords(prev => {
          const filt = prev.filter(r => r.id !== editingRecord.id);
          return [...newRecords, ...filt];
       });
    } else {
       setDealerRecords(prev => [...newRecords, ...prev]);
    }
    
    setEditingRecord(null);
    setActiveTab('dealer-manage');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8 min-h-full border border-slate-100">
      <PageHeader title={editingRecord ? "编辑经销记录" : "新建经销记录"} onBack={() => { setEditingRecord(null); setActiveTab('dealer-manage'); }} />
      <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div><label className="block text-sm font-medium mb-2">经销商</label><select value={dealer} onChange={e=>setDealer(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 bg-white"><option>经销商A</option><option>经销商B</option></select></div>
        <div><label className="block text-sm font-medium mb-2">发生日期</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 bg-white" /></div>
        <div className="lg:col-span-3"><label className="block text-sm font-medium mb-2">备注</label><input value={remark} onChange={e=>setRemark(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 bg-white" /></div>
      </div>
      <div className="mb-4 flex justify-between items-center"><h3 className="text-sm font-bold flex items-center"><span className="w-1.5 h-4 bg-emerald-500 rounded-full mr-2"></span>商品明细</h3>{!editingRecord && <button onClick={() => setItems([...items, { id: Date.now() + Math.random(), product: products[0]?.name||'', qty: 1, price: products[0]?.price||0 }])} className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-lg text-sm flex gap-1"><Plus size={16}/>添加</button>}</div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-6"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4 min-w-[200px]">商品</th><th className="p-4 w-32">数量</th><th className="p-4 w-32">单价</th><th className="p-4 w-32">小计</th>{!editingRecord && <th className="p-4 w-20 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]">操作</th>}</tr></thead><tbody>
        {items.map((item, idx) => (
          <tr key={item.id || idx} className="border-b group hover:bg-slate-50"><td className="p-2"><select value={item.product} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i, product: e.target.value, price: products.find(p=>p.name===e.target.value)?.price||0}:i))} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500">{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></td><td className="p-2"><input type="number" min="1" value={item.qty} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,qty:e.target.value}:i))} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500"/></td><td className="p-2"><input type="number" min="0" step="0.01" value={item.price} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,price:e.target.value}:i))} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500"/></td><td className="p-2 text-rose-500 font-bold">¥{(Number(item.qty) * Number(item.price)).toFixed(2)}</td>{!editingRecord && <td className="p-2 text-rose-500 cursor-pointer sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]" onClick={()=>setItems(items.filter(i=>i.id!==item.id))}><Trash2 size={18}/></td>}</tr>
        ))}
      </tbody></table></div>
      <div className="flex justify-between items-center"><span className="text-xl font-bold text-rose-600">总计: ¥{total.toFixed(2)}</span><div className="flex gap-4"><button onClick={()=>{setEditingRecord(null); setActiveTab('dealer-manage');}} className="px-6 py-2 border rounded-xl">取消</button><button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-xl">提交</button></div></div>
    </div>
  );
};