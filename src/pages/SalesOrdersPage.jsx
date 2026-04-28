import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, Eye, Edit, Check, Trash2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState } from '../components/common';
import { getLocalDate } from '../utils';

export const SalesOrdersPage = () => {
  const { salesOrders, setSalesOrders, setActiveTab, showConfirm, showMessage, setCurrentDetail, setReceivables, setEditingRecord, addLog } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => salesOrders.filter(s => s.orderNo.includes(search) || s.customer.includes(search)), [salesOrders, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handleAudit = (id) => {
    const order = salesOrders.find(s => s.id === id);
    const isModifying = order.status === '修改申请中';
    
    showConfirm(isModifying ? '审批修改' : '审核订单', isModifying ? '审核通过后将更新订单与应收账款明细，确定执行吗？' : '审核后将自动生成应收账款记录，确定执行吗？', () => {
      setSalesOrders(salesOrders.map(s => s.id === id ? { ...s, status: '已审核' } : s));
      
      setReceivables(prev => {
        const isExist = prev.some(r => r.orderNo === order.orderNo);
        if (isExist) {
          return prev.map(r => {
            if(r.orderNo === order.orderNo) {
              const newUnrec = (parseFloat(order.totalAmount) - parseFloat(r.receivedAmount)).toFixed(2);
              let newStatus = '未结清';
              if (parseFloat(newUnrec) <= 0) newStatus = '已结清';
              else if (parseFloat(r.receivedAmount) > 0) newStatus = '部分结清';
              return { ...r, customer: order.customer, totalAmount: order.totalAmount, unreceivedAmount: newUnrec, status: newStatus };
            }
            return r;
          });
        } else {
          return [{ id: Date.now(), orderNo: order.orderNo, customer: order.customer, totalAmount: order.totalAmount, receivedAmount: '0.00', unreceivedAmount: order.totalAmount, status: '未结清', date: order.date, payments: [] }, ...prev];
        }
      });
      addLog('销售订单', '单据审核', `已审核单据: ${order.orderNo}, 并同步财务应收挂账`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="销售订单" action={<button onClick={() => {setEditingRecord(null); setActiveTab('sales-order-create');}} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md flex gap-1.5"><Plus size={16} />新建订单</button>} />
      <div className="flex gap-3 mb-6"><div className="relative flex-1 sm:max-w-md"><input type="text" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="单号/客户" className="w-full border rounded-xl px-4 py-2.5 pl-10 text-sm focus:ring-4 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white" /><Search className="absolute left-3.5 top-3 text-slate-400" size={18} /></div></div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* PC Table */}
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="p-4">订单号</th><th className="p-4">日期</th><th className="p-4">客户</th><th className="p-4">金额</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map((item, idx) => (
            <tr key={item.id || idx} className="border-b group hover:bg-slate-50 border-b border-slate-100"><td className="p-4 text-blue-600 font-bold">{item.orderNo}</td><td className="p-4 text-slate-500">{item.date}</td><td className="p-4 font-medium">{item.customer}</td><td className="p-4 text-rose-500 font-bold">¥{item.totalAmount}</td><td className="p-4"><Badge text={item.status}/></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">
              <div className="flex items-center gap-4">
                <button onClick={()=>{setCurrentDetail({type:'sales',data:item});setActiveTab('order-detail');}} className="text-blue-600 font-medium flex gap-1 items-center"><Eye size={16}/>详情</button>
                <button onClick={()=>{setEditingRecord(item);setActiveTab('sales-order-create');}} className={`flex gap-1 font-medium ${item.status==='草稿'||item.status==='已审核'?'text-blue-600 hover:text-blue-800':'text-slate-300 pointer-events-none'}`}><Edit size={16}/>{item.status==='已审核'?'修改':'编辑'}</button>
                <button onClick={()=>['草稿','修改申请中'].includes(item.status)&&handleAudit(item.id)} className={`flex gap-1 font-medium ${['草稿','修改申请中'].includes(item.status)?'text-emerald-600 hover:text-emerald-800':'text-slate-300 pointer-events-none'}`}><Check size={16}/>{item.status==='修改申请中'?'审批':(item.status==='草稿'?'审核':'已审')}</button>
                <button onClick={()=>['草稿','修改申请中'].includes(item.status) ? showConfirm('删除','确定删除吗？',()=>setSalesOrders(salesOrders.filter(s=>s.id!==item.id))) : showMessage('凭证锁拦截', '已审核生效的单据禁止物理删除，如需作废请发起退换货流程！')} className={`flex gap-1 font-medium ${['草稿','修改申请中'].includes(item.status)?'text-rose-500':'text-slate-300'}`}><Trash2 size={16}/>删除</button>
              </div>
            </td></tr>
          )) : <tr><td colSpan="6"><EmptyState /></td></tr>}
        </tbody></table></div>
        {/* Mobile Card */}
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
          {paginated.length > 0 ? paginated.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600">{item.orderNo}</span><Badge text={item.status}/></div>
               <div className="text-sm text-slate-600 flex justify-between"><span>{item.date}</span> <span>客户: <span className="font-medium text-slate-800">{item.customer}</span></span></div>
               <div className="text-sm text-slate-600 flex justify-between items-center"><span>订单总额</span> <span className="font-bold text-rose-500 text-base">¥{item.totalAmount}</span></div>
               <div className="flex gap-4 mt-2 pt-3 border-t border-slate-50 justify-end">
                 <button onClick={()=>{setCurrentDetail({type:'sales',data:item});setActiveTab('order-detail');}} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Eye size={14}/>详情</button>
                 {['草稿','修改申请中'].includes(item.status) && <button onClick={()=>handleAudit(item.id)} className="text-emerald-600 text-sm font-medium flex gap-1 items-center"><Check size={14}/>审批</button>}
               </div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const SalesOrderCreatePage = () => {
  const { setSalesOrders, setActiveTab, showMessage, editingRecord, setEditingRecord, products, addLog } = useContext(AppContext);
  const [items, setItems] = useState(editingRecord ? editingRecord.items.map(i => ({...i, id: i.id || Date.now() + Math.random()})) : [{ id: Date.now() + Math.random(), product: products[0]?.name||'', qty: 1, price: products[0]?.price||0 }]);
  const [customer, setCustomer] = useState(editingRecord ? editingRecord.customer : '客户 A'); 
  const [remark, setRemark] = useState(editingRecord ? editingRecord.remark : ''); 
  const [date, setDate] = useState(editingRecord ? editingRecord.date : getLocalDate());
  const total = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);

  const handleSubmit = () => {
    if(!items.length) return showMessage('错误', '请至少添加一件商品！');
    if(items.some(i => Number(i.qty) <= 0)) return showMessage('数据防爆拦截', '销售商品数量必须大于 0 ！');
    
    const uniqueProducts = new Set(items.map(i => i.product));
    if (uniqueProducts.size !== items.length) return showMessage('排重拦截', '同一张单据内禁止分多行录入同款商品，请合并数量！');

    const isModifying = editingRecord && editingRecord.status === '已审核';
    const newStatus = isModifying ? '修改申请中' : (editingRecord ? editingRecord.status : '草稿');
    const orderNo = editingRecord ? editingRecord.orderNo : 'SO' + Date.now();

    const orderData = { 
      orderNo, 
      customer, itemCount: items.length + '种', totalCount: items.reduce((s, i) => s + Number(i.qty), 0), 
      totalAmount: total.toFixed(2), status: newStatus, 
      operator: editingRecord ? editingRecord.operator : 'admin', items, remark, date 
    };

    if (editingRecord) {
      setSalesOrders(prev => prev.map(o => o.id === editingRecord.id ? { ...o, ...orderData } : o));
      if (isModifying) showMessage('成功', '修改申请已提交，等待主管审批！');
      addLog('销售订单', '编辑修改', `修改了销售单据: ${orderNo}`);
    } else {
      setSalesOrders(prev => [{ id: Date.now(), ...orderData }, ...prev]);
      addLog('销售订单', '新建单据', `已创建草稿销售单: ${orderNo}`);
    }
    
    setEditingRecord(null);
    setActiveTab('sales-orders');
  };

  const titleText = editingRecord ? (editingRecord.status === '已审核' ? '修改销售订单' : '编辑销售订单') : '新建销售订单';
  const submitText = editingRecord && editingRecord.status === '已审核' ? '提交申请' : '提交';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8 min-h-full border border-slate-100">
      <PageHeader title={titleText} onBack={() => { setEditingRecord(null); setActiveTab('sales-orders'); }} />
      <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div><label className="block text-sm font-medium mb-2">日期</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 bg-white" /></div>
        <div><label className="block text-sm font-medium mb-2">客户</label><select value={customer} onChange={e=>setCustomer(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 bg-white"><option>客户 A</option><option>客户 B</option></select></div>
        <div className="lg:col-span-3"><label className="block text-sm font-medium mb-2">备注</label><input value={remark} onChange={e=>setRemark(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 bg-white" /></div>
      </div>
      <div className="mb-4 flex justify-between items-center"><h3 className="text-sm font-bold flex items-center"><span className="w-1.5 h-4 bg-emerald-500 rounded-full mr-2"></span>商品明细</h3><button onClick={() => setItems([...items, { id: Date.now() + Math.random(), product: products[0]?.name||'', qty: 1, price: products[0]?.price||0 }])} className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5"><Plus size={16}/>添加</button></div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mb-8"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4 min-w-[200px]">商品</th><th className="p-4 w-32">数量</th><th className="p-4 w-32">单价</th><th className="p-4 w-32">小计</th><th className="p-4 w-20 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]">操作</th></tr></thead><tbody>
        {items.map((item, idx) => (
          <tr key={item.id || idx} className="border-b group hover:bg-slate-50"><td className="p-2"><select value={item.product} onChange={e=>{
            const prod = products.find(p=>p.name===e.target.value);
            setItems(items.map(i=>i.id===item.id?{...i, product: e.target.value, price: prod?.price||0}:i));
          }} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500">{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></td><td className="p-2"><input type="number" min="1" value={item.qty} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i, qty: e.target.value}:i))} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500"/></td><td className="p-2"><input type="number" min="0" step="0.01" value={item.price} onChange={e=>setItems(items.map(i=>i.id===item.id?{...i, price: e.target.value}:i))} className="w-full border rounded px-2 py-1.5 outline-none focus:ring-2 focus:border-blue-500"/></td><td className="p-2 text-rose-500 font-bold">¥{(Number(item.qty) * Number(item.price)).toFixed(2)}</td><td className="p-2 text-rose-400 cursor-pointer sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]" onClick={()=>setItems(items.filter(i=>i.id!==item.id))}><Trash2 size={18} /></td></tr>
        ))}
      </tbody></table></div>
      <div className="flex justify-between items-center"><span className="text-2xl font-bold text-rose-600">总计: ¥{total.toFixed(2)}</span><div className="flex gap-4"><button onClick={()=>{setEditingRecord(null); setActiveTab('sales-orders');}} className="w-32 py-2.5 border rounded-xl hover:bg-slate-50">取消</button><button onClick={handleSubmit} className="w-32 py-2.5 bg-blue-600 text-white rounded-xl shadow-md">{submitText}</button></div></div>
    </div>
  );
};