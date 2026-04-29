import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, Eye, Check, Trash2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
import { getLocalDate } from '../utils';

export const StockInPage = () => {
  const { stockIn, setStockIn, showConfirm, showMessage, setActiveTab, setCurrentDetail, setInventory, setPayables, addLog, products, systemDict } = useContext(AppContext);
  const [tab, setTab] = useState('全部'); const [search, setSearch] = useState(''); const [warehouse, setWarehouse] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => stockIn.filter(i => (tab === '全部' || i.status === tab) && i.orderNo.includes(search) && (warehouse === '' || i.warehouse === warehouse)), [stockIn, tab, search, warehouse]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handleAudit = (id) => {
    showConfirm('审核入库单', '审核后库存将增加，并自动挂入应付账款，确定执行吗？', () => {
      const order = stockIn.find(s => s.id === id);
      setStockIn(stockIn.map(s => s.id === id ? { ...s, status: '已审核' } : s));
      setInventory(prev => {
        let updatedInv = prev.map(inv => ({...inv}));
        (order.items||[]).forEach(item => {
          const idx = updatedInv.findIndex(i => i.name === item.product && i.warehouse === order.warehouse);
          if (idx >= 0) {
            updatedInv[idx].currentStock = Number(updatedInv[idx].currentStock) + Number(item.qty);
            updatedInv[idx].status = updatedInv[idx].currentStock < updatedInv[idx].minStock ? '库存预警' : '正常';
          } else {
            const pInfo = products.find(p => p.name === item.product);
            updatedInv.push({ id: Date.now()+Math.random(), code: pInfo?.code||'-', spec: pInfo?.spec||'-', name: item.product, warehouse: order.warehouse, currentStock: Number(item.qty), status: '正常', minStock: 50 });
          }
        });
        return updatedInv;
      });
      if (order.type === '采购入库' || order.type === '退货入库') {
        setPayables(prev => {
          if (prev.some(p => p.orderNo === order.orderNo)) return prev;
          return [{ id: Date.now(), orderNo: order.orderNo, supplier: order.supplier, totalAmount: order.amount, paidAmount: '0.00', unpaidAmount: order.amount, status: '未结清', date: order.date, payments: [] }, ...prev];
        });
      }
      addLog('入库管理', '审核通过', `单号: ${order.orderNo}, 已同步库存及财务应付`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="入库管理" action={<button onClick={()=>setActiveTab('stock-in-create')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5"><Plus size={16}/>新建入库单</button>} />
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">{['全部', '待审核', '已审核'].map(t => <button key={t} onClick={()=>{setTab(t);setPage(1);}} className={`px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${tab===t?'border-blue-600 text-blue-600':'border-transparent text-slate-500 hover:text-slate-800'}`}>{t}</button>)}</div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="单号/备注" className="flex-1 sm:max-w-xs" />
        <select value={warehouse} onChange={e=>{setWarehouse(e.target.value);setPage(1);}} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 sm:w-36"><option value="">全部仓库</option>{systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select>
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* PC Table */}
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="p-4">单号</th><th className="p-4">日期</th><th className="p-4">类型</th><th className="p-4">仓库</th><th className="p-4">金额</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={i.id || idx} className="group hover:bg-slate-50 border-b border-slate-100"><td className="p-4 font-bold text-blue-600">{i.orderNo}</td><td className="p-4 text-slate-500">{i.date}</td><td className="p-4"><Badge text={i.type}/></td><td className="p-4">{i.warehouse}</td><td className="p-4 text-rose-500 font-bold">¥{i.amount}</td><td className="p-4"><Badge text={i.status}/></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">
              <div className="flex items-center gap-4">
                <button onClick={()=>{setCurrentDetail({type:'stock-in',data:i}); setActiveTab('order-detail');}} className="text-blue-600 font-medium flex gap-1 items-center"><Eye size={16}/>详情</button>
                <button onClick={()=>i.status==='待审核'&&handleAudit(i.id)} className={`flex gap-1 items-center font-medium ${i.status==='待审核'?'text-emerald-600':'text-slate-300 pointer-events-none'}`}><Check size={16}/>{i.status==='待审核'?'审核':'已审'}</button>
                <button onClick={()=> i.status === '待审核' ? showConfirm('删除','确定删除吗？',()=>setStockIn(stockIn.filter(s=>s.id!==i.id))) : showMessage('凭证锁拦截', '已审核生效的单据属于企业核心资产，禁止物理删除。如需冲正，请新建反向红字单据（如退货单）。')} className={`flex gap-1 items-center font-medium ${i.status==='待审核'?'text-rose-500':'text-slate-300'}`}><Trash2 size={16}/>删除</button>
              </div>
            </td></tr>
          )) : <tr><td colSpan="7"><EmptyState/></td></tr>}
        </tbody></table></div>
        {/* Mobile Card 省略保持一致 */}
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const StockInCreatePage = () => {
  const { setStockIn, setActiveTab, showMessage, suppliers, products, addLog, systemDict } = useContext(AppContext);
  const [items, setItems] = useState([{ id: Date.now() + Math.random(), product: products[0]?.name || '', qty: 1, price: products[0]?.price || 0 }]);
  const [supplier, setSupplier] = useState(suppliers[0]?.name || ''); const [warehouse, setWarehouse] = useState(systemDict.warehouses[0]);
  const [type, setType] = useState('采购入库'); const [remark, setRemark] = useState(''); const [date, setDate] = useState(getLocalDate());
  const total = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);

  const handleSubmit = () => {
    if(!items.length) return showMessage('错误', '请添加商品！');
    if(!supplier) return showMessage('错误', '请选择供应商！');
    if(items.some(i => Number(i.qty) <= 0)) return showMessage('数据防爆拦截', '入库商品数量必须大于 0 ！');
    
    const uniqueProducts = new Set(items.map(i => i.product));
    if (uniqueProducts.size !== items.length) return showMessage('排重拦截', '同一张单据内禁止分多行录入同款商品，请合并数量！');

    const orderNo = 'RK' + Date.now();
    setStockIn(prev => [{ id: Date.now(), orderNo, type, warehouse, supplier, date, amount: total.toFixed(2), status: '待审核', operator: 'admin', items, remark }, ...prev]);
    addLog('入库管理', '新建单据', `已创建草稿入库单: ${orderNo}`);
    setActiveTab('stock-in');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8 min-h-full border border-slate-100">
      <PageHeader title="新建入库单" onBack={() => setActiveTab('stock-in')} />
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div><label className="block text-sm font-medium mb-2">日期</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded-xl px-4 py-2 text-sm bg-white" /></div>
        <div><label className="block text-sm font-medium mb-2">类型</label><select value={type} onChange={e=>setType(e.target.value)} className="w-full border rounded-xl px-4 py-2 text-sm bg-white"><option>采购入库</option><option>退货入库</option></select></div>
        <div><label className="block text-sm font-medium mb-2">供应商</label><select value={supplier} onChange={e=>setSupplier(e.target.value)} className="w-full border rounded-xl px-4 py-2 text-sm bg-white">{suppliers.map(s => <option key={s.id}>{s.name}</option>)}</select></div>
        <div><label className="block text-sm font-medium mb-2">仓库</label><select value={warehouse} onChange={e=>setWarehouse(e.target.value)} className="w-full border rounded-xl px-4 py-2 text-sm bg-white">{systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select></div>
        <div className="lg:col-span-4"><label className="block text-sm font-medium mb-2">备注</label><textarea value={remark} onChange={e=>setRemark(e.target.value)} className="w-full border rounded-xl px-4 py-2 text-sm bg-white h-16"></textarea></div>
      </div>
      {/* 明细与提交按钮 */}
      <div className="mb-4 flex justify-between items-center"><h3 className="text-sm font-bold flex items-center"><span className="w-1.5 h-4 bg-emerald-500 rounded-full mr-2"></span>明细</h3><button onClick={() => setItems([...items, { id: Date.now() + Math.random(), product: products[0]?.name||'', qty: 1, price: products[0]?.price || 0 }])} className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-lg text-sm flex items-center gap-1"><Plus size={16}/>添加</button></div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-6"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4 min-w-[200px]">商品</th><th className="p-4 w-32">数量</th><th className="p-4 w-32">单价</th><th className="p-4 w-32">小计</th><th className="p-4 w-20 sticky right-0 bg-slate-50">操作</th></tr></thead><tbody>
        {items.map((item, idx) => (
          <tr key={item.id || idx} className="border-b group hover:bg-slate-50"><td className="p-2"><select value={item.product} onChange={e=>{
            const prod = products.find(p=>p.name===e.target.value);
            setItems(items.map(i=>i.id===item.id?{...i, product: e.target.value, price: prod?.price||0}:i));
          }} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500">{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></td><td className="p-2"><input type="number" min="1" value={item.qty} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,qty:e.target.value}:i))} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500"/></td><td className="p-2"><input type="number" min="0" step="0.01" value={item.price} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,price:e.target.value}:i))} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500"/></td><td className="p-2 text-rose-500 font-bold">¥{(Number(item.qty) * Number(item.price)).toFixed(2)}</td><td className="p-2 text-rose-500 cursor-pointer sticky right-0 bg-white" onClick={()=>setItems(items.filter(i=>i.id!==item.id))}><Trash2 size={18}/></td></tr>
        ))}
      </tbody></table></div>
      <div className="flex justify-between items-center"><span className="text-xl font-bold text-rose-600">总计: ¥{total.toFixed(2)}</span><div className="flex gap-4"><button onClick={()=>setActiveTab('stock-in')} className="px-6 py-2 border rounded-xl">取消</button><button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-xl">提交</button></div></div>
    </div>
  );
};