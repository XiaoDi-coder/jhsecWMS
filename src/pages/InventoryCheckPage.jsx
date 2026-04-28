import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, Eye, Check, Trash2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState } from '../components/common';
import { getLocalDate } from '../utils';

export const InventoryCheckPage = () => {
  const { inventoryChecks, setInventoryChecks, showConfirm, showMessage, setActiveTab, setCurrentDetail, setInventory, products, addLog, systemDict } = useContext(AppContext);
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [warehouse, setWarehouse] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => inventoryChecks.filter(i => (status===''||i.status===status) && (warehouse===''||i.warehouse===warehouse) && (i.orderNo.includes(search)||i.warehouse.includes(search))), [inventoryChecks, status, warehouse, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handleComplete = (id) => {
    showConfirm('完成盘点', '确认后差异将强制覆盖当前库存，确定吗？', () => {
      const order = inventoryChecks.find(s => s.id === id);
      setInventoryChecks(inventoryChecks.map(s => s.id === id ? { ...s, status: '已完成' } : s));
      setInventory(prev => {
        let updatedInv = prev.map(inv => ({...inv}));
        (order.items||[]).forEach(item => {
          const idx = updatedInv.findIndex(i => i.name === item.product && i.warehouse === order.warehouse);
          if (idx >= 0) {
            updatedInv[idx].currentStock = Number(item.actualQty);
            updatedInv[idx].status = updatedInv[idx].currentStock < updatedInv[idx].minStock ? '库存预警' : '正常';
          } else {
            const pInfo = products.find(p => p.name === item.product);
            updatedInv.push({ id: Date.now()+Math.random(), code: pInfo?.code||'-', spec: pInfo?.spec||'-', name: item.product, warehouse: order.warehouse, currentStock: Number(item.actualQty), status: Number(item.actualQty) < 50 ? '库存预警' : '正常', minStock: 50 });
          }
        });
        return updatedInv;
      });
      addLog('库存盘点', '完成盘点', `单号: ${order.orderNo}, 已强制修正库存基准`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="库存盘点" action={<button onClick={()=>setActiveTab('inventory-check-create')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md flex items-center gap-1.5"><Plus size={16}/>新建盘点</button>} />
      <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 md:max-w-xs"><input type="text" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索单号/仓库" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm outline-none bg-slate-50 focus:bg-white"/><Search className="absolute left-3.5 top-3 text-slate-400" size={18}/></div>
        <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 md:w-32"><option value="">状态</option><option value="盘点中">盘点中</option><option value="已完成">已完成</option></select>
        <select value={warehouse} onChange={e=>{setWarehouse(e.target.value);setPage(1);}} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 md:w-32"><option value="">全部仓库</option>{systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select>
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="p-4">单号</th><th className="p-4">仓库</th><th className="p-4">日期</th><th className="p-4">差异金额</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={i.id || idx} className="group hover:bg-slate-50 border-b border-slate-100"><td className="p-4 font-bold text-blue-600">{i.orderNo}</td><td className="p-4">{i.warehouse}</td><td className="p-4 text-slate-500">{i.date}</td><td className={`p-4 font-bold ${Number(i.diffAmount)<0?'text-rose-500':'text-emerald-500'}`}>¥{i.diffAmount}</td><td className="p-4"><Badge text={i.status}/></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">
              <div className="flex items-center gap-4">
                <button onClick={()=>{setCurrentDetail({type:'inventory-check',data:i}); setActiveTab('order-detail');}} className="text-blue-600 font-medium flex gap-1 items-center"><Eye size={16}/>详情</button>
                <button onClick={()=>i.status==='盘点中'&&handleComplete(i.id)} className={`flex gap-1 items-center font-medium ${i.status==='盘点中'?'text-emerald-600':'text-slate-300 pointer-events-none'}`}><Check size={16}/>{i.status==='盘点中'?'完成':'已完'}</button>
                <button onClick={()=>i.status === '盘点中' ? showConfirm('删除','确定删除吗？',()=>setInventoryChecks(inventoryChecks.filter(s=>s.id!==i.id))) : showMessage('凭证锁拦截', '已完成的盘点单已产生真实的库存修正，禁止物理删除。')} className={`flex gap-1 items-center font-medium ${i.status==='盘点中'?'text-rose-500':'text-slate-300'}`}><Trash2 size={16}/>删除</button>
              </div>
            </td></tr>
          )) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600">{i.orderNo}</span><Badge text={i.status}/></div>
               <div className="text-sm text-slate-600 flex justify-between"><span>{i.date}</span> <span>仓库: <span className="font-medium text-slate-800">{i.warehouse}</span></span></div>
               <div className="text-sm text-slate-600 flex justify-between items-center"><span>差异总计</span> <span className={`font-bold text-base ${Number(i.diffAmount)<0?'text-rose-500':'text-emerald-500'}`}>¥{i.diffAmount}</span></div>
               <div className="flex gap-4 mt-2 pt-3 border-t border-slate-50 justify-end">
                 <button onClick={()=>{setCurrentDetail({type:'inventory-check',data:i}); setActiveTab('order-detail');}} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Eye size={14}/>详情</button>
                 {i.status==='盘点中' && <button onClick={()=>handleComplete(i.id)} className="text-emerald-600 text-sm font-medium flex gap-1 items-center"><Check size={14}/>完成盘点</button>}
               </div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const InventoryCheckCreatePage = () => {
  const { setInventoryChecks, setActiveTab, showMessage, products, inventory, addLog, systemDict } = useContext(AppContext);
  
  const defaultProd = products[0]?.name || '';
  const defaultWh = systemDict.warehouses[0];
  const defaultInvItem = inventory.find(i => i.name === defaultProd && i.warehouse === defaultWh);
  const defaultSysQty = defaultInvItem ? Number(defaultInvItem.currentStock) : 0;

  const [items, setItems] = useState([{ id: Date.now() + Math.random(), product: defaultProd, sysQty: defaultSysQty, actualQty: defaultSysQty, price: products[0]?.price || 0 }]);
  const [warehouse, setWarehouse] = useState(defaultWh); 
  const [remark, setRemark] = useState('');
  
  const totalDiffAmount = items.reduce((sum, item) => sum + ((Number(item.actualQty) - Number(item.sysQty)) * Number(item.price)), 0);

  const handleSubmit = () => {
    if(!items.length) return showMessage('错误', '请添加盘点商品！');
    if(items.some(i => Number(i.actualQty) < 0)) return showMessage('数据防爆拦截', '实盘数量不能为负数！');

    const uniqueProducts = new Set(items.map(i => i.product));
    if (uniqueProducts.size !== items.length) {
      return showMessage('重复防爆拦截', '同一盘点单中禁止出现重复商品，请合并【实盘数量】后重试！');
    }

    const orderNo = 'PD' + Date.now();
    setInventoryChecks(prev => [{ id: Date.now(), orderNo, warehouse, date: getLocalDate(), itemCount: items.length, diffAmount: totalDiffAmount.toFixed(2), status: '盘点中', operator: 'admin', items, remark }, ...prev]);
    addLog('库存盘点', '发起盘点', `单号: ${orderNo}, 差异金额: ¥${totalDiffAmount.toFixed(2)}`);
    setActiveTab('inventory-check');
  };

  const handleWarehouseChange = (e) => {
    const newWh = e.target.value;
    setWarehouse(newWh);
    setItems(items.map(item => {
      const invItem = inventory.find(i => i.name === item.product && i.warehouse === newWh);
      const sysQty = invItem ? Number(invItem.currentStock) : 0;
      return { ...item, sysQty, actualQty: sysQty };
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8 min-h-full border border-slate-100">
      <PageHeader title="新建盘点单" onBack={() => setActiveTab('inventory-check')} />
      <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div><label className="block text-sm font-medium mb-2">仓库</label><select value={warehouse} onChange={handleWarehouseChange} className="w-full border rounded-xl px-4 py-2 bg-white">{systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select></div>
        <div className="lg:col-span-2"><label className="block text-sm font-medium mb-2">备注</label><input value={remark} onChange={e=>setRemark(e.target.value)} className="w-full border rounded-xl px-4 py-2 bg-white"/></div>
      </div>
      <div className="mb-4 flex justify-between items-center"><h3 className="text-sm font-bold flex items-center"><span className="w-1.5 h-4 bg-emerald-500 rounded-full mr-2"></span>明细</h3><button onClick={() => {
        const pName = products[0]?.name||'';
        const invItem = inventory.find(i => i.name === pName && i.warehouse === warehouse);
        const sysQty = invItem ? Number(invItem.currentStock) : 0;
        setItems([...items, { id: Date.now() + Math.random(), product: pName, sysQty, actualQty: sysQty, price: products[0]?.price || 0 }]);
      }} className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-lg text-sm flex gap-1"><Plus size={16}/>添加</button></div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-6"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4 min-w-[200px]">商品</th><th className="p-4 w-28">账面</th><th className="p-4 w-28">实盘</th><th className="p-4 w-28">差异数量</th><th className="p-4 w-28">单价</th><th className="p-4 w-28">差异金额</th><th className="p-4 w-20 sticky right-0 bg-slate-50">操作</th></tr></thead><tbody>
        {items.map((item, idx) => (
          <tr key={item.id || idx} className="border-b group hover:bg-slate-50">
            <td className="p-2">
              <select value={item.product} onChange={e=>{
                const prodName = e.target.value;
                const prod = products.find(p=>p.name === prodName);
                const invItem = inventory.find(i => i.name === prodName && i.warehouse === warehouse);
                const sysQty = invItem ? Number(invItem.currentStock) : 0;
                setItems(items.map(i=>i.id===item.id?{...i, product: prodName, price: prod?.price||0, sysQty, actualQty: sysQty}:i))
              }} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500">{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
            </td>
            <td className="p-2"><input type="number" value={item.sysQty} readOnly className="w-full border rounded px-2 py-1.5 bg-slate-50 outline-none text-slate-500 font-medium"/></td>
            <td className="p-2"><input type="number" min="0" value={item.actualQty} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,actualQty:e.target.value}:i))} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500 font-bold text-blue-600"/></td>
            <td className={`p-2 font-bold ${Number(item.actualQty) - Number(item.sysQty) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{Number(item.actualQty) - Number(item.sysQty)}</td>
            <td className="p-2 text-slate-500">¥{item.price}</td>
            <td className="p-2 font-bold text-slate-600">¥{((Number(item.actualQty)-Number(item.sysQty))*Number(item.price)).toFixed(2)}</td>
            <td className="p-2 text-rose-500 cursor-pointer sticky right-0 bg-white" onClick={()=>setItems(items.filter(i=>i.id!==item.id))}><Trash2 size={18}/></td>
          </tr>
        ))}
      </tbody></table></div>
      <div className="flex justify-between items-center"><span className="text-xl font-bold text-slate-800">总差异: ¥{totalDiffAmount.toFixed(2)}</span><div className="flex gap-4"><button onClick={()=>setActiveTab('inventory-check')} className="px-6 py-2 border rounded-xl">取消</button><button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-xl">提交</button></div></div>
    </div>
  );
};