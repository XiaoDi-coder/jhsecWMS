import React, { useState, useMemo, useContext } from 'react';
import { Search, Eye, Edit, CreditCard, Check } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
import { getLocalDate } from '../utils';

export const ReceivablesPage = () => {
  const { receivables, setReceivables, showForm, showMessage, setCurrentDetail, setActiveTab, addLog } = useContext(AppContext);
  const [tab, setTab] = useState('全部'); const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => receivables.filter(i => (tab === '全部' || i.status === tab) && (i.orderNo.includes(search) || i.customer.includes(search))), [receivables, tab, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handlePayment = (item) => {
    showForm('登记收款', [{ name: 'amount', label: `本次收款 (最多: ¥${item.unreceivedAmount})`, type: 'number' }, { name: 'voucherNo', label: '凭证号' }, { name: 'date', label: '收款日期', type: 'date' }], { date: getLocalDate() }, (form) => {
      const pAmt = parseFloat(form.amount);
      if (isNaN(pAmt) || pAmt <= 0 || pAmt > parseFloat(item.unreceivedAmount)) return showMessage('错误', '金额不合法或超出应收总额！');
      const unrec = (parseFloat(item.totalAmount) - (parseFloat(item.receivedAmount) + pAmt)).toFixed(2);
      setReceivables(receivables.map(r => r.id === item.id ? { ...r, receivedAmount: (parseFloat(item.receivedAmount) + pAmt).toFixed(2), unreceivedAmount: unrec, status: Number(unrec) <= 0 ? '已结清' : '部分结清', payments: [...(r.payments||[]), { date: form.date, amount: pAmt.toFixed(2), voucherNo: form.voucherNo }] } : r));
      addLog('应收管理', '登记收款', `单号: ${item.orderNo}, 金额: ¥${pAmt.toFixed(2)}`);
    });
  };

  const handleEdit = (item) => {
    showForm('编辑应收记录', [{ name: 'date', label: '发生日期', type: 'date' }, { name: 'customer', label: '客户名称' }], item, (formData) => {
      if (!formData.date || !formData.customer) return showMessage('警告', '必填项不能为空');
      setReceivables(receivables.map(r => r.id === item.id ? { ...r, ...formData } : r));
      addLog('应收管理', '修改记录', `单号: ${item.orderNo}`);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="应收管理" />
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">{['全部', '未结清', '部分结清', '已结清'].map(t => <button key={t} onClick={()=>{setTab(t);setPage(1);}} className={`px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${tab===t?'border-blue-600 text-blue-600':'border-transparent text-slate-500'}`}>{t}</button>)}</div>
      <div className="flex mb-6"><SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="单号/客户" className="flex-1 sm:max-w-md" /></div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="p-4">订单号</th><th className="p-4">客户</th><th className="p-4">总额</th><th className="p-4">未收金额</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={i.id || idx} className="group hover:bg-slate-50 border-b border-slate-100"><td className="p-4 text-blue-600 font-bold">{i.orderNo}</td><td className="p-4 font-medium">{i.customer}</td><td className="p-4">¥{i.totalAmount}</td><td className="p-4 text-rose-500 font-bold">¥{i.unreceivedAmount}</td><td className="p-4"><Badge text={i.status}/></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">
              <div className="flex items-center gap-4">
                <button onClick={()=>{setCurrentDetail({type:'receivable',data:i});setActiveTab('order-detail');}} className="text-blue-600 font-medium flex items-center gap-1.5"><Eye size={16}/>详情</button>
                <button onClick={()=>handleEdit(i)} className="text-blue-600 font-medium flex items-center gap-1.5"><Edit size={16}/>编辑</button>
                {i.status!=='已结清' ? <button onClick={()=>handlePayment(i)} className="text-blue-600 font-medium flex gap-1.5 items-center"><CreditCard size={16}/>登记</button> : <span className="text-slate-400 flex items-center"><Check size={16}/>结清</span>}
              </div>
            </td></tr>
          )) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600">{i.orderNo}</span><Badge text={i.status}/></div>
               <div className="text-sm text-slate-600 flex justify-between border-b border-slate-50 pb-2"><span>客户: <span className="font-medium text-slate-800">{i.customer}</span></span> <span className="font-bold text-rose-500 text-base">待收: ¥{i.unreceivedAmount}</span></div>
               <div className="flex gap-4 pt-1 justify-end">
                 <button onClick={()=>{setCurrentDetail({type:'receivable',data:i}); setActiveTab('order-detail');}} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Eye size={14}/>详情</button>
                 {i.status!=='已结清' && <button onClick={()=>handlePayment(i)} className="text-emerald-600 text-sm font-medium flex gap-1 items-center"><CreditCard size={14}/>收款</button>}
               </div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};