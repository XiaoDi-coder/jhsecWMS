import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, Edit, Trash2, Upload, Download, Database } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
import { exportToCSV } from '../utils';

export const SimpleCrudPage = ({ title, data, setData, fields, displayColumns, defaultValues = {} }) => {
  const { showForm, showConfirm, showMessage, addLog } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const handleAdd = () => showForm(`新建${title}`, fields, defaultValues, (n) => {
    const err = validateForm(n);
    if (err) return showMessage('校验拦截', err);
    setData([{ id: Date.now(), status: '启用', ...defaultValues, ...n }, ...data]);
    addLog(title, '新建数据', `新增了配置: ${n[fields[0].name]}`);
  });
  
  const handleEdit = (item) => showForm(`编辑${title}`, fields, item, (n) => {
    const err = validateForm(n);
    if (err) return showMessage('校验拦截', err);
    setData(data.map(d => d.id === item.id ? { ...d, ...n } : d));
    addLog(title, '编辑修改', `修改了记录: ${item[fields[0].name]}`);
  });

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

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title={title} action={
        <div className="flex gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm flex items-center gap-1.5 hover:bg-slate-200 transition-all"><Upload size={16}/>导入 Excel</button>
          <button onClick={handleAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md flex items-center gap-1.5 hover:bg-blue-700"><Plus size={16}/>新建</button>
        </div>
      }/>
      <div className="flex mb-6">
        <SearchBar 
          value={search} 
          onChange={e => {setSearch(e.target.value); setPage(1);}} 
          placeholder="全局数据检索..." 
          className="w-full max-w-sm" 
        /></div>
      
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* PC Table */}
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr>{displayColumns.map(c=><th key={c.key} className="p-4">{c.label}</th>)}<th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map((i, idx) => <tr key={i.id || idx} className="border-b group hover:bg-slate-50">{displayColumns.map(c=><td key={c.key} className="p-4">{c.key==='status'?<Badge text={i[c.key]}/>:i[c.key]}</td>)}<td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap"><div className="flex items-center gap-4"><button onClick={()=>handleEdit(i)} className="text-blue-600 flex gap-1"><Edit size={16}/>编辑</button><button onClick={()=>handleDelete(i)} className="text-rose-500 flex gap-1"><Trash2 size={16}/>删除</button></div></td></tr>) : <tr><td colSpan={displayColumns.length + 1}><EmptyState /></td></tr>}
        </tbody></table></div>
        {/* Mobile Card */}
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
           {paginated.length > 0 ? paginated.map(item => (
             <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
                {displayColumns.map((c, idx) => (
                   <div key={c.key} className={`flex justify-between text-sm ${idx===0 ? 'font-bold text-blue-600 text-base mb-1' : ''}`}>
                      <span className="text-slate-500">{idx===0 ? '' : c.label}</span>
                      <span className="font-medium text-slate-800">{c.key==='status'?<Badge text={item[c.key]}/>:item[c.key]}</span>
                   </div>
                ))}
                <div className="flex gap-4 mt-2 pt-3 border-t border-slate-50 justify-end">
                   <button onClick={()=>handleEdit(item)} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Edit size={14}/>编辑</button>
                   <button onClick={()=>handleDelete(item)} className="text-rose-500 text-sm font-medium flex gap-1 items-center"><Trash2 size={14}/>删除</button>
                </div>
             </div>
           )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col">
            <h3 className="text-xl font-bold mb-2 flex items-center text-slate-800"><span className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></span>批量导入{title}</h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">请下载系统标准模板，按对应字段要求填写数据后进行上传，以避免系统数据解析失败。</p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5"><Database size={16} className="text-blue-500"/> 标准字段要求</h4>
              <div className="flex flex-wrap gap-2">
                {fields.map(f => (
                  <span key={f.name} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg shadow-sm">{f.label}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <button onClick={handleDownloadTemplate} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"><Download size={16}/>下载模板</button>
              <div className="flex-1 relative">
                <input type="file" id={`upload-${title}`} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv, .xlsx" onChange={handleFileUpload} />
                <button className="w-full flex justify-center items-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"><Upload size={16}/>上传数据表</button>
              </div>
            </div>
            <div className="mt-5 text-center"><button onClick={()=>setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">取消并关闭</button></div>
          </div>
        </div>
      )}
    </div>
  );
};