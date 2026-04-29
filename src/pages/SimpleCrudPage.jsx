import React, { useState, useMemo, useContext } from 'react';
import { Plus, Edit, Trash2, Upload, Download, Database, X, FileText, CheckCircle2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
import { exportToCSV } from '../utils';

export const SimpleCrudPage = ({ title, data, setData, fields, displayColumns, defaultValues = {} }) => {
  const { showConfirm, showMessage, addLog } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // 新增：侧边抽屉状态管理
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const filtered = useMemo(() => data.filter(item => Object.values(item).some(val => String(val).includes(search))), [data, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const validateForm = (n) => {
    for (let f of fields) {
      if (f.name === 'status' || f.name === 'category' || f.name === 'unit') continue;
      if (n[f.name] === undefined || String(n[f.name]).trim() === '') return `[${f.label}] 是必填项，不能为空！`;
    }
    return null;
  };

  // 打开新建抽屉
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ status: '启用', ...defaultValues });
    setIsDrawerOpen(true);
  };

  // 打开编辑抽屉
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsDrawerOpen(true);
  };

  // 抽屉表单提交
  const handleDrawerSubmit = () => {
    const err = validateForm(formData);
    if (err) return showMessage('校验拦截', err);

    if (editingItem) {
      setData(data.map(d => d.id === editingItem.id ? { ...d, ...formData } : d));
      addLog(title, '编辑修改', `修改了记录: ${formData[fields[0].name]}`);
      showMessage('保存成功', '数据已更新');
    } else {
      setData([{ id: Date.now(), status: '启用', ...defaultValues, ...formData }, ...data]);
      addLog(title, '新建数据', `新增了配置: ${formData[fields[0].name]}`);
      showMessage('创建成功', '新数据已入库');
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (item) => showConfirm('删除', '确定要彻底删除这条数据吗？操作不可逆。', () => {
    setData(data.filter(d=>d.id!==item.id));
    addLog(title, '删除数据', `删除了记录: ${item[fields[0].name]}`);
  });

  const handleDownloadTemplate = () => {
    const templateHeaders = fields.map(f => ({ label: f.label, key: f.name }));
    exportToCSV(`${title}批量导入模板`, templateHeaders, []); 
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImportModalOpen(false);
    showMessage('数据解析中', `正在智能读取 ${file.name} 中的数据行...`);
    setTimeout(() => {
      const mockCount = Math.floor(Math.random() * 5) + 3;
      const newItems = Array.from({length: mockCount}).map((_, i) => ({
        id: Date.now() + i, status: '启用', ...defaultValues,
        [fields[0].name]: `IMP${Date.now().toString().slice(-4)}${i}`,
        [fields[1].name]: `批量导入 ${i+1}`
      }));
      setData(prev => [...newItems, ...prev]);
      addLog(title, '批量导入', `系统通过 Excel 文件自动导入了 ${mockCount} 条数据`);
      showMessage('导入成功', `文件解析完毕，系统已将 ${mockCount} 条合规数据无缝追加至底层。`);
      e.target.value = '';
    }, 1200);
  };

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all hover:border-slate-300";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100 relative overflow-hidden">
      <PageHeader 
        title={title} 
        action={
          <div className="flex gap-3">
            <button 
              onClick={() => setIsImportModalOpen(true)} 
              className="bg-white text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm border border-slate-200 flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Upload size={16} className="text-blue-500" />导入 Excel
            </button>
            <button 
              onClick={handleOpenAdd} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-blue-500/20 flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all transform active:scale-95"
            >
              <Plus size={16} />新建配置
            </button>
          </div>
        }
      />
      
      <div className="flex mb-6">
        <SearchBar 
          value={search} 
          onChange={e=>{setSearch(e.target.value);setPage(1);}} 
          placeholder="全局数据检索..." 
          className="w-full max-w-sm" 
        />
      </div>
      
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
        {/* PC Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {displayColumns.map((c, idx) => (
                  <th key={c.key} className={`p-4 font-medium text-slate-600 ${idx === 0 ? 'pl-6' : ''}`}>
                    {c.label}
                  </th>
                ))}
                <th className="p-4 font-medium text-slate-600 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((i, idx) => (
                <tr key={i.id || idx} className="border-b border-slate-100 group hover:bg-slate-50 transition-colors">
                  {displayColumns.map((c, colIdx) => (
                    <td key={c.key} className={`p-4 ${colIdx === 0 ? 'pl-6 font-bold text-slate-800' : 'text-slate-600'}`}>
                      {c.key === 'status' ? <Badge text={i[c.key]} /> : (c.key === 'code' ? <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{i[c.key]}</span> : i[c.key])}
                    </td>
                  ))}
                  <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap transition-colors">
                    <div className="flex items-center gap-4">
                      <button onClick={()=>handleOpenEdit(i)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-medium transition-colors"><Edit size={16}/>配置</button>
                      <button onClick={()=>handleDelete(i)} className="text-rose-500 hover:text-rose-700 flex items-center gap-1.5 font-medium transition-colors"><Trash2 size={16}/>删除</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={displayColumns.length + 1}><EmptyState /></td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile Card */}
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
           {paginated.length > 0 ? paginated.map(item => (
             <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800 text-lg leading-tight break-all mr-3">{item[displayColumns[0].key]}</span>
                  {displayColumns.some(c => c.key === 'status') && <Badge text={item.status} />}
                </div>
                
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                  {displayColumns.slice(1).map(c => {
                    if (c.key === 'status') return null;
                    return (
                      <div key={c.key} className="flex justify-between text-sm">
                        <span className="text-slate-500">{c.label}</span>
                        <span className="font-medium text-slate-800">
                           {c.key === 'code' ? <span className="font-mono text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded">{item[c.key]}</span> : item[c.key]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex gap-3 pt-2 mt-1 justify-end">
                   <button onClick={()=>handleOpenEdit(item)} className="text-blue-600 text-sm font-medium flex gap-1.5 items-center px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"><Edit size={14}/>配置修改</button>
                   <button onClick={()=>handleDelete(item)} className="text-rose-500 text-sm font-medium flex gap-1.5 items-center px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"><Trash2 size={14}/>彻底删除</button>
                </div>
             </div>
           )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>

      {/* --- 高级感侧边抽屉 (新建/编辑) --- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* 模糊背景遮罩 */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          
          {/* 抽屉面板 */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* 抽屉头部 */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                {editingItem ? `编辑${title}` : `新建${title}`}
              </h3>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 抽屉表单内容区域 */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {field.label}
                    {field.name !== 'status' && field.name !== 'category' && field.name !== 'unit' && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <div className="relative">
                      <select 
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="">请选择{field.label}</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ) : (
                    <input 
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                      placeholder={`请输入${field.label}`}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* 抽屉底部操作栏 */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleDrawerSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                <CheckCircle2 size={18} />
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 批量导入弹窗 (维持优化后的质感) --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl flex flex-col border border-white/20 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Upload size={20} /></div>
              <h3 className="text-xl font-bold text-slate-800">批量导入{title}</h3>
            </div>
            
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              为了确保数据能够被系统精准解析，请先<span className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={handleDownloadTemplate}>下载标准Excel模板</span>，按照要求的字段格式填写后，再上传您的文件。
            </p>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Database size={16} className="text-emerald-500"/> 系统要求的标准字段
              </h4>
              <div className="flex flex-wrap gap-2">
                {fields.map(f => (
                  <span key={f.name} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg shadow-sm">{f.label}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <div className="relative">
                <input type="file" id={`upload-${title}`} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".csv, .xlsx" onChange={handleFileUpload} />
                <div className="w-full flex justify-center items-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <Upload size={18} className="relative z-10"/> 
                  <span className="relative z-10">选择文件并开始上传</span>
                </div>
              </div>
              <button 
                onClick={()=>setIsImportModalOpen(false)} 
                className="w-full py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
              >
                取消并关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};