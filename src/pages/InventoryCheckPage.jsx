import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, Eye, Check, Trash2, FileText, ClipboardList, Calculator } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
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
      addLog('库存盘点', '完成盘点', `单号: ${order.orderNo}, 已强制修正库存`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="库存盘点" action={<button onClick={()=>setActiveTab('inventory-check-create')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md flex items-center gap-1.5"><Plus size={16}/>新建盘点</button>} />
      <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索单号/仓库" className="flex-1 md:max-w-xs" />
        <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 md:w-32 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none hover:border-slate-300 transition-all"><option value="">状态</option><option value="盘点中">盘点中</option><option value="已完成">已完成</option></select>
        <select value={warehouse} onChange={e=>{setWarehouse(e.target.value);setPage(1);}} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 md:w-32 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none hover:border-slate-300 transition-all"><option value="">全部仓库</option>{systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select>
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="p-4">单号</th><th className="p-4">仓库</th><th className="p-4">日期</th><th className="p-4">差异金额</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={i.id || idx} className="group hover:bg-slate-50 border-b border-slate-100"><td className="p-4 font-bold text-blue-600">{i.orderNo}</td><td className="p-4">{i.warehouse}</td><td className="p-4 text-slate-500">{i.date}</td><td className={`p-4 font-bold ${Number(i.diffAmount)<0?'text-rose-500':'text-emerald-500'}`}>¥{i.diffAmount}</td><td className="p-4"><Badge text={i.status}/></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">
              <div className="flex items-center gap-4">
                <button onClick={()=>{setCurrentDetail({type:'inventory-check',data:i}); setActiveTab('order-detail');}} className="text-blue-600 font-medium flex gap-1 items-center hover:text-blue-800"><Eye size={16}/>详情</button>
                <button onClick={()=>i.status==='盘点中'&&handleComplete(i.id)} className={`flex gap-1 items-center font-medium ${i.status==='盘点中'?'text-emerald-600 hover:text-emerald-800':'text-slate-300 pointer-events-none'}`}><Check size={16}/>{i.status==='盘点中'?'完成':'已完'}</button>
                <button onClick={()=>i.status === '盘点中' ? showConfirm('删除','确定删除吗？',()=>setInventoryChecks(inventoryChecks.filter(s=>s.id!==i.id))) : showMessage('凭证锁拦截', '已完成的盘点单禁止物理删除。')} className={`flex gap-1 items-center font-medium ${i.status==='盘点中'?'text-rose-500 hover:text-rose-700':'text-slate-300'}`}><Trash2 size={16}/>删除</button>
              </div>
            </td></tr>
          )) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
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
  const defaultProd = products[0]?.name || ''; const defaultWh = systemDict.warehouses[0];
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
    if (uniqueProducts.size !== items.length) return showMessage('重复拦截', '请合并重复商品的数量后重试！');

    const orderNo = 'PD' + Date.now();
    setInventoryChecks(prev => [{ id: Date.now(), orderNo, warehouse, date: getLocalDate(), itemCount: items.length, diffAmount: totalDiffAmount.toFixed(2), status: '盘点中', operator: 'admin', items, remark }, ...prev]);
    addLog('库存盘点', '发起盘点', `单号: ${orderNo}, 差异: ¥${totalDiffAmount.toFixed(2)}`);
    setActiveTab('inventory-check');
  };

  const handleWarehouseChange = (e) => {
    const newWh = e.target.value; setWarehouse(newWh);
    setItems(items.map(item => {
      const invItem = inventory.find(i => i.name === item.product && i.warehouse === newWh);
      const sysQty = invItem ? Number(invItem.currentStock) : 0;
      return { ...item, sysQty, actualQty: sysQty };
    }));
  };

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all hover:border-slate-300";

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto">
      <PageHeader title="新建盘点单" onBack={() => setActiveTab('inventory-check')} />
      
      {/* 基础配置卡片 */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
        <h3 className="text-base font-bold flex items-center gap-2 mb-6 text-slate-800">
          <FileText size={18} className="text-violet-500" /> 盘点任务信息
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">作业仓库</label><select value={warehouse} onChange={handleWarehouseChange} className={inputClass}>{systemDict.warehouses.map(w=><option key={w} value={w}>{w}</option>)}</select></div>
          <div className="lg:col-span-2"><label className="block text-sm font-semibold text-slate-700 mb-1.5">任务备注</label><input value={remark} onChange={e=>setRemark(e.target.value)} className={inputClass} placeholder="如：月底全面清查..."/></div>
        </div>
      </div>

      {/* 明细配置卡片 */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm flex-1">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold flex items-center gap-2 text-slate-800"><ClipboardList size={18} className="text-blue-500" /> 录入盘点数据</h3>
          <button onClick={() => {
            const pName = products[0]?.name||''; const invItem = inventory.find(i => i.name === pName && i.warehouse === warehouse);
            setItems([...items, { id: Date.now() + Math.random(), product: pName, sysQty: invItem ? Number(invItem.currentStock) : 0, actualQty: invItem ? Number(invItem.currentStock) : 0, price: products[0]?.price || 0 }]);
          }} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex gap-1.5 hover:bg-blue-100 transition-colors"><Plus size={16}/> 增加一行</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4 font-medium text-slate-600 min-w-[200px]">实物商品</th><th className="p-4 font-medium text-slate-600 w-28">系统账面</th><th className="p-4 font-medium text-slate-600 w-28">实际盘点</th><th className="p-4 font-medium text-slate-600 w-28">差异数量</th><th className="p-4 font-medium text-slate-600 w-28">商品估价</th><th className="p-4 font-medium text-slate-600 w-28">差异金额</th><th className="p-4 font-medium text-slate-600 w-20 sticky right-0 bg-slate-50">操作</th></tr></thead><tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} className="border-b group hover:bg-slate-50/50">
              <td className="p-3">
                <select value={item.product} onChange={e=>{
                  const prodName = e.target.value; const prod = products.find(p=>p.name === prodName);
                  const invItem = inventory.find(i => i.name === prodName && i.warehouse === warehouse);
                  const sysQty = invItem ? Number(invItem.currentStock) : 0;
                  setItems(items.map(i=>i.id===item.id?{...i, product: prodName, price: prod?.price||0, sysQty, actualQty: sysQty}:i))
                }} className={`${inputClass} !py-2`}>{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
              </td>
              <td className="p-3"><input type="number" value={item.sysQty} readOnly className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 outline-none font-medium cursor-not-allowed"/></td>
              <td className="p-3"><input type="number" min="0" value={item.actualQty} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i,actualQty:e.target.value}:i))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all hover:border-slate-300 font-bold text-blue-600"/></td>
              <td className={`p-3 font-bold text-base ${Number(item.actualQty) - Number(item.sysQty) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{Number(item.actualQty) - Number(item.sysQty)}</td>
              <td className="p-3 text-slate-500">¥{item.price}</td>
              <td className="p-3 font-bold text-slate-600 text-base">¥{((Number(item.actualQty)-Number(item.sysQty))*Number(item.price)).toFixed(2)}</td>
              <td className="p-3 cursor-pointer sticky right-0 bg-white group-hover:bg-slate-50/50"><button onClick={()=>setItems(items.filter(i=>i.id!==item.id))} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button></td>
            </tr>
          ))}
        </tbody></table></div>
      </div>

      {/* 底部控制台 */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:px-8 border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-200"><Calculator className="text-violet-600" size={24}/></div>
            <div><div className="text-sm text-slate-500 font-medium">盘亏/盘盈估值差异</div><div className="text-3xl font-black text-slate-800 tracking-tight">¥{totalDiffAmount.toFixed(2)}</div></div>
         </div>
         <div className="flex gap-4 w-full sm:w-auto">
            <button onClick={()=>setActiveTab('inventory-check')} className="flex-1 sm:flex-none px-8 py-3 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm">放弃任务</button>
            <button onClick={handleSubmit} className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-violet-500/30 transition-all">发起盘点记录</button>
         </div>
      </div>
    </div>
  );
};