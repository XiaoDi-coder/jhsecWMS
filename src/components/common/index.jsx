import React, { useContext } from 'react';
import { Inbox, ArrowLeft, Search } from 'lucide-react';
import { AppContext } from '../../context/AppContext'; // 引入刚才创建的全局上下文

export const EmptyState = () => (
  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
    <Inbox size={48} strokeWidth={1} className="mb-3 text-slate-200" />
    <span className="text-sm font-medium">暂无数据记录</span>
  </div>
);

export const PageHeader = ({ title, action, onBack }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div className="flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm">
          <ArrowLeft size={16} /> 返回
        </button>
      )}
      <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center">
        {!onBack && <span className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></span>}{title}
      </h2>
    </div>
    {action}
  </div>
);

export const Badge = ({ text }) => {
  if (!text) return null;
  let color = 'bg-slate-100 text-slate-600 border-slate-200'; 
  if (['已审核', '正常', '已完成', '已发货', '启用', '已结清', '上架'].includes(text)) color = 'bg-emerald-50 text-emerald-600 border-emerald-200'; 
  else if (['草稿', '待审核', '待发货', '盘点中', '修改申请中'].includes(text) || String(text).includes('出库')) color = 'bg-orange-50 text-orange-600 border-orange-200'; 
  else if (['库存预警', '禁用', '下架', '未结清'].includes(text)) color = 'bg-rose-50 text-rose-600 border-rose-200'; 
  else if (['部分结清', '历史快照'].includes(text) || String(text).includes('入库')) color = 'bg-blue-50 text-blue-600 border-blue-200'; 
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${color}`}>{text}</span>;
};

export const DateRangePicker = ({ startDate, setStartDate, endDate, setEndDate }) => (
  <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all shadow-sm">
    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="px-3 py-2.5 outline-none text-sm w-[130px] text-slate-600 bg-transparent" />
    <span className="text-slate-400 bg-slate-50 px-2 py-2.5 text-sm font-medium border-x border-slate-100">至</span>
    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="px-3 py-2.5 outline-none text-sm w-[130px] text-slate-600 bg-transparent" />
  </div>
);

export const Pagination = ({ current, total, totalPages, onChange }) => {
  if (total === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border border-t-0 border-slate-200 bg-slate-50 rounded-b-xl shadow-sm gap-3">
      <div className="text-sm text-slate-500">共 <span className="font-bold text-slate-800">{total}</span> 条记录</div>
      <div className="flex items-center gap-2 sm:gap-4">
         <button onClick={()=>onChange(current-1)} disabled={current<=1} className="text-sm font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 disabled:text-slate-300 disabled:bg-transparent transition-colors shadow-sm disabled:shadow-none">上一页</button>
         <span className="text-sm font-bold text-slate-800 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg">{current} <span className="text-slate-400 font-normal mx-1">/</span> {totalPages}</span>
         <button onClick={()=>onChange(current+1)} disabled={current>=totalPages} className="text-sm font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 disabled:text-slate-300 disabled:bg-transparent transition-colors shadow-sm disabled:shadow-none">下一页</button>
      </div>
    </div>
  );
};

// 之前讨论过的统一搜索框组件，我也帮你放进来了，以后可以直接用
export const SearchBar = ({ value, onChange, placeholder = "搜索...", className = "flex-1 sm:max-w-xs" }) => (
  <div className={`relative ${className}`}>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
    />
    <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
  </div>
);

// 全局弹窗组件 (依赖 AppContext)
export const CustomModal = () => {
  const { modalConfig, setModalConfig } = useContext(AppContext);
  if (!modalConfig.isOpen) return null;
  const close = () => setModalConfig({ ...modalConfig, isOpen: false });

  if (modalConfig.type === 'confirm' || modalConfig.type === 'alert') {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-bold mb-3 text-slate-800">{modalConfig.title}</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{modalConfig.message}</p>
          <div className="flex justify-end gap-3">
            {modalConfig.type === 'confirm' && (
              <button onClick={close} className="px-5 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 text-slate-600">取消</button>
            )}
            <button onClick={() => { modalConfig.onConfirm && modalConfig.onConfirm(); close(); }} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-500/20">确认</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold mb-5 flex items-center text-slate-800"><span className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></span>{modalConfig.title}</h3>
        <div className="overflow-y-auto flex-1 px-1 space-y-4 custom-scrollbar">
          {modalConfig.fields?.map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              {f.type === 'select' ? (
                <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white" value={modalConfig.formData[f.name] || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, [f.name]: e.target.value } })}>
                  <option value="">请选择</option>{f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type || 'text'} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-slate-50 focus:bg-white placeholder-slate-400" value={modalConfig.formData[f.name] || ''} onChange={e => setModalConfig({ ...modalConfig, formData: { ...modalConfig.formData, [f.name]: e.target.value } })} placeholder={`请输入${f.label}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3 pt-5 border-t border-slate-100">
          <button onClick={close} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 text-slate-600">取消</button>
          <button onClick={() => { modalConfig.onConfirm(modalConfig.formData); close(); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-500/20">保存提交</button>
        </div>
      </div>
    </div>
  );
};