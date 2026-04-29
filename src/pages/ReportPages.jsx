import React, { useState, useMemo, useContext } from 'react';
// 🚨 核心修复：在此处补上了缺失的 FileText 图标引入 🚨
import { Download, TrendingUp, ArrowRightLeft, Package, Calendar, BarChart3, DollarSign, ShoppingBag, Box, FileText } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, DateRangePicker, Pagination, EmptyState, SearchBar, Badge } from '../components/common';
import { exportToCSV } from '../utils';

// ========================================================
// 专属组件：高级数据汇总卡片
// ========================================================
const SummaryCard = ({ title, value, icon, prefix = '¥', suffix = '', colorClass = 'text-blue-600', bgClass = 'bg-blue-50' }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white shadow-sm z-10 transition-transform group-hover:scale-110 ${bgClass} ${colorClass}`}>
      {icon}
    </div>
    <div className="z-10 flex-1">
      <div className="text-sm font-medium text-slate-500 mb-0.5">{title}</div>
      <div className="text-2xl font-black text-slate-800 tracking-tight flex items-baseline gap-1">
        {prefix && <span className="text-lg text-slate-400 font-bold">{prefix}</span>}
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-600">{value}</span>
        {suffix && <span className="text-sm text-slate-500 font-bold ml-0.5">{suffix}</span>}
      </div>
    </div>
  </div>
);

// ========================================================
// 1. 出入库明细报表
// ========================================================
export const ReportInOutPage = () => {
  const { stockIn, stockOut, showMessage } = useContext(AppContext);
  const [search, setSearch] = useState(''); 
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState(''); 
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const safeStockIn = Array.isArray(stockIn) ? stockIn : [];
  const safeStockOut = Array.isArray(stockOut) ? stockOut : [];

  const filtered = useMemo(() => {
    const list = [];
    safeStockIn.forEach(o => {
      if (!o) return;
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach(i => {
        if (!i) return;
        list.push({ 
          id: `in-${o?.id}-${i?.id}`, 
          date: String(o?.date || ''), 
          orderNo: String(o?.orderNo || ''), 
          type: String(o?.type || ''), 
          target: String(o?.supplier || ''), 
          product: String(i?.product || ''), 
          qty: Number(i?.qty) || 0, 
          price: Number(i?.price) || 0, 
          total: (Number(i?.qty) || 0) * (Number(i?.price) || 0), 
          status: String(o?.status || '') 
        });
      });
    });
    
    safeStockOut.forEach(o => {
      if (!o) return;
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach(i => {
        if (!i) return;
        list.push({ 
          id: `out-${o?.id}-${i?.id}`, 
          date: String(o?.date || ''), 
          orderNo: String(o?.orderNo || ''), 
          type: String(o?.type || ''), 
          target: String(o?.customer || ''), 
          product: String(i?.product || ''), 
          qty: Number(i?.qty) || 0, 
          price: Number(i?.price) || 0, 
          total: (Number(i?.qty) || 0) * (Number(i?.price) || 0), 
          status: String(o?.status || '') 
        });
      });
    });

    list.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
    
    return list.filter(i => {
      const s = String(search || '').toLowerCase();
      const matchSearch = String(i.orderNo).toLowerCase().includes(s) || String(i.product).toLowerCase().includes(s);
      const matchType = !typeFilter || String(i.type).includes(typeFilter);
      const matchStart = !startDate || i.date >= startDate;
      const matchEnd = !endDate || i.date <= endDate;
      return matchSearch && matchType && matchStart && matchEnd;
    });
  }, [safeStockIn, safeStockOut, search, typeFilter, startDate, endDate]);

  const safeFiltered = Array.isArray(filtered) ? filtered : [];
  const filteredLength = safeFiltered.length || 0;
  const safePage = Math.max(1, Math.min(page, Math.ceil(filteredLength / 10) || 1));
  const paginated = safeFiltered.slice((safePage - 1) * 10, safePage * 10);

  const totalInAmount = safeFiltered.filter(i => String(i.type).includes('入库')).reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalOutAmount = safeFiltered.filter(i => String(i.type).includes('出库')).reduce((sum, i) => sum + (Number(i.total) || 0), 0);

  const handleQuickDate = (days) => {
    if (days === null) { setStartDate(''); setEndDate(''); return; }
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset()); start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
    setEndDate(end.toISOString().split('T')[0]); setStartDate(start.toISOString().split('T')[0]);
    setPage(1);
  };

  const exportRep = () => {
    if(filteredLength === 0) return showMessage('提示','无数据可供导出');
    let conditionStr = startDate && endDate ? `_${startDate}至${endDate}` : (startDate ? `_${startDate}起` : (endDate ? `_至${endDate}` : ''));
    exportToCSV(`出入库明细${conditionStr}`, [{label:'日期',key:'date'},{label:'类型',key:'type'},{label:'单号',key:'orderNo'},{label:'商品',key:'product'},{label:'金额',key:'total'}], safeFiltered);
  };

  const selectClass = "border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all hover:border-slate-300";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="出入库流水报表" action={<button onClick={exportRep} className="text-slate-600 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium flex gap-2 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"><Download size={16} className="text-blue-500"/>导出 Excel</button>} />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="筛选期内入库总额" value={totalInAmount.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} icon={<Package size={22} />} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <SummaryCard title="筛选期内出库总额" value={totalOutAmount.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} icon={<TrendingUp size={22} />} colorClass="text-rose-600" bgClass="bg-rose-50" />
        <SummaryCard title="流水单明细笔数" value={filteredLength} prefix="" suffix="笔" icon={<ArrowRightLeft size={22} />} colorClass="text-blue-600" bgClass="bg-blue-50" />
      </div>

      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-6 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="单号/商品名称" className="w-full sm:w-64 bg-white" />
        <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}} className={selectClass}><option value="">所有业务类型</option><option value="入库">包含入库</option><option value="出库">包含出库</option></select>
        <div className="flex items-center gap-2 bg-white rounded-xl pr-2 border border-slate-200 shadow-sm overflow-hidden"><DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} /></div>
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl border border-slate-200 hidden xl:flex">
           <button onClick={()=>handleQuickDate(null)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!startDate && !endDate ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80'}`}>全部</button>
           <button onClick={()=>handleQuickDate(7)} className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-all">近7天</button>
           <button onClick={()=>handleQuickDate(30)} className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-all">近30天</button>
        </div>
        <button onClick={()=>{setSearch('');setTypeFilter('');setStartDate('');setEndDate('');setPage(1);}} className="ml-auto text-slate-400 hover:text-blue-600 text-sm font-medium transition-colors px-3">重置参数</button>
      </div>

      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white flex-1">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr><th className="p-4 pl-6">发生日期</th><th className="p-4">业务类型</th><th className="p-4">关联单号</th><th className="p-4">商品物资</th><th className="p-4">往来对象</th><th className="p-4">核算金额</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map(i=>(
            <tr key={i.id} className="border-b border-slate-100 group hover:bg-slate-50 transition-colors"><td className="p-4 pl-6 text-slate-500">{i.date}</td><td className="p-4"><Badge text={i.type}/></td><td className="p-4"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{i.orderNo}</span></td><td className="p-4 font-medium text-slate-800">{i.product}</td><td className="p-4 text-slate-600">{i.target}</td><td className={`p-4 font-bold ${String(i.type).includes('入库') ? 'text-emerald-600' : 'text-rose-600'}`}>¥{Number(i.total).toFixed(2)}</td></tr>
          )) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3"><div className="flex justify-between items-center"><span className="font-mono text-sm font-bold text-slate-800">{i.orderNo}</span><span className="text-xs text-slate-400">{i.date}</span></div><div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100"><div className="flex justify-between text-sm items-center"><span className="font-medium text-slate-800">{i.product}</span><Badge text={i.type}/></div><div className="flex justify-between text-sm"><span className="text-slate-500 line-clamp-1">{i.target}</span><span className={`font-bold ${String(i.type).includes('入库') ? 'text-emerald-600' : 'text-rose-600'}`}>¥{Number(i.total).toFixed(2)}</span></div></div></div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filteredLength} totalPages={Math.ceil(filteredLength / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

// ========================================================
// 2. 销售明细报表
// ========================================================
export const ReportSalesPage = () => {
  const { salesOrders, showMessage } = useContext(AppContext);
  const [search, setSearch] = useState(''); 
  const [startDate, setStartDate] = useState(''); 
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const safeSalesOrders = Array.isArray(salesOrders) ? salesOrders : [];

  const filtered = useMemo(() => {
    const list = [];
    safeSalesOrders.forEach(o => {
      if (!o) return;
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach(i => {
        if (!i) return;
        list.push({ 
          id: `${o?.id}-${i?.id}`, 
          date: String(o?.date || ''), 
          orderNo: String(o?.orderNo || ''), 
          customer: String(o?.customer || ''), 
          product: String(i?.product || ''), 
          qty: Number(i?.qty) || 0, 
          total: (Number(i?.qty) || 0) * (Number(i?.price) || 0) 
        });
      });
    });
    
    list.sort((a,b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
    
    return list.filter(i => {
      const s = String(search || '').toLowerCase();
      const matchSearch = String(i.orderNo).toLowerCase().includes(s) || 
                          String(i.product).toLowerCase().includes(s) || 
                          String(i.customer).toLowerCase().includes(s);
      const matchStart = !startDate || i.date >= startDate;
      const matchEnd = !endDate || i.date <= endDate;
      return matchSearch && matchStart && matchEnd;
    });
  }, [safeSalesOrders, search, startDate, endDate]);
  
  const safeFiltered = Array.isArray(filtered) ? filtered : [];
  const filteredLength = safeFiltered.length || 0;
  const safePage = Math.max(1, Math.min(page, Math.ceil(filteredLength / 10) || 1));
  const paginated = safeFiltered.slice((safePage - 1) * 10, safePage * 10);

  const totalSales = safeFiltered.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalItems = safeFiltered.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
  const uniqueOrders = new Set(safeFiltered.map(i => String(i.orderNo))).size || 0;

  const handleQuickDate = (days) => {
    if (days === null) { setStartDate(''); setEndDate(''); return; }
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days);
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset()); start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
    setEndDate(end.toISOString().split('T')[0]); setStartDate(start.toISOString().split('T')[0]);
    setPage(1);
  };

  const exportRep = () => {
    if(filteredLength === 0) return showMessage('提示','无数据可供导出');
    exportToCSV('销售报表',[{label:'单号',key:'orderNo'},{label:'商品',key:'product'},{label:'销售额',key:'total'}], safeFiltered);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="销售业绩报表" action={<button onClick={exportRep} className="text-slate-600 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium flex gap-2 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"><Download size={16} className="text-blue-500"/>导出 Excel</button>} />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="筛选期内销售总额" value={totalSales.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} icon={<DollarSign size={24} />} colorClass="text-rose-600" bgClass="bg-rose-50" />
        <SummaryCard title="售出商品总件数" value={totalItems.toLocaleString()} prefix="" suffix="件" icon={<ShoppingBag size={22} />} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        {/* 这里就是报错的元凶 FileText 图标，现在已经安全引入并挂载了 */}
        <SummaryCard title="关联订单总数" value={uniqueOrders} prefix="" suffix="单" icon={<FileText size={22} />} colorClass="text-blue-600" bgClass="bg-blue-50" />
      </div>

      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-6 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索单号/客户/商品" className="w-full sm:w-72 bg-white" />
        <div className="flex items-center gap-2 bg-white rounded-xl pr-2 border border-slate-200 shadow-sm overflow-hidden"><DateRangePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} /></div>
        <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl border border-slate-200 hidden xl:flex">
           <button onClick={()=>handleQuickDate(null)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!startDate && !endDate ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80'}`}>全部</button>
           <button onClick={()=>handleQuickDate(7)} className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-all">近7天</button>
           <button onClick={()=>handleQuickDate(30)} className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-all">近30天</button>
        </div>
        <button onClick={()=>{setSearch('');setStartDate('');setEndDate('');setPage(1);}} className="ml-auto text-slate-400 hover:text-blue-600 text-sm font-medium transition-colors px-3">重置参数</button>
      </div>

      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white flex-1">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr><th className="p-4 pl-6">成交日期</th><th className="p-4">销售单号</th><th className="p-4">签约客户</th><th className="p-4">售出商品</th><th className="p-4">数量</th><th className="p-4">销售业绩</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map(i=>(
            <tr key={i.id} className="border-b border-slate-100 group hover:bg-slate-50 transition-colors"><td className="p-4 pl-6 text-slate-500">{i.date}</td><td className="p-4"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{i.orderNo}</span></td><td className="p-4 text-slate-600">{i.customer}</td><td className="p-4 font-medium text-slate-800">{i.product}</td><td className="p-4 font-bold text-slate-700">{i.qty}</td><td className="p-4 font-bold text-rose-600 text-base">¥{Number(i.total).toFixed(2)}</td></tr>
          )) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3"><div className="flex justify-between items-center"><span className="font-mono text-sm font-bold text-slate-800">{i.orderNo}</span><span className="text-xs text-slate-400">{i.date}</span></div><div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100"><div className="flex justify-between text-sm items-center"><span className="font-medium text-slate-800">{i.product} <span className="text-slate-400 text-xs ml-1">x{i.qty}</span></span><span className="font-bold text-rose-600">¥{Number(i.total).toFixed(2)}</span></div><div className="flex justify-between text-sm"><span className="text-slate-500">签约客户</span><span className="text-slate-700">{i.customer}</span></div></div></div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filteredLength} totalPages={Math.ceil(filteredLength / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

// ========================================================
// 3. 库存状态快照报表
// ========================================================
export const ReportInventoryPage = () => {
  const { inventory, products, stockIn, stockOut, showMessage } = useContext(AppContext);
  const [search, setSearch] = useState(''); 
  const [asOfDate, setAsOfDate] = useState(''); 
  const [page, setPage] = useState(1);

  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeStockIn = Array.isArray(stockIn) ? stockIn : [];
  const safeStockOut = Array.isArray(stockOut) ? stockOut : [];

  const filtered = useMemo(() => {
    const getStockAsOf = (item, date) => {
      let stock = Number(item?.currentStock) || 0;
      
      safeStockOut.forEach(o => { 
        if (o && String(o.status) === '已发货' && String(o.date || '') > date && String(o.warehouse) === String(item?.warehouse)) {
          const items = Array.isArray(o.items) ? o.items : [];
          items.forEach(i => { if (i && String(i.product) === String(item?.name)) stock += (Number(i.qty) || 0); });
        }
      });
      
      safeStockIn.forEach(o => { 
        if (o && String(o.status) === '已审核' && String(o.date || '') > date && String(o.warehouse) === String(item?.warehouse)) {
          const items = Array.isArray(o.items) ? o.items : [];
          items.forEach(i => { if (i && String(i.product) === String(item?.name)) stock -= (Number(i.qty) || 0); });
        }
      });
      return stock;
    };
    
    const list = safeInventory.map(item => {
      if (!item) return null;
      const stock = asOfDate ? getStockAsOf(item, asOfDate) : (Number(item.currentStock) || 0);
      const prodInfo = safeProducts.find(p => p && String(p.name) === String(item.name)) || { category: '-', price: 0, code: '-', spec: '-' };
      return { 
        ...item, 
        code: String(item.code || prodInfo.code || '-'), 
        spec: String(item.spec || prodInfo.spec || '-'), 
        category: String(prodInfo.category || '-'), 
        unitPrice: Number(prodInfo.price) || 0, 
        currentStock: stock, 
        totalValue: stock * (Number(prodInfo.price) || 0), 
        status: asOfDate ? '历史快照' : String(item.status || '') 
      };
    }).filter(Boolean);
    
    return list.filter(i => {
      const s = String(search || '').toLowerCase();
      return String(i.name).toLowerCase().includes(s) || 
             String(i.code).toLowerCase().includes(s) || 
             String(i.warehouse).toLowerCase().includes(s);
    });
  }, [safeInventory, safeProducts, safeStockIn, safeStockOut, asOfDate, search]);

  const safeFiltered = Array.isArray(filtered) ? filtered : [];
  const filteredLength = safeFiltered.length || 0;
  const safePage = Math.max(1, Math.min(page, Math.ceil(filteredLength / 10) || 1));
  const paginated = safeFiltered.slice((safePage - 1) * 10, safePage * 10);

  const totalValuation = safeFiltered.reduce((sum, i) => sum + (Number(i.totalValue) || 0), 0);
  const totalStockQty = safeFiltered.reduce((sum, i) => sum + (Number(i.currentStock) || 0), 0);

  const exportRep = () => {
    if(filteredLength === 0) return showMessage('提示','无数据可供导出');
    exportToCSV('库存',[{label:'仓库',key:'warehouse'},{label:'商品',key:'name'},{label:'数量',key:'currentStock'},{label:'估值',key:'totalValue'}], safeFiltered);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title={`资产库存报表 ${asOfDate ? '(快照模式)' : ''}`} action={<button onClick={exportRep} className="text-slate-600 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium flex gap-2 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"><Download size={16} className="text-blue-500"/>导出 Excel</button>} />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="当前视图资产总估值" value={totalValuation.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})} icon={<BarChart3 size={22} />} colorClass="text-amber-600" bgClass="bg-amber-50" />
        <SummaryCard title="库存总件数" value={totalStockQty.toLocaleString()} prefix="" suffix="件" icon={<Box size={22} />} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <SummaryCard title="涉及物资类型 (SKU)" value={filteredLength} prefix="" suffix="种" icon={<Package size={22} />} colorClass="text-blue-600" bgClass="bg-blue-50" />
      </div>

      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-6 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索商品/编码/仓库" className="w-full sm:w-72 bg-white" />
        <div className="flex items-center bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm ml-auto sm:ml-0"><Calendar size={16} className="text-slate-400 ml-2 mr-1" /><span className="text-sm font-medium text-slate-500 mr-2">追溯历史快照：</span><input type="date" value={asOfDate} onChange={e=>{setAsOfDate(e.target.value);setPage(1);}} className="px-2 py-1 outline-none text-sm bg-transparent font-mono text-slate-700" /></div>
        <button onClick={()=>{setSearch('');setAsOfDate('');setPage(1);}} className="ml-auto text-slate-400 hover:text-blue-600 text-sm font-medium transition-colors px-3">清空条件</button>
      </div>

      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white flex-1">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr><th className="p-4 pl-6">所在仓库</th><th className="p-4">物资分类</th><th className="p-4">商品资产名称</th><th className="p-4">健康状态</th><th className="p-4">{asOfDate ? '期末存量' : '实时存量'}</th><th className="p-4">资产估值</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map((i, idx)=>(
            <tr key={i.id || idx} className="border-b border-slate-100 group hover:bg-slate-50 transition-colors"><td className="p-4 pl-6 text-slate-600">{i.warehouse}</td><td className="p-4 text-slate-400">{i.category}</td><td className="p-4 font-bold text-slate-800">{i.name}</td><td className="p-4"><Badge text={i.status}/></td><td className="p-4 font-bold text-slate-700 text-base">{i.currentStock}</td><td className="p-4 text-amber-600 font-bold">¥{Number(i.totalValue).toFixed(2)}</td></tr>
          )) : <tr><td colSpan="6"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3"><div className="flex justify-between items-start"><span className="font-bold text-slate-800 text-lg leading-tight w-2/3">{i.name}</span><Badge text={i.status}/></div><div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100"><div className="flex justify-between text-sm items-center"><span className="text-slate-500">归属仓库</span><span className="font-medium text-slate-700">{i.warehouse}</span></div><div className="flex justify-between text-sm items-center"><span className="text-slate-500">{asOfDate ? '期末存量' : '实时存量'}</span><span className="font-bold text-slate-800 text-base">{i.currentStock}</span></div><div className="flex justify-between text-sm items-center pt-2 border-t border-slate-200/60"><span className="text-slate-500">资产估值</span><span className="font-bold text-amber-600">¥{Number(i.totalValue).toFixed(2)}</span></div></div></div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filteredLength} totalPages={Math.ceil(filteredLength / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};