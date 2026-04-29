import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, Eye, Check, Trash2, FileText, Send, Calculator } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
import { getLocalDate } from '../utils';

export const StockOutPage = () => {
  const { stockOut, setStockOut, showConfirm, showMessage, setActiveTab, setCurrentDetail, setInventory, addLog, systemDict } = useContext(AppContext);
  const [tab, setTab] = useState('全部'); const [search, setSearch] = useState(''); const [warehouse, setWarehouse] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => stockOut.filter(i => (tab === '全部' || i.status === tab) && i.orderNo.includes(search) && (warehouse === '' || i.warehouse === warehouse)), [stockOut, tab, search, warehouse]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handleShip = (id) => {
    showConfirm('出库发货', '发货后库存将自动扣减，确定执行吗？', () => {
      const order = stockOut.find(s => s.id === id);
      setStockOut(stockOut.map(s => s.id === id ? { ...s, status: '已发货' } : s));
      setInventory(prev => {
        let updatedInv = prev.map(inv => ({...inv}));
        (order.items||[]).forEach(item => {
          const idx = updatedInv.findIndex(i => i.name === item.product && i.warehouse === order.warehouse);
          if (idx >= 0) {
            updatedInv[idx].currentStock = Math.max(0, Number(updatedInv[idx].currentStock) - Number(item.qty));
            updatedInv[idx].status = updatedInv[idx].currentStock < updatedInv[idx].minStock ? '库存预警' : '正常';
          }
        });
        return updatedInv;
      });
      addLog('出库管理', '发货确认', `单号: ${order.orderNo}, 已扣减库存`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full border border-slate-100 flex flex-col">
      <PageHeader title="出库管理" action={<button onClick={()=>setActiveTab('stock-out-create')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5"><Plus size={16}/>新建出库单</button>} />
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">{['全部', '待发货', '已发货'].map(t => <button key={t} onClick={()=>{setTab(t);setPage(1);}} className={`px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${tab===t?'border-blue-600 text-blue-600':'border-transparent text-slate-500 hover:text-slate-800'}`}>{t}</button>)}</div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="单号/备注" className="flex-1 sm:max-w-xs" />
        <select value={warehouse} onChange={e=>{setWarehouse(e.target.value);setPage(1);}} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 sm:w-36 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all hover:border-slate-300"><option value="">全部仓库</option>{systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select>
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="p-4">单号</th><th className="p-4">日期</th><th className="p-4">类型</th><th className="p-4">仓库</th><th className="p-4">客户</th><th className="p-4">金额</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={i.id || idx} className="group hover:bg-slate-50 border-b border-slate-100"><td className="p-4 font-bold text-blue-600">{i.orderNo}</td><td className="p-4 text-slate-500">{i.date}</td><td className="p-4"><Badge text={i.type}/></td><td className="p-4">{i.warehouse}</td><td className="p-4">{i.customer}</td><td className="p-4 text-rose-500 font-bold">¥{i.amount}</td><td className="p-4"><Badge text={i.status}/></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">
              <div className="flex items-center gap-4">
                <button onClick={()=>{setCurrentDetail({type:'stock-out',data:i}); setActiveTab('order-detail');}} className="text-blue-600 font-medium flex gap-1 items-center hover:text-blue-800"><Eye size={16}/>详情</button>
                <button onClick={()=>i.status==='待发货'&&handleShip(i.id)} className={`flex gap-1 items-center font-medium ${i.status==='待发货'?'text-emerald-600 hover:text-emerald-800':'text-slate-300 pointer-events-none'}`}><Check size={16}/>{i.status==='待发货'?'发货':'已发'}</button>
                <button onClick={()=>i.status === '待发货' ? showConfirm('删除','确定删除吗？',()=>setStockOut(stockOut.filter(s=>s.id!==i.id))) : showMessage('凭证锁拦截', '已发货的单据属于企业流水资产，禁止直接删除。')} className={`flex gap-1 items-center font-medium ${i.status==='待发货'?'text-rose-500 hover:text-rose-700':'text-slate-300'}`}><Trash2 size={16}/>删除</button>
              </div>
            </td></tr>
          )) : <tr><td colSpan="8"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600 text-base">{i.orderNo}</span><Badge text={i.status}/></div>
               <div className="text-sm text-slate-600 flex justify-between"><span>{i.date}</span> <span>客户: <span className="font-medium text-slate-800">{i.customer}</span></span></div>
               <div className="text-sm text-slate-600 flex justify-between"><span>仓库: {i.warehouse}</span> <span className="font-bold text-rose-500 text-base">¥{i.amount}</span></div>
               <div className="flex gap-4 mt-2 pt-3 border-t border-slate-50 justify-end">
                 <button onClick={()=>{setCurrentDetail({type:'stock-out',data:i}); setActiveTab('order-detail');}} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Eye size={14}/>详情</button>
                 {i.status==='待发货' && <button onClick={()=>handleShip(i.id)} className="text-emerald-600 text-sm font-medium flex gap-1 items-center"><Check size={14}/>发货</button>}
               </div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const StockOutCreatePage = () => {
  const { setStockOut, setActiveTab, showMessage, customers, products, inventory, addLog, systemDict } = useContext(AppContext);
  const [items, setItems] = useState([{ id: Date.now() + Math.random(), product: products[0]?.name || '', qty: 1, price: products[0]?.price || 0 }]);
  const [customer, setCustomer] = useState(customers[0]?.name || ''); const [warehouse, setWarehouse] = useState(systemDict.warehouses[0]);
  const [type, setType] = useState('销售出库'); const [remark, setRemark] = useState(''); const [date, setDate] = useState(getLocalDate());
  const total = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);

  const handleSubmit = () => {
    if(!items.length) return showMessage('错误', '请添加商品！');
    if(!customer) return showMessage('错误', '请选择客户！');
    if(items.some(i => Number(i.qty) <= 0)) return showMessage('数据防爆拦截', '出库商品数量必须大于 0 ！');
    const uniqueProducts = new Set(items.map(i => i.product));
    if (uniqueProducts.size !== items.length) return showMessage('排重拦截', '同一张单据内禁止录入重复商品！');

    const qtyMap = {};
    for (let item of items) qtyMap[item.product] = (qtyMap[item.product] || 0) + Number(item.qty);
    for (let productName in qtyMap) {
       const reqQty = qtyMap[productName];
       const invItem = inventory.find(i => i.name === productName && i.warehouse === warehouse);
       const currentStock = invItem ? Number(invItem.currentStock) : 0;
       if (currentStock < reqQty) return showMessage('库存不足被拦截', `商品 [${productName}] 在 [${warehouse}] 的库存仅 ${currentStock}件（需 ${reqQty}件）！`);
    }

    const orderNo = 'CK' + Date.now();
    setStockOut(prev => [{ id: Date.now(), orderNo, type, warehouse, customer, date, amount: total.toFixed(2), status: '待发货', operator: 'admin', items, remark }, ...prev]);
    addLog('出库管理', '新建单据', `已创建草稿出库单: ${orderNo}`);
    setActiveTab('stock-out');
  };

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all hover:border-slate-300";

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto">
      <PageHeader title="新建出库单" onBack={() => setActiveTab('stock-out')} />
      
      {/* 基础配置卡片 */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <h3 className="text-base font-bold flex items-center gap-2 mb-6 text-slate-800">
          <FileText size={18} className="text-emerald-500" /> 基础出库配置
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">出库日期</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">业务类型</label><select value={type} onChange={e=>setType(e.target.value)} className={inputClass}><option>销售出库</option><option>退货出库</option></select></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">目标客户</label><select value={customer} onChange={e=>setCustomer(e.target.value)} className={inputClass}>{customers.map(c => <option key={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">发货仓库</label><select value={warehouse} onChange={e=>setWarehouse(e.target.value)} className={inputClass}>{systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select></div>
          <div className="lg:col-span-4"><label className="block text-sm font-semibold text-slate-700 mb-1.5">单据备注</label><input value={remark} onChange={e=>setRemark(e.target.value)} className={inputClass} placeholder="选填，记录发货要求..." /></div>
        </div>
      </div>

      {/* 明细配置卡片 */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm flex-1">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold flex items-center gap-2 text-slate-800"><Send size={18} className="text-amber-500" /> 待出库明细</h3>
          <button onClick={() => setItems([...items, { id: Date.now() + Math.random(), product: products[0]?.name||'', qty: 1, price: products[0]?.price || 0 }])} className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl text-sm font-bold flex gap-1.5 hover:bg-amber-100 transition-colors"><Plus size={16}/> 增加一行</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4 font-medium text-slate-600 min-w-[200px]">商品名称</th><th className="p-4 font-medium text-slate-600 w-32">出库数量</th><th className="p-4 font-medium text-slate-600 w-32">出库单价</th><th className="p-4 font-medium text-slate-600 w-32">小计金额</th><th className="p-4 font-medium text-slate-600 w-20 sticky right-0 bg-slate-50">操作</th></tr></thead><tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="border-b group hover:bg-slate-50/50"><td className="p-3"><select value={item.product} onChange={e=>{const prod = products.find(p=>p.name===e.target.value); setItems(items.map(i=>i.id===item.id?{...i, product: e.target.value, price: prod?.price||0}:i));}} className={`${inputClass} !py-2`}>{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></td><td className="p-3"><input type="number" min="1" value={item.qty} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,qty:e.target.value}:i))} className={`${inputClass} !py-2`}/></td><td className="p-3"><input type="number" min="0" step="0.01" value={item.price} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,price:e.target.value}:i))} className={`${inputClass} !py-2`}/></td><td className="p-3 text-rose-600 font-bold text-base">¥{(Number(item.qty) * Number(item.price)).toFixed(2)}</td><td className="p-3 sticky right-0 bg-white group-hover:bg-slate-50/50"><button onClick={()=>setItems(items.filter(i=>i.id!==item.id))} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button></td></tr>
          ))}
        </tbody></table></div>
      </div>

      {/* 底部控制台 */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:px-8 border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200"><Calculator className="text-emerald-600" size={24}/></div>
            <div><div className="text-sm text-slate-500 font-medium">本单出库总额</div><div className="text-3xl font-black text-rose-600 tracking-tight">¥{total.toFixed(2)}</div></div>
         </div>
         <div className="flex gap-4 w-full sm:w-auto">
            <button onClick={()=>setActiveTab('stock-out')} className="flex-1 sm:flex-none px-8 py-3 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm">取消返回</button>
            <button onClick={handleSubmit} className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">确认创建草稿</button>
         </div>
      </div>
    </div>
  );
};