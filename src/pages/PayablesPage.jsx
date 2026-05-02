import { useState, useMemo, useContext } from 'react';
import { Eye, Edit, CreditCard, Check, History } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
import { getLocalDate } from '../utils';
import request from '../utils/request';

export const PayablesPage = () => {
  const { payables, setPayables, showForm, showMessage, setCurrentDetail, setActiveTab, addLog, loadBackendMasterData } = useContext(AppContext);
  const [tab, setTab] = useState('全部');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => payables.filter(i => (tab === '全部' || i.status === tab) && (i.orderNo.includes(search) || i.supplier.includes(search))), [payables, tab, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handlePayment = async (item) => {
    showForm('登记付款', [
      { name: 'amount', label: `本次付款 (最多: ¥${item.unpaidAmount})`, type: 'number' },
      { name: 'paymentNo', label: '支付单号', required: true },
      { name: 'paymentMethod', label: '支付方式', type: 'select', options: ['CASH', 'BANK_TRANSFER', 'ALIPAY', 'WECHAT', 'OTHER'], required: true },
      { name: 'date', label: '付款日期', type: 'date', required: true },
      { name: 'remark', label: '备注', type: 'textarea' }
    ], { date: getLocalDate(), paymentMethod: 'BANK_TRANSFER' }, async (form) => {
      const pAmt = parseFloat(form.amount);
      if (isNaN(pAmt) || pAmt <= 0 || pAmt > parseFloat(item.unpaidAmount)) {
        showMessage('错误', '金额不合法或超出应付总额！');
        return false;
      }

      try {
        const backendId = item.backendId || item.id;
        await request.post(`/finance/${backendId}/payment`, {
          payment_no: form.paymentNo,
          payment_amount: pAmt,
          payment_method: form.paymentMethod,
          payment_date: form.date,
          remark: form.remark
        });

        await loadBackendMasterData();
        addLog('应付管理', '登记付款', `单号: ${item.orderNo}, 金额: ¥${pAmt.toFixed(2)}`);
        showMessage('成功', '付款登记成功');
      } catch (error) {
        showMessage('登记失败', error?.response?.data?.message || '后端请求失败');
        return false;
      }
    });
  };

  const handleEdit = async (item) => {
    // 先根据供应商名称查找供应商ID
    const payableData = payables.find(p => p.id === item.id);
    const supplierId = payableData?.backendId || item.id;

    // 显示表单，允许编辑供应商名称和关联订单号
    showForm('编辑应付记录', [
      { name: 'supplierName', label: '供应商名称', type: 'text', required: true, value: payableData?.supplier || item.supplier },
      { name: 'relatedOrderNo', label: '关联订单号', value: item.orderNo || '' }
    ], {}, async (formData) => {
      if (!formData.supplierName) {
        showMessage('警告', '供应商名称不能为空');
        return false;
      }

      try {
        // 这里需要先查找供应商ID
        const response = await request.get(`/api/partners?keyword=${encodeURIComponent(formData.supplierName)}`);
        const partners = response.data.list;
        let partnerId = null;

        if (partners.length > 0) {
          partnerId = partners[0].id;
        } else {
          // 如果供应商不存在，需要先创建供应商
          const createResponse = await request.post('/api/partners', {
            partner_code: `SUP-${Date.now()}`,
            partner_name: formData.supplierName,
            partner_type: 'SUPPLIER'
          });
          partnerId = createResponse.data.id;
        }

        const backendId = item.backendId || item.id;
        await request.put(`/finance/${backendId}`, {
          partner_id: partnerId,
          related_order_no: formData.relatedOrderNo
        });

        // 更新本地状态
        setPayables(payables.map(r =>
          r.id === item.id
            ? { ...r, supplier: formData.supplierName, orderNo: formData.relatedOrderNo }
            : r
        ));

        addLog('应付管理', '修改记录', `单号: ${item.orderNo}`);
        showMessage('成功', '应付记录修改成功');
      } catch (error) {
        showMessage('修改失败', error?.response?.data?.message || '后端请求失败');
        return false;
      }
    });
  };

  const handleViewPayments = (item) => {
    setCurrentDetail({
      title: '付款记录',
      content: async () => {
        const backendId = item.backendId || item.id;
        const response = await request.get(`/finance/${backendId}/payments`);
        const { payment_records, transaction_info } = response.data;

        return (
          <div className="p-4">
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">交易信息</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>财务单号: {transaction_info.transaction_no}</div>
                <div>总金额: ¥{transaction_info.amount}</div>
                <div>已付金额: ¥{transaction_info.paid_amount}</div>
                <div>剩余金额: ¥{transaction_info.remaining_amount}</div>
                <div>状态: <Badge text={transaction_info.status}/></div>
              </div>
            </div>

            <h3 className="font-medium mb-3">付款记录 ({payment_records.length})</h3>
            {payment_records.length > 0 ? (
              <div className="space-y-2">
                {payment_records.map(record => (
                  <div key={record.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{record.payment_no}</div>
                        <div className="text-sm text-slate-500">
                          {record.payment_date} · {record.payment_method}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-orange-600">¥{record.payment_amount}</div>
                    </div>
                    {record.remark && (
                      <div className="text-sm text-slate-600 mt-2">{record.remark}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="暂无付款记录" />
            )}
          </div>
        );
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="应付账款管理" />
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">{['全部', '未结清', '部分结清', '已结清'].map(t => <button key={t} onClick={()=>{setTab(t);setPage(1);}} className={`px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${tab===t?'border-blue-600 text-blue-600':'border-transparent text-slate-500'}`}>{t}</button>)}</div>
      <div className="flex mb-6"><SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="单号/供应商" className="flex-1 sm:max-w-md" /></div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="p-4">订单号</th><th className="p-4">供应商</th><th className="p-4">应付总额</th><th className="p-4">待付金额</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={i.id || idx} className="group hover:bg-slate-50 border-b border-slate-100"><td className="p-4 text-blue-600 font-bold">{i.orderNo}</td><td className="p-4 font-medium">{i.supplier}</td><td className="p-4">¥{i.totalAmount}</td><td className="p-4 text-orange-500 font-bold">¥{i.unpaidAmount}</td><td className="p-4"><Badge text={i.status}/></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">
              <div className="flex items-center gap-4">
                <button onClick={()=>handleViewPayments(i)} className="text-blue-600 font-medium flex items-center gap-1.5">
                  <History size={16}/>
                  付款记录
                </button>
                <button onClick={()=>{setCurrentDetail({type:'payable',data:i});setActiveTab('order-detail');}} className="text-blue-600 font-medium flex items-center gap-1.5"><Eye size={16}/>详情</button>
                <button onClick={()=>handleEdit(i)} className="text-blue-600 font-medium flex items-center gap-1.5"><Edit size={16}/>编辑</button>
                {i.status!=='已结清' ? <button onClick={()=>handlePayment(i)} className="text-blue-600 font-medium flex gap-1.5 items-center"><CreditCard size={16}/>付款</button> : <span className="text-slate-400 flex items-center"><Check size={16}/>结清</span>}
              </div>
            </td></tr>
          )) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600">{i.orderNo}</span><Badge text={i.status}/></div>
               <div className="text-sm text-slate-600 flex justify-between border-b border-slate-50 pb-2"><span>供应商: <span className="font-medium text-slate-800">{i.supplier}</span></span> <span className="font-bold text-orange-500 text-base">待付: ¥{i.unpaidAmount}</span></div>
               <div className="flex gap-4 pt-1 justify-end">
                 <button onClick={()=>{setCurrentDetail({type:'payable',data:i}); setActiveTab('order-detail');}} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Eye size={14}/>详情</button>
                 {i.status!=='已结清' && <button onClick={()=>handlePayment(i)} className="text-emerald-600 text-sm font-medium flex gap-1 items-center"><CreditCard size={14}/>付款</button>}
               </div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};