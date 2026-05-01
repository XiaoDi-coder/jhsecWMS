import { useContext, useMemo } from 'react';
import { TrendingUp, CreditCard, FileText, Box, ShoppingCart, Database, Activity } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader } from '../components/common';
import { BITrendChart, BIPieChart } from '../components/charts';

export const DashboardPage = () => {
  const { setActiveTab, setExpandedMenus, salesOrders, stockIn, receivables, payables, inventory, products } = useContext(AppContext);
  
  const totalUnreceived = receivables.reduce((sum, item) => sum + parseFloat(item.unreceivedAmount || 0), 0);
  const totalUnpaid = payables.reduce((sum, item) => sum + parseFloat(item.unpaidAmount || 0), 0);
  const warningCount = inventory.filter(item => item.status === '库存预警').length;

  const trendData = useMemo(() => Array.from({length: 6}).map((_, i) => {
    const d = new Date(); 
    d.setDate(1); 
    d.setMonth(d.getMonth() - (5 - i));
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let sales = 0, stock = 0;
    salesOrders.forEach(o => { if (o.status === '已审核' && o.date?.startsWith(ym)) sales += parseFloat(o.totalAmount || 0); });
    stockIn.forEach(o => { if (o.status === '已审核' && o.date?.startsWith(ym)) stock += parseFloat(o.amount || 0); });
    
    return { 
      month: `${String(d.getFullYear()).slice(-2)}年${d.getMonth() + 1}月`, 
      sales: Number((sales/10000).toFixed(2)), 
      stock: Number((stock/10000).toFixed(2)) 
    };
  }), [salesOrders, stockIn]);
  
  const yMax = Math.max(10, Math.ceil(Math.max(...trendData.flatMap(d=>[d.sales, d.stock]))/10)*10);

  const pieData = useMemo(() => {
    const productByName = Object.fromEntries(products.map((p) => [p.name, p]));
    const catMap = {};
    inventory.forEach(inv => {
      const p = productByName[inv.name];
      const cat = p?.category || '未分类';
      const val = Number(inv.currentStock) * Number(p?.price || 0);
      catMap[cat] = (catMap[cat] || 0) + val;
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6'];
    return Object.keys(catMap).map((k, i) => ({ name: k, value: catMap[k], color: colors[i % colors.length] })).sort((a,b)=>b.value-a.value);
  }, [inventory, products]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: '订单总数', val: `${salesOrders.length} 笔`, icon: TrendingUp, color: { bg: 'bg-blue-50', text: 'text-blue-500' } },
          { label: '待收货款', val: `¥${totalUnreceived.toLocaleString()}`, icon: CreditCard, color: { bg: 'bg-emerald-50', text: 'text-emerald-500' }, highlight: true },
          { label: '待付供应商', val: `¥${totalUnpaid.toLocaleString()}`, icon: FileText, color: { bg: 'bg-orange-50', text: 'text-orange-500' }, highlight: true },
          { label: '库存预警', val: `${warningCount} 种`, icon: Box, color: { bg: 'bg-rose-50', text: 'text-rose-500' }, alert: warningCount > 0 }
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110"><card.icon size={80}/></div>
            <div className="text-slate-500 text-sm font-medium mb-2 flex justify-between items-center relative z-10">{card.label} <div className={`p-2 ${card.color.bg} rounded-xl`}><card.icon size={18} className={card.color.text}/></div></div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight relative z-10 truncate ${card.alert ? 'text-rose-600' : 'text-slate-800'}`}>{card.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <PageHeader title="近六个月业财走势" action={<div className="flex gap-4"><span className="text-xs text-slate-600 flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-sm"/>销售额(w)</span><span className="text-xs text-slate-600 flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded-full"/>采购额(w)</span></div>} />
          <div className="flex-1 mt-2 min-h-[250px]">
            <BITrendChart data={trendData} yMax={yMax} />
          </div>
        </div>
        
        <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <PageHeader title="库存资产结构分析" />
          <div className="flex-1 min-h-[200px] mt-4">
             <BIPieChart data={pieData} />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center">
            {pieData.map(d => (
               <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                 <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }}></div>{d.name}
               </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white p-5 sm:p-7 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <PageHeader title="快捷操作工作流" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            {[{ id: 'sales-order-create', parent: 'sales', label: '新建订单', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
              { id: 'stock-in', parent: 'warehouse', label: '入库登记', icon: Box, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { id: 'products', parent: 'basic-data', label: '基础数据', icon: Database, color: 'text-violet-600', bg: 'bg-violet-50' },
              { id: 'audit-logs', parent: 'system', label: '安全审计', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' }
            ].map(link => (
              <button key={link.id} onClick={() => { setActiveTab(link.id); setExpandedMenus(prev => [...new Set([...prev, link.parent])]); }} className="flex flex-col items-center justify-center py-6 rounded-xl border border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all group">
                <div className={`w-12 h-12 rounded-2xl ${link.bg} flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors`}>
                  <link.icon size={24} className={`${link.color} group-hover:text-white`} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};