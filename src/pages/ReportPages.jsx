import React, { useState, useMemo, useContext } from 'react';
import { Download } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, DateRangePicker, Pagination, EmptyState } from '../components/common';
import { getLocalDate, exportToCSV } from '../utils';

export const ReportInOutPage = () => {
  const { stockIn, stockOut } = useContext(AppContext);
  const [startDate, setStartDate] = useState(getLocalDate().slice(0, 8) + '01');
  const [endDate, setEndDate] = useState(getLocalDate());
  const [page, setPage] = useState(1);

  const data = useMemo(() => {
    const inData = stockIn.filter(i => i.status === '已审核' && i.date >= startDate && i.date <= endDate).map(i => ({ ...i, category: '入库' }));
    const outData = stockOut.filter(i => i.status === '已发货' && i.date >= startDate && i.date <= endDate).map(i => ({ ...i, category: '出库' }));
    return [...inData, ...outData].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [stockIn, stockOut, startDate, endDate]);

  const safePage = Math.max(1, Math.min(page, Math.ceil(data.length / 10) || 1));
  const paginated = data.slice((safePage - 1) * 10, safePage * 10);
  const headers = [{label:'日期',key:'date'},{label:'业务类型',key:'category'},{label:'单据类型',key:'type'},{label:'单号',key:'orderNo'},{label:'仓库',key:'warehouse'},{label:'金额',key:'amount'}];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="出入库报表" action={<button onClick={() => exportToCSV('出入库明细', headers, data)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center gap-1.5 hover:bg-slate-200"><Download size={16}/>导出数据</button>} />
      <div className="flex mb-6"><DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} /></div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr>{headers.map(h=><th key={h.key} className="p-4">{h.label}</th>)}</tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={idx} className="border-b hover:bg-slate-50"><td className="p-4">{i.date}</td><td className={`p-4 font-bold ${i.category==='入库'?'text-emerald-600':'text-blue-600'}`}>{i.category}</td><td className="p-4">{i.type}</td><td className="p-4 text-slate-500">{i.orderNo}</td><td className="p-4">{i.warehouse}</td><td className="p-4 font-bold">¥{i.amount}</td></tr>
          )) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <Pagination current={safePage} total={data.length} totalPages={Math.ceil(data.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const ReportSalesPage = () => {
  const { salesOrders } = useContext(AppContext);
  const [startDate, setStartDate] = useState(getLocalDate().slice(0, 8) + '01');
  const [endDate, setEndDate] = useState(getLocalDate());
  const [page, setPage] = useState(1);

  const data = useMemo(() => salesOrders.filter(i => i.status === '已审核' && i.date >= startDate && i.date <= endDate).sort((a,b)=>new Date(b.date)-new Date(a.date)), [salesOrders, startDate, endDate]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(data.length / 10) || 1));
  const paginated = data.slice((safePage - 1) * 10, safePage * 10);
  const headers = [{label:'日期',key:'date'},{label:'单号',key:'orderNo'},{label:'客户',key:'customer'},{label:'数量',key:'totalCount'},{label:'销售额',key:'totalAmount'}];
  
  const totalSales = data.reduce((sum, item) => sum + Number(item.totalAmount), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="销售报表" action={<button onClick={() => exportToCSV('销售明细', headers, data)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex gap-1.5"><Download size={16}/>导出数据</button>} />
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
        <div className="text-lg">期间总销售额: <span className="text-2xl font-bold text-rose-600">¥{totalSales.toFixed(2)}</span></div>
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr>{headers.map(h=><th key={h.key} className="p-4">{h.label}</th>)}</tr></thead><tbody>
          {paginated.length>0 ? paginated.map((i, idx) => (
            <tr key={idx} className="border-b hover:bg-slate-50"><td className="p-4">{i.date}</td><td className="p-4 text-blue-600">{i.orderNo}</td><td className="p-4">{i.customer}</td><td className="p-4">{i.totalCount}</td><td className="p-4 font-bold text-rose-500">¥{i.totalAmount}</td></tr>
          )) : <tr><td colSpan="5"><EmptyState/></td></tr>}
        </tbody></table></div>
        <Pagination current={safePage} total={data.length} totalPages={Math.ceil(data.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};