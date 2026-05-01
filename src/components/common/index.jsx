import { Calendar, ChevronLeft, ChevronRight, Search, FileText, ArrowLeft } from 'lucide-react';

const badgeStyles = {
  '已审核': 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
  '待审核': 'bg-amber-50 text-amber-600 border-amber-200/50',
  '已作废': 'bg-rose-50 text-rose-600 border-rose-200/50',
  '正常': 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
  '启用': 'bg-blue-50 text-blue-600 border-blue-200/50',
  '禁用': 'bg-rose-50 text-rose-600 border-rose-200/50',
  '入库': 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
  '出库': 'bg-amber-50 text-amber-600 border-amber-200/50',
};

export const PageHeader = ({ title, action, onBack }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-5 border-b border-slate-100/50 gap-4">
    <div className="flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="返回上一页"
        >
          <ArrowLeft size={16} />
        </button>
      )}
      <h2 className="text-[22px] font-black tracking-tight text-slate-800 flex items-center gap-3">
      <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
      {title}
      </h2>
    </div>
    {action && <div className="w-full sm:w-auto">{action}</div>}
  </div>
);

export const Badge = ({ text, type }) => {
  const colorStyle =
    badgeStyles[text] ||
    (type === 'danger'
      ? 'bg-rose-50 text-rose-600 border-rose-200/50'
      : type === 'success'
        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50'
        : 'bg-slate-100 text-slate-600 border-slate-200/50');

  return <span className={`px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${colorStyle}`}>{text}</span>;
};

export const Pagination = ({ current, total, onChange, totalPages }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
      <span className="text-sm text-slate-500 font-medium hidden sm:block">共 {total} 条数据，第 {current} / {totalPages} 页</span>
      <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <button disabled={current === 1} onClick={() => onChange(current - 1)} className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent shadow-sm bg-white active:scale-95 transition-all"><ChevronLeft size={16} /></button>
        <span className="text-sm text-slate-600 font-bold px-4 py-2 sm:hidden">{current} / {totalPages}</span>
        <button disabled={current === totalPages} onClick={() => onChange(current + 1)} className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent shadow-sm bg-white active:scale-95 transition-all"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

export const EmptyState = ({ message = '暂无数据' }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm"><FileText size={32} className="text-slate-300" strokeWidth={1.5} /></div>
    <div className="text-slate-500 font-medium">{message}</div>
    <div className="text-xs text-slate-400 mt-1">换个搜索条件试试看</div>
  </div>
);

export const SearchBar = ({ value, onChange, placeholder, className = '' }) => (
  <div className={`relative flex items-center ${className}`}>
    <Search size={16} className="absolute left-3.5 text-slate-400" />
    <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all font-medium placeholder-slate-400" />
  </div>
);

// 优化后的日期选择器，自带统一边框和圆角，并修复了内部间距
export const DateRangePicker = ({ startDate, setStartDate, endDate, setEndDate, className = '' }) => {
  return (
    <div className={`flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all ${className}`}>
      <Calendar size={16} className="text-slate-400 mr-2 shrink-0" />
      <input 
        type="date" 
        value={startDate} 
        onChange={e => setStartDate(e.target.value)} 
        className="bg-transparent text-sm text-slate-700 font-medium outline-none w-[115px] cursor-pointer p-0 border-0 focus:ring-0 text-center tracking-normal" 
      />
      <span className="text-slate-300 font-bold mx-2 shrink-0">-</span>
      <input 
        type="date" 
        value={endDate} 
        onChange={e => setEndDate(e.target.value)} 
        className="bg-transparent text-sm text-slate-700 font-medium outline-none w-[115px] cursor-pointer p-0 border-0 focus:ring-0 text-center tracking-normal" 
      />
    </div>
  );
};