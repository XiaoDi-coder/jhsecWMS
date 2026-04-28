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

export const ReportInventoryPage = () => {
  const { inventory, products, stockIn, stockOut } = useContext(AppContext);
  const [asOfDate, setAsOfDate] = useState(''); 
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const getStockAsOf = (item, date) => {
      let stock = Number(item.currentStock);
      stockOut.forEach(o => { if (o.status === '已发货' && o.date > date && o.warehouse === item.warehouse) (o.items||[]).forEach(i => { if (i.product === item.name) stock += Number(i.qty); }) });
      stockIn.forEach(o => { if (o.status === '已审核' && o.date > date && o.warehouse === item.warehouse) (o.items||[]).forEach(i => { if (i.product === item.name) stock -= Number(i.qty); }) });
      return stock;
    };
    return inventory.map(item => {
      const stock = asOfDate ? getStockAsOf(item, asOfDate) : item.currentStock;
      const prodInfo = products.find(p => p.name === item.name) || { category: '-', price: 0, code: '-', spec: '-' };
      return { ...item, code: item.code || prodInfo.code, spec: item.spec || prodInfo.spec, category: prodInfo.category, unitPrice: prodInfo.price, currentStock: stock, totalValue: stock * prodInfo.price, status: asOfDate ? '历史快照' : item.status };
    });
  }, [inventory, products, stockIn, stockOut, asOfDate]);

  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title={`库存状态报表 ${asOfDate ? '(快照模式)' : ''}`} action={<button onClick={()=>exportToCSV('库存',[{label:'仓库',key:'warehouse'},{label:'编码',key:'code'},{label:'商品',key:'name'},{label:'分类',key:'category'},{label:'规格',key:'spec'},{label:'数量',key:'currentStock'},{label:'库存估值',key:'totalValue'}],filtered)} className="text-blue-600 border border-blue-600 px-4 py-2 rounded-xl text-sm flex gap-1.5"><Download size={16}/>导出报表</button>}/>
      <div className="flex gap-3 mb-6 items-center flex-wrap border p-2 rounded-xl bg-slate-50 w-max">
        <span className="text-sm font-medium text-slate-500 ml-2">截至历史快照查询：</span>
        <input type="date" value={asOfDate} onChange={e=>{setAsOfDate(e.target.value);setPage(1);}} className="px-2 py-1 outline-none text-sm bg-transparent" />
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4">仓库</th><th className="p-4">分类</th><th className="p-4">商品名称</th><th className="p-4">状态</th><th className="p-4">{asOfDate ? '期末数量' : '当前库存'}</th><th className="p-4">库存估值</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map((i, idx)=><tr key={i.id || idx} className="border-b"><td className="p-4">{i.warehouse}</td><td className="p-4 text-slate-500">{i.category}</td><td className="p-4 text-blue-600 font-bold">{i.name}</td><td className="p-4"><Badge text={i.status}/></td><td className="p-4 font-bold">{i.currentStock}</td><td className="p-4 text-emerald-600 font-bold">¥{i.totalValue.toFixed(2)}</td></tr>) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600">{i.name}</span><Badge text={i.status}/></div>
               <div className="text-sm text-slate-600 flex justify-between"><span>仓库: {i.warehouse}</span> <span>{i.category}</span></div>
               <div className="text-sm text-slate-600 flex justify-between"><span>{asOfDate?'期末数量':'当前库存'}: <span className="font-bold text-slate-800">{i.currentStock}</span></span> <span className="font-bold text-emerald-600">估值: ¥{i.totalValue.toFixed(2)}</span></div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};