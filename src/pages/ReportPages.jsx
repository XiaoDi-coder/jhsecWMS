import React, { useState, useMemo, useContext } from 'react';
import { Download } from 'lucide-react';
import { AppContext } from '../context/AppContext';
// 注意这里已经引入了 SearchBar
import { PageHeader, DateRangePicker, Pagination, EmptyState, SearchBar, Badge } from '../components/common';
import { getLocalDate, exportToCSV } from '../utils';

export const ReportInOutPage = () => {
  const { stockIn, stockOut, showMessage } = useContext(AppContext);
  const [search, setSearch] = useState(''); const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = [];
    stockIn.forEach(o => (o.items||[]).forEach(i => list.push({ id:`in-${o.id}-${i.id}`, date:o.date, orderNo:o.orderNo, type:o.type, target:o.supplier, product:i.product, qty:i.qty, price:i.price, total:Number(i.qty)*Number(i.price), status:o.status })));
    stockOut.forEach(o => (o.items||[]).forEach(i => list.push({ id:`out-${o.id}-${i.id}`, date:o.date, orderNo:o.orderNo, type:o.type, target:o.customer, product:i.product, qty:i.qty, price:i.price, total:Number(i.qty)*Number(i.price), status:o.status })));
    list.sort((a,b)=>new Date(b.date)-new Date(a.date));
    return list.filter(i => (i.orderNo.includes(search)||i.product.includes(search)) && (typeFilter===''||i.type.includes(typeFilter)) && (!startDate||i.date>=startDate) && (!endDate||i.date<=endDate));
  }, [stockIn, stockOut, search, typeFilter, startDate, endDate]);

  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handleQuickDate = (days) => {
    if (days === null) { setStartDate(''); setEndDate(''); return; }
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset()); start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
    setEndDate(end.toISOString().split('T')[0]); setStartDate(start.toISOString().split('T')[0]);
    setPage(1);
  };

  const exportRep = () => {
    if(!filtered.length) return showMessage('提示','无数据');
    let conditionStr = '';
    if (startDate && endDate) conditionStr += `_${startDate}至${endDate}`; else if (startDate) conditionStr += `_${startDate}起`; else if (endDate) conditionStr += `_至${endDate}`;
    exportToCSV(`出入库明细${conditionStr}`, [{label:'日期',key:'date'},{label:'类型',key:'type'},{label:'单号',key:'orderNo'},{label:'商品',key:'product'},{label:'金额',key:'total'}], filtered);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="出入库明细报表" action={<button onClick={exportRep} className="text-blue-600 border border-blue-600 px-4 py-2 rounded-xl text-sm flex gap-1.5"><Download size={16}/>导出报表</button>}/>
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        {/* === 替换后的 SearchBar === */}
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="单号/商品" className="w-48 sm:w-64" />
        
        <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}} className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"><option value="">所有类型</option><option value="入库">入库</option><option value="出库">出库</option></select>
        <DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 hidden xl:flex">
           <button onClick={()=>handleQuickDate(null)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${!startDate && !endDate ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}>全部</button>
           <button onClick={()=>handleQuickDate(7)} className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all">近7天</button>
           <button onClick={()=>handleQuickDate(30)} className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all">近30天</button>
        </div>
        <button onClick={()=>{setSearch('');setTypeFilter('');setStartDate('');setEndDate('');setPage(1);}} className="ml-auto text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">重置条件</button>
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4">日期</th><th className="p-4">类型</th><th className="p-4">单号</th><th className="p-4">商品</th><th className="p-4">对象</th><th className="p-4">金额</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map(i=><tr key={i.id} className="border-b"><td className="p-4">{i.date}</td><td className="p-4"><Badge text={i.type}/></td><td className="p-4 text-blue-600">{i.orderNo}</td><td className="p-4">{i.product}</td><td className="p-4">{i.target}</td><td className="p-4 text-rose-500 font-bold">¥{i.total.toFixed(2)}</td></tr>) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600">{i.orderNo}</span><span className="text-sm text-slate-500">{i.date}</span></div>
               <div className="text-sm text-slate-600 flex justify-between border-b border-slate-50 pb-2"><span>商品: <span className="font-medium text-slate-800">{i.product}</span></span> <span><Badge text={i.type}/></span></div>
               <div className="flex justify-between pt-1"><span>{i.target}</span> <span className="font-bold text-rose-500">¥{i.total.toFixed(2)}</span></div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const ReportSalesPage = () => {
  const { salesOrders, showMessage } = useContext(AppContext);
  const [search, setSearch] = useState(''); const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = [];
    salesOrders.forEach(o => (o.items||[]).forEach(i => list.push({ id:`${o.id}-${i.id}`, date:o.date, orderNo:o.orderNo, customer:o.customer, product:i.product, qty:i.qty, total:Number(i.qty)*Number(i.price) })));
    return list.filter(i => (i.orderNo.includes(search)||i.product.includes(search)) && (!startDate||i.date>=startDate) && (!endDate||i.date<=endDate));
  }, [salesOrders, search, startDate, endDate]);
  
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handleQuickDate = (days) => {
    if (days === null) { setStartDate(''); setEndDate(''); return; }
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset()); start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
    setEndDate(end.toISOString().split('T')[0]); setStartDate(start.toISOString().split('T')[0]);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="销售明细报表" action={<button onClick={()=>exportToCSV('销售报表',[{label:'单号',key:'orderNo'}],filtered)} className="text-blue-600 border border-blue-600 px-4 py-2 rounded-xl text-sm flex gap-1.5"><Download size={16}/>导出报表</button>}/>
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        {/* === 替换后的 SearchBar === */}
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索单号/商品" className="w-48 sm:w-64" />
        
        <DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 hidden xl:flex">
           <button onClick={()=>handleQuickDate(null)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${!startDate && !endDate ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}>全部</button>
           <button onClick={()=>handleQuickDate(7)} className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all">近7天</button>
           <button onClick={()=>handleQuickDate(30)} className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white hover:shadow-sm text-slate-600 transition-all">近30天</button>
        </div>
        <button onClick={()=>{setSearch('');setStartDate('');setEndDate('');setPage(1);}} className="ml-auto text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">重置条件</button>
      </div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4">日期</th><th className="p-4">单号</th><th className="p-4">客户</th><th className="p-4">商品</th><th className="p-4">数量</th><th className="p-4">销售额</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map(i=><tr key={i.id} className="border-b"><td className="p-4">{i.date}</td><td className="p-4 text-blue-600 font-bold">{i.orderNo}</td><td className="p-4">{i.customer}</td><td className="p-4">{i.product}</td><td className="p-4 font-bold">{i.qty}</td><td className="p-4 text-rose-500 font-bold">¥{i.total.toFixed(2)}</td></tr>) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600">{i.orderNo}</span><span className="text-sm text-slate-500">{i.date}</span></div>
               <div className="text-sm text-slate-600 flex justify-between border-b border-slate-50 pb-2"><span>商品: <span className="font-medium text-slate-800">{i.product} x {i.qty}</span></span> <span>{i.customer}</span></div>
               <div className="flex justify-end pt-1"><span className="font-bold text-rose-500">¥{i.total.toFixed(2)}</span></div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const ReportInventoryPage = () => {
  const { inventory, products, stockIn, stockOut } = useContext(AppContext);
  const [search, setSearch] = useState(''); // 新增搜索状态
  const [asOfDate, setAsOfDate] = useState(''); 
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const getStockAsOf = (item, date) => {
      let stock = Number(item.currentStock);
      stockOut.forEach(o => { if (o.status === '已发货' && o.date > date && o.warehouse === item.warehouse) (o.items||[]).forEach(i => { if (i.product === item.name) stock += Number(i.qty); }) });
      stockIn.forEach(o => { if (o.status === '已审核' && o.date > date && o.warehouse === item.warehouse) (o.items||[]).forEach(i => { if (i.product === item.name) stock -= Number(i.qty); }) });
      return stock;
    };
    
    // 1. 先计算快照/当前库存
    const list = inventory.map(item => {
      const stock = asOfDate ? getStockAsOf(item, asOfDate) : item.currentStock;
      const prodInfo = products.find(p => p.name === item.name) || { category: '-', price: 0, code: '-', spec: '-' };
      return { ...item, code: item.code || prodInfo.code, spec: item.spec || prodInfo.spec, category: prodInfo.category, unitPrice: prodInfo.price, currentStock: stock, totalValue: stock * prodInfo.price, status: asOfDate ? '历史快照' : item.status };
    });
    
    // 2. 再执行搜索框过滤逻辑
    return list.filter(i => i.name.includes(search) || (i.code && i.code.includes(search)));
  }, [inventory, products, stockIn, stockOut, asOfDate, search]);

  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title={`库存状态报表 ${asOfDate ? '(快照模式)' : ''}`} action={<button onClick={()=>exportToCSV('库存',[{label:'仓库',key:'warehouse'},{label:'编码',key:'code'},{label:'商品',key:'name'},{label:'分类',key:'category'},{label:'规格',key:'spec'},{label:'数量',key:'currentStock'},{label:'库存估值',key:'totalValue'}],filtered)} className="text-blue-600 border border-blue-600 px-4 py-2 rounded-xl text-sm flex gap-1.5"><Download size={16}/>导出报表</button>}/>
      
      {/* ===== 修改这里的布局，加上统一的 SearchBar ===== */}
      <div className="flex gap-3 mb-6 items-center flex-wrap">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索商品/编码" className="w-48 sm:w-64" />
        
        <div className="flex items-center border border-slate-200 p-1 rounded-xl bg-slate-50 shadow-sm">
          <span className="text-sm font-medium text-slate-500 mx-3">截至历史快照查询：</span>
          <input type="date" value={asOfDate} onChange={e=>{setAsOfDate(e.target.value);setPage(1);}} className="px-3 py-1.5 outline-none text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20" />
        </div>
        
        <button onClick={()=>{setSearch('');setAsOfDate('');setPage(1);}} className="ml-auto text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors">重置条件</button>
      </div>
      {/* ============================================== */}

      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4">仓库</th><th className="p-4">分类</th><th className="p-4">商品名称</th><th className="p-4">状态</th><th className="p-4">{asOfDate ? '期末数量' : '当前库存'}</th><th className="p-4">库存估值</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map((i, idx)=><tr key={i.id || idx} className="border-b hover:bg-slate-50"><td className="p-4">{i.warehouse}</td><td className="p-4 text-slate-500">{i.category}</td><td className="p-4 text-blue-600 font-bold">{i.name}</td><td className="p-4"><Badge text={i.status}/></td><td className="p-4 font-bold">{i.currentStock}</td><td className="p-4 text-emerald-600 font-bold">¥{i.totalValue.toFixed(2)}</td></tr>) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
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