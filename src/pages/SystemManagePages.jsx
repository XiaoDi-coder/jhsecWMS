import React, { useState, useMemo, useContext } from 'react';
import { Plus, Edit, Trash2, Lock, Download, X, CheckCircle2, Shield, UserCog, History } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
import { menuConfig } from '../data/mock';
import { exportToCSV } from '../utils';

// ========================================================
// 1. 角色权限引擎
// ========================================================
export const RolesManagePage = () => {
  const { roles, setRoles, users, showConfirm, showMessage, addLog } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', desc: '', status: '启用' });
  const [perms, setPerms] = useState([]);

  // 防御性保护
  const safeRoles = Array.isArray(roles) ? roles : [];
  const filtered = useMemo(() => safeRoles.filter(item => (item.name||'').includes(search) || (item.desc||'').includes(search)), [safeRoles, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handleOpenDrawer = (role = null) => {
    setEditingRole(role);
    if (role) {
      setFormData({ name: role.name, desc: role.desc, status: role.status || '启用' });
      setPerms(role.permissions || []);
    } else {
      setFormData({ name: '', desc: '', status: '启用' });
      setPerms([]);
    }
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.name.trim() === '') return showMessage('错误', '角色名称不能为空！');
    if (editingRole) {
      setRoles(safeRoles.map(r => r.id === editingRole.id ? { ...r, ...formData, permissions: perms } : r));
      addLog('角色管理', '编辑角色', `调整了角色 [${formData.name}] 的系统权限`);
    } else {
      setRoles([{ id: Date.now(), ...formData, permissions: perms }, ...safeRoles]);
      addLog('角色管理', '新建角色', `创建了具有 ${perms.length} 项权限的新角色 [${formData.name}]`);
    }
    setIsDrawerOpen(false);
  };

  const handleDeleteRole = (item) => {
    const safeUsers = Array.isArray(users) ? users : [];
    if (safeUsers.some(u => u.role === item.name)) return showMessage('操作拒绝', `无法删除！当前系统内仍有账号正在使用 [${item.name}] 角色。`);
    showConfirm('删除角色', `确定要彻底删除角色 [${item.name}] 吗？`, () => {
      setRoles(safeRoles.filter(d=>d.id!==item.id));
      addLog('角色管理','删除角色',`注销了角色配置: ${item.name}`);
    });
  };

  const handleParentToggle = (menuId, isChecked, children) => {
    let newPerms = [...perms];
    if (isChecked) {
      newPerms.push(menuId);
      if (children) children.forEach(c => newPerms.push(c.id));
    } else {
      newPerms = newPerms.filter(id => id !== menuId);
      if (children) children.forEach(c => newPerms = newPerms.filter(id => id !== c.id));
    }
    setPerms([...new Set(newPerms)].filter(p => p !== 'all'));
  };

  const handleChildToggle = (childId, parentId, isChecked) => {
    let newPerms = [...perms];
    if (isChecked) { newPerms.push(childId); newPerms.push(parentId); } 
    else newPerms = newPerms.filter(id => id !== childId);
    setPerms([...new Set(newPerms)].filter(p => p !== 'all'));
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm p-4 sm:p-8 min-h-full flex flex-col border border-slate-200/60">
      <PageHeader 
        title="系统角色引擎" 
        action={
          <button onClick={() => handleOpenDrawer()} className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95">
            <Plus size={16} strokeWidth={3} /> 创建新角色
          </button>
        } 
      />
      <div className="flex mb-6">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索角色名称或描述信息..." className="flex-1 sm:max-w-md bg-white border-slate-200 shadow-sm" />
      </div>
      
      <div className="rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden bg-white/80 flex-1 backdrop-blur-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600">
              <tr>
                <th className="p-4 pl-6 font-bold tracking-wide">角色名称</th>
                <th className="p-4 font-bold tracking-wide">描述信息</th>
                <th className="p-4 font-bold tracking-wide">模块权限范围</th>
                <th className="p-4 font-bold tracking-wide">当前状态</th>
                <th className="p-4 sticky right-0 bg-slate-50/80 w-1 whitespace-nowrap font-bold tracking-wide shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)]">操作管控</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map(item => (
                <tr key={item.id} className="border-b border-slate-100 group hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-bold text-slate-800 flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shadow-sm ${item.name === '超级管理员' ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 border border-amber-200/50' : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-100/50'}`}>
                      <Shield size={18} />
                    </div>
                    {item.name}
                  </td>
                  <td className="p-4 text-slate-500 font-medium">{item.desc}</td>
                  <td className="p-4">
                    {item.permissions?.includes('all') ? 
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100 shadow-sm">全部模块权限</span> : 
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">部分指定模块</span>
                    }
                  </td>
                  <td className="p-4"><Badge text={item.status} /></td>
                  <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors w-1 whitespace-nowrap shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-1">
                      {item.name === '超级管理员' ? (
                        <button disabled className="text-slate-400 font-bold flex gap-1.5 items-center px-3 py-2 cursor-not-allowed bg-slate-50 rounded-xl">
                          <Lock size={14} strokeWidth={2.5} /> 系统保护
                        </button>
                      ) : (
                        <>
                          <button onClick={()=>handleOpenDrawer(item)} className="text-blue-600 hover:text-blue-700 flex items-center gap-1.5 font-bold transition-colors px-3 py-2 rounded-xl hover:bg-blue-50 active:scale-95">
                            <Edit size={14} strokeWidth={2.5} /> 配置
                          </button>
                          <button onClick={()=>handleDeleteRole(item)} className="text-rose-500 hover:text-rose-600 flex items-center gap-1.5 font-bold transition-colors px-3 py-2 rounded-xl hover:bg-rose-50 active:scale-95">
                            <Trash2 size={14} strokeWidth={2.5} /> 删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="5"><EmptyState /></td></tr>}
            </tbody>
          </table>
        </div>
        
        {/* 移动端视图 */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
           {paginated.length > 0 ? paginated.map(item => (
             <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
               <div className="flex justify-between items-center">
                 <span className="font-bold text-slate-800 text-[15px] flex items-center gap-2.5">
                   <div className={`p-2 rounded-lg ${item.name === '超级管理员' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                     <Shield size={16} />
                   </div>
                   {item.name}
                 </span>
                 <Badge text={item.status} />
               </div>
               <div className="text-sm text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium leading-relaxed">{item.desc}</div>
               <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 mt-1">
                 {item.name !== '超级管理员' && (
                   <>
                     <button onClick={()=>handleOpenDrawer(item)} className="text-blue-600 flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors bg-white border border-slate-100"><Edit size={14}/> 配置权限</button>
                     <button onClick={()=>handleDeleteRole(item)} className="text-rose-500 flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl hover:bg-rose-50 transition-colors bg-white border border-slate-100"><Trash2 size={14}/> 移除</button>
                   </>
                 )}
               </div>
             </div>
           )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>

      {/* 现代感侧边抽屉 */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-7 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Shield size={20} /></div>
                {editingRole ? '编辑角色策略' : '新建系统角色'}
              </h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors active:scale-95"><X size={20} strokeWidth={2.5} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-7 custom-scrollbar space-y-6 bg-slate-50/50">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">角色名称 <span className="text-rose-500">*</span></label>
                  <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="如：系统运维专员" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">角色描述</label>
                  <input type="text" value={formData.desc} onChange={e=>setFormData({...formData, desc: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium" placeholder="一句话描述职责范围..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">状态</label>
                  <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium cursor-pointer">
                    <option value="启用">启用</option>
                    <option value="禁用">禁用</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <label className="block text-sm font-black text-slate-800 mb-4 flex items-center gap-2">分配模块访问权限</label>
                <div className="mb-5 pb-4 border-b border-slate-100">
                  <label className="flex items-center font-bold text-rose-600 cursor-pointer p-4 bg-gradient-to-r from-rose-50 to-white rounded-xl border border-rose-100 hover:border-rose-300 transition-all shadow-sm">
                    <input type="checkbox" checked={perms.includes('all')} onChange={(e) => setPerms(e.target.checked ? ['all'] : [])} className="mr-3 w-4 h-4 accent-rose-500 rounded cursor-pointer" />
                    授予【超级管理员】全部权限
                  </label>
                </div>
                {!perms.includes('all') && menuConfig.map(menu => (
                  <div key={menu.id} className="mb-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group">
                    <label className="flex items-center font-bold text-slate-700 cursor-pointer select-none mb-2">
                      <input type="checkbox" checked={perms.includes(menu.id)} onChange={(e) => handleParentToggle(menu.id, e.target.checked, menu.children)} className="mr-3 w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                      <menu.icon size={18} className="mr-2 text-slate-400 group-hover:text-blue-500 transition-colors"/> 
                      {menu.label}
                    </label>
                    {menu.children && <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-y-3 mt-3 pt-3 border-t border-dashed border-slate-200">
                      {menu.children.map(child => (
                        <label key={child.id} className="flex items-center text-sm font-bold text-slate-500 cursor-pointer hover:text-slate-800 transition-colors">
                          <input type="checkbox" checked={perms.includes(child.id)} onChange={(e) => handleChildToggle(child.id, menu.id, e.target.checked)} className="mr-2 w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer" />
                          {child.label}
                        </label>
                      ))}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white flex gap-4">
              <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-3.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors active:scale-95">取消</button>
              <button onClick={handleSave} className="flex-1 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/40 transition-all active:scale-95"><CheckCircle2 size={18} strokeWidth={3} /> 保存配置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================================
// 2. 用户账号通行证
// ========================================================
export const UsersManagePage = () => {
  const { users, setUsers, roles, showForm, showConfirm, showMessage, currentUser, addLog } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const safeUsers = Array.isArray(users) ? users : [];
  const safeRoles = Array.isArray(roles) ? roles : [];
  
  const filtered = useMemo(() => safeUsers.filter(item => (item.username||'').includes(search) || (item.realName||'').includes(search)), [safeUsers, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);
  const roleOptions = safeRoles.map(r => r.name);

  const handleAdd = () => {
    if (currentUser?.role !== '超级管理员') return showMessage('越权拦截', '仅【超级管理员】允许新建用户！');
    showForm('颁发新账号', [
      { name: 'username', label: '登录账号' }, { name: 'password', label: '初始密码', type: 'password' }, 
      { name: 'confirmPassword', label: '确认初始密码', type: 'password' }, { name: 'realName', label: '员工姓名' },
      { name: 'role', label: '分配角色', type: 'select', options: roleOptions }
    ], { role: roleOptions[0] }, (data) => {
      if (!data.username || !data.password || !data.confirmPassword || !data.role) return showMessage('错误', '请填写完整信息！');
      if (data.password !== data.confirmPassword) return showMessage('错误', '密码不一致！');
      if (safeUsers.find(u => u.username === data.username)) return showMessage('错误', '该登录账号已存在！');
      const { confirmPassword, ...userData } = data;
      setUsers([{ id: Date.now(), ...userData, status: '启用' }, ...safeUsers]);
      addLog('用户管理', '新建账号', `为员工 [${data.realName}] 开通了账号`);
    });
  };

  const handleEdit = (item) => {
    if (currentUser?.role !== '超级管理员') return showMessage('越权拦截', '仅【超级管理员】允许编辑用户配置！');
    showForm('配置账号权限', [
      { name: 'realName', label: '员工姓名' }, { name: 'role', label: '分配角色', type: 'select', options: roleOptions },
      { name: 'status', label: '通行状态', type: 'select', options: ['启用', '禁用'] }
    ], item, (data) => {
      if (!data.realName || !data.role) return showMessage('错误', '配置不能为空！');
      if (item.username === 'admin' && data.status === '禁用') return showMessage('操作失败', '内置管理员账号不可禁用！');
      setUsers(safeUsers.map(u => u.id === item.id ? { ...u, ...data } : u));
      addLog('用户管理', '配置调整', `修改了 [${item.realName}] 的权限`);
    });
  };

  const handleDelete = (item) => {
    if (currentUser?.role !== '超级管理员') return showMessage('越权拦截', '仅【超级管理员】允许执行删除操作！');
    if (item.username === 'admin') return showMessage('操作失败', '内置管理员账号不可删除！');
    showConfirm('删除用户', `确定彻底注销通行证 [${item.realName}] 吗？此操作不可恢复。`, () => { 
      setUsers(safeUsers.filter(u => u.id !== item.id)); 
      addLog('用户管理', '注销账号', `彻底注销了账号 [${item.username}]`);
    });
  };

  const handleResetPwd = (item) => {
    showForm('修改密码验证', [
      { name: 'oldPassword', label: '当前旧密码', type: 'password' }, { name: 'newPassword', label: '新密码', type: 'password' }, { name: 'confirmNewPassword', label: '确认新密码', type: 'password' }
    ], {}, (data) => {
      if (!data.oldPassword || !data.newPassword || !data.confirmNewPassword) return showMessage('错误', '请填写完整的密码信息！');
      if (data.oldPassword !== item.password) return showMessage('错误', '旧密码验证失败！');
      if (data.newPassword !== data.confirmNewPassword) return showMessage('错误', '两次输入的新密码不一致！');
      setUsers(safeUsers.map(u => u.id === item.id ? { ...u, password: data.newPassword } : u));
      showMessage('成功', '您的密码已更新成功，请牢记。');
    });
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm p-4 sm:p-8 min-h-full flex flex-col border border-slate-200/60">
      <PageHeader 
        title="系统用户通行证" 
        action={
          <button onClick={handleAdd} className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95">
            <UserCog size={16} strokeWidth={3} /> 颁发新账号
          </button>
        } 
      />
      <div className="flex mb-6">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索通行证账号或员工姓名..." className="flex-1 sm:max-w-md bg-white border-slate-200 shadow-sm" />
      </div>
      
      <div className="rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden bg-white/80 flex-1 backdrop-blur-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600">
              <tr>
                <th className="p-4 pl-6 font-bold tracking-wide">登录账号</th>
                <th className="p-4 font-bold tracking-wide">员工姓名</th>
                <th className="p-4 font-bold tracking-wide">配置角色</th>
                <th className="p-4 font-bold tracking-wide">通行状态</th>
                <th className="p-4 sticky right-0 bg-slate-50/80 w-1 font-bold tracking-wide shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)]">管控操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map(item => (
                <tr key={item.id} className="border-b border-slate-100 group hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-mono text-slate-600">{item.username}</td>
                  <td className="p-4 font-bold text-slate-800">{item.realName}</td>
                  <td className="p-4">
                    <span className="bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">{item.role}</span>
                  </td>
                  <td className="p-4"><Badge text={item.status} /></td>
                  <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors w-1 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>handleEdit(item)} className="text-blue-600 hover:text-blue-700 flex items-center gap-1.5 font-bold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-blue-50 active:scale-95">
                        <Edit size={14} strokeWidth={2.5} /> 配置
                      </button>
                      {item.id === currentUser?.id && (
                        <button onClick={()=>handleResetPwd(item)} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 font-bold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 active:scale-95">
                          <Lock size={14} strokeWidth={2.5} /> 改密
                        </button>
                      )}
                      <button onClick={()=>handleDelete(item)} className="text-rose-500 hover:text-rose-600 flex items-center gap-1.5 font-bold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-rose-50 active:scale-95">
                        <Trash2 size={14} strokeWidth={2.5} /> 注销
                      </button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="5"><EmptyState /></td></tr>}
            </tbody>
          </table>
        </div>
        
        {/* 移动端视图 */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
          {paginated.length > 0 ? paginated.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-base">{item.realName}</span>
                    <span className="text-xs text-slate-400 font-mono mt-0.5 tracking-tight">{item.username}</span>
                 </div>
                 <Badge text={item.status} />
              </div>
              <div className="flex justify-between items-center text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-medium">归属角色</span>
                <span className="font-bold text-slate-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-200">{item.role}</span>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 mt-1">
                <button onClick={()=>handleEdit(item)} className="text-blue-600 flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors bg-white border border-slate-100 active:scale-95"><Edit size={14}/>配置</button>
                {item.id === currentUser?.id && <button onClick={()=>handleResetPwd(item)} className="text-emerald-600 flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors bg-white border border-slate-100 active:scale-95"><Lock size={14}/>改密</button>}
                <button onClick={()=>handleDelete(item)} className="text-rose-500 flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl hover:bg-rose-50 transition-colors bg-white border border-slate-100 active:scale-95"><Trash2 size={14}/>注销</button>
              </div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

// ========================================================
// 3. 全局操作日志追踪
// ========================================================
export const AuditLogsPage = () => {
  const { auditLogs } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const safeLogs = Array.isArray(auditLogs) ? auditLogs : [];
  const filtered = useMemo(() => safeLogs.filter(i => (i.module||'').includes(search) || (i.action||'').includes(search) || (i.user||'').includes(search) || (i.details||'').includes(search)), [safeLogs, search]);
  
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  // 辅助函数：根据动作给背景和文字上色
  const getActionStyle = (action) => {
    const act = action || '';
    if (act.includes('删除') || act.includes('注销') || act.includes('拒绝')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (act.includes('新建') || act.includes('开通') || act.includes('审核')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (act.includes('编辑') || act.includes('修改') || act.includes('调整')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm p-4 sm:p-8 min-h-full flex flex-col border border-slate-200/60">
      <PageHeader 
        title="系统操作审计日志" 
        action={
          <button onClick={()=>exportToCSV('操作日志',[{label:'发生时间',key:'timestamp'},{label:'操作人',key:'user'},{label:'所属模块',key:'module'},{label:'动作指令',key:'action'},{label:'详细信息',key:'details'}],filtered)} className="text-slate-600 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all hover:-translate-y-0.5 flex items-center gap-2 active:scale-95">
            <Download size={16} className="text-blue-600" strokeWidth={3}/> 导出审计明细
          </button>
        } 
      />
      <div className="flex mb-6">
        <SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="全局检索模块、动作或操作人..." className="flex-1 sm:max-w-md bg-white border-slate-200 shadow-sm" />
      </div>
      
      <div className="rounded-2xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden bg-white/80 flex-1 backdrop-blur-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80">
              <tr>
                <th className="p-4 pl-6 w-48 font-bold tracking-wide">发生时间</th>
                <th className="p-4 w-40 font-bold tracking-wide">操作人</th>
                <th className="p-4 w-32 font-bold tracking-wide">所属模块</th>
                <th className="p-4 w-32 font-bold tracking-wide">动作指令</th>
                <th className="p-4 font-bold tracking-wide">操作详情报文</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map(i => (
                <tr key={i.id} className="border-b border-slate-100 group hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-mono text-[13px] text-slate-500 tracking-tight">{i.timestamp}</td>
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs shadow-sm">{i.user?.slice(0,1)}</div>
                    {i.user}
                  </td>
                  <td className="p-4"><Badge text={i.module}/></td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${getActionStyle(i.action)}`}>{i.action}</span></td>
                  <td className="p-4 text-slate-600 truncate max-w-2xl font-medium">{i.details}</td>
                </tr>
              )) : <tr><td colSpan="5"><EmptyState/></td></tr>}
            </tbody>
          </table>
        </div>
        
        {/* 移动端视图 */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
               <div className="flex justify-between items-center">
                 <span className="font-bold text-slate-800 flex items-center gap-3 text-[15px]">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs shadow-sm">{i.user?.slice(0,1)}</div>
                   {i.user}
                 </span>
                 <span className="font-mono text-[11px] text-slate-400 tracking-tight">{i.timestamp}</span>
               </div>
               <div className="flex items-center gap-3 text-sm">
                 <Badge text={i.module}/> 
                 <span className={`px-3 py-1 rounded-lg text-xs font-bold border shadow-sm ${getActionStyle(i.action)}`}>{i.action}</span>
               </div>
               <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed font-medium">{i.details}</div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};