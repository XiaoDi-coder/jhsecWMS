import React, { useState, useMemo, useContext } from 'react';
import { Search, Plus, Edit, Trash2, Lock } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { PageHeader, Badge, Pagination, EmptyState, SearchBar } from '../components/common';
import { menuConfig } from '../data/mock';
import { Download } from 'lucide-react';
import { exportToCSV } from '../utils';

export const RolesManagePage = () => {
  const { roles, setRoles, users, showConfirm, showMessage, addLog } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', desc: '', status: '启用' });
  const [perms, setPerms] = useState([]);

  const filtered = useMemo(() => roles.filter(item => item.name.includes(search) || item.desc.includes(search)), [roles, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  const handleOpenModal = (role = null) => {
    setEditingRole(role);
    if (role) {
      setFormData({ name: role.name, desc: role.desc, status: role.status || '启用' });
      setPerms(role.permissions || []);
    } else {
      setFormData({ name: '', desc: '', status: '启用' });
      setPerms([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.name.trim() === '') return showMessage('错误', '角色名称不能为空！');
    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...formData, permissions: perms } : r));
      addLog('角色管理', '编辑角色', `调整了角色 [${formData.name}] 的系统权限`);
    } else {
      setRoles([{ id: Date.now(), ...formData, permissions: perms }, ...roles]);
      addLog('角色管理', '新建角色', `创建了具有 ${perms.length} 项权限的新角色 [${formData.name}]`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteRole = (item) => {
    if (users.some(u => u.role === item.name)) {
      return showMessage('操作拒绝', `无法删除！当前系统内仍有账号正在绑定并使用 [${item.name}] 角色。`);
    }
    showConfirm('删除角色', `确定要彻底删除角色 [${item.name}] 吗？`, () => {
      setRoles(roles.filter(d=>d.id!==item.id));
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
    else { newPerms = newPerms.filter(id => id !== childId); }
    setPerms([...new Set(newPerms)].filter(p => p !== 'all'));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100 relative">
      <PageHeader title="系统角色引擎" action={<button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md flex gap-1.5"><Plus size={16} />配置新角色</button>} />
      <div className="flex mb-6"><SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索角色名称..." className="flex-1 sm:max-w-md" /></div>
      
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-4">角色名</th><th className="p-4">描述</th><th className="p-4">拥有权限</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap">操作</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map(item => (
            <tr key={item.id} className="border-b group hover:bg-slate-50"><td className="p-4 font-bold text-blue-600">{item.name}</td><td className="p-4 text-slate-600">{item.desc}</td><td className="p-4">{item.permissions?.includes('all') ? <Badge text="全部模块权限" /> : <Badge text="部分指定模块" />}</td><td className="p-4"><Badge text={item.status} /></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1 whitespace-nowrap"><div className="flex items-center gap-4">
              {item.name === '超级管理员' ? <><button disabled className="text-slate-300 font-medium flex gap-1"><Edit size={16}/>编辑</button><button disabled className="text-slate-300 font-medium flex gap-1"><Trash2 size={16}/>删除</button></> : <><button onClick={()=>handleOpenModal(item)} className="text-blue-600 flex gap-1"><Edit size={16}/>编辑</button><button onClick={()=>handleDeleteRole(item)} className="text-rose-500 flex gap-1"><Trash2 size={16}/>删除</button></>}
            </div></td></tr>
          )) : <tr><td colSpan="5"><EmptyState /></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(item => (
             /* Mobile view */
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600 text-base">{item.name}</span> <Badge text={item.status} /></div>
               <div className="text-sm text-slate-600 pb-2 border-b border-slate-50">{item.desc}</div>
               <div className="flex gap-4 pt-1 justify-end">
                 {item.name === '超级管理员' ? <span className="text-slate-400 text-sm">系统内置保留角色</span> : <>
                   <button onClick={()=>handleOpenModal(item)} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Edit size={14}/>编辑</button>
                   <button onClick={()=>handleDeleteRole(item)} className="text-rose-500 text-sm font-medium flex gap-1 items-center"><Trash2 size={14}/>删除</button>
                 </>}
               </div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>

      {/* Role Permission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-5 flex items-center text-slate-800"><span className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></span>{editingRole ? '编辑角色与权限' : '新建角色'}</h3>
            <div className="overflow-y-auto flex-1 px-1 space-y-5 custom-scrollbar">
              <div><label className="block text-sm font-medium mb-1.5">角色名称 <span className="text-rose-500">*</span></label><input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:border-blue-500 bg-slate-50 focus:bg-white" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div><label className="block text-sm font-medium mb-1.5">角色描述</label><input type="text" value={formData.desc} onChange={e=>setFormData({...formData, desc: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-sm font-medium mb-1.5">状态</label><select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white"><option value="启用">启用</option><option value="禁用">禁用</option></select></div>
              </div>
              <div className="pt-4 border-t border-slate-100 mt-2">
                <label className="block text-sm font-bold mb-4">分配模块访问权限</label>
                <div className="mb-5 pb-4 border-b border-slate-100">
                  <label className="flex items-center font-bold text-rose-600 cursor-pointer p-3 bg-rose-50 rounded-xl border border-rose-100"><input type="checkbox" checked={perms.includes('all')} onChange={(e) => setPerms(e.target.checked ? ['all'] : [])} className="mr-3 w-4 h-4 text-rose-500 rounded" />授予【超级管理员】全部权限</label>
                </div>
                {!perms.includes('all') && menuConfig.map(menu => (
                  <div key={menu.id} className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="flex items-center font-bold text-slate-700 cursor-pointer select-none mb-2"><input type="checkbox" checked={perms.includes(menu.id)} onChange={(e) => handleParentToggle(menu.id, e.target.checked, menu.children)} className="mr-3 w-4 h-4 text-blue-600 rounded" /><menu.icon size={18} className="mr-2 text-blue-500"/> {menu.label}</label>
                    {menu.children && <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-y-3 mt-3 pt-3 border-t border-dashed border-slate-300">
                      {menu.children.map(child => (
                        <label key={child.id} className="flex items-center text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"><input type="checkbox" checked={perms.includes(child.id)} onChange={(e) => handleChildToggle(child.id, menu.id, e.target.checked)} className="mr-2 w-3.5 h-3.5 text-blue-600 rounded" />{child.label}</label>
                      ))}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-5 border-t border-slate-100"><button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border rounded-xl hover:bg-slate-50 text-sm font-medium">取消</button><button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md">保存配置</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export const UsersManagePage = () => {
  const { users, setUsers, roles, showForm, showConfirm, showMessage, currentUser, addLog } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => users.filter(item => item.username.includes(search) || item.realName.includes(search)), [users, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);
  const roleOptions = roles.map(r => r.name);

  const handleAdd = () => {
    if (currentUser.role !== '超级管理员') return showMessage('越权拦截', '安全警告：仅【超级管理员】允许在系统内新建用户！');
    showForm('新建用户', [
      { name: 'username', label: '登录账号' }, { name: 'password', label: '初始密码', type: 'password' }, 
      { name: 'confirmPassword', label: '确认初始密码', type: 'password' }, { name: 'realName', label: '员工姓名' },
      { name: 'role', label: '分配角色', type: 'select', options: roleOptions }
    ], { role: roleOptions[0] }, (data) => {
      if (!data.username || !data.password || !data.confirmPassword || !data.role) return showMessage('错误', '请填写完整信息！');
      if (data.password !== data.confirmPassword) return showMessage('错误', '两次输入的初始密码不一致，请重新输入！');
      if (users.find(u => u.username === data.username)) return showMessage('错误', '该登录账号已存在，请更换！');
      const { confirmPassword, ...userData } = data;
      setUsers([{ id: Date.now(), ...userData, status: '启用' }, ...users]);
      addLog('用户管理', '新建账号', `为员工 [${data.realName}] 开通了账号`);
    });
  };

  const handleEdit = (item) => {
    if (currentUser.role !== '超级管理员') return showMessage('越权拦截', '安全警告：仅【超级管理员】允许在系统内编辑用户配置！');
    showForm('编辑用户 (密码受保护不可更改)', [
      { name: 'realName', label: '员工姓名' }, { name: 'role', label: '分配角色', type: 'select', options: roleOptions },
      { name: 'status', label: '状态', type: 'select', options: ['启用', '禁用'] }
    ], item, (data) => {
      if (!data.realName || !data.role) return showMessage('错误', '关键配置不能为空！');
      if (item.username === 'admin' && data.status === '禁用') return showMessage('操作失败', '系统保护规则：内置超级管理员【admin】账号不可被禁用！');
      if (item.username === 'admin' && data.role !== '超级管理员') return showMessage('操作失败', '系统保护规则：内置超级管理员【admin】必须保留最高权限角色！');
      setUsers(users.map(u => u.id === item.id ? { ...u, ...data } : u));
      addLog('用户管理', '配置调整', `修改了 [${item.realName}] 的权限状态`);
    });
  };

  const handleDelete = (item) => {
    if (currentUser.role !== '超级管理员') return showMessage('越权拦截', '安全警告：仅【超级管理员】允许执行删除用户操作！');
    if (item.username === 'admin') return showMessage('操作失败', '系统保护规则：内置超级管理员【admin】账号不可删除！');
    if (item.id === currentUser.id) return showMessage('操作失败', '系统保护规则：无法删除当前操作账号自身！');
    showConfirm('删除用户', `确定要彻底删除用户 [${item.realName}] 吗？该操作将注销其系统访问权。`, () => { 
      setUsers(users.filter(u => u.id !== item.id)); 
      addLog('用户管理', '注销账号', `彻底注销了账号 [${item.username}]`);
    });
  };

  const handleResetPwd = (item) => {
    showForm('修改个人密码', [
      { name: 'oldPassword', label: '旧密码', type: 'password' }, { name: 'newPassword', label: '新密码', type: 'password' }, { name: 'confirmNewPassword', label: '确认新密码', type: 'password' }
    ], {}, (data) => {
      if (!data.oldPassword || !data.newPassword || !data.confirmNewPassword) return showMessage('错误', '请填写完整的密码信息！');
      if (data.oldPassword !== item.password) return showMessage('错误', '旧密码输入错误，身份验证失败！');
      if (data.newPassword !== data.confirmNewPassword) return showMessage('错误', '两次输入的新密码不一致，请重新输入！');
      if (data.oldPassword === data.newPassword) return showMessage('错误', '新密码不能与旧密码相同！');
      setUsers(users.map(u => u.id === item.id ? { ...u, password: data.newPassword } : u));
      addLog('安全中心', '修改密码', `用户主动更换了安全令牌`);
      showMessage('成功', '您的密码已修改成功，下次登录请使用新密码！');
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100 relative">
      <PageHeader title="系统用户通行证" action={<button onClick={handleAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md flex gap-1.5"><Plus size={16} />颁发新账号</button>} />
      <div className="flex mb-6"><SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="搜索账号或姓名..." className="flex-1 sm:max-w-md" /></div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4">登录账号</th><th className="p-4">员工姓名</th><th className="p-4">配置角色</th><th className="p-4">状态</th><th className="p-4 sticky right-0 bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1">操作</th></tr></thead><tbody>
          {paginated.length > 0 ? paginated.map(item => (
            <tr key={item.id} className="border-b group hover:bg-slate-50"><td className="p-4 font-bold text-blue-600">{item.username}</td><td className="p-4 text-slate-700 font-medium">{item.realName}</td><td className="p-4 text-slate-600">{item.role}</td><td className="p-4"><Badge text={item.status} /></td>
            <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)] w-1"><div className="flex items-center gap-4">
              <button onClick={()=>handleEdit(item)} className="text-blue-600 flex items-center gap-1 font-medium"><Edit size={16}/>配置</button>
              {item.id === currentUser.id && <button onClick={()=>handleResetPwd(item)} className="text-emerald-600 flex items-center gap-1 font-medium"><Lock size={16}/>改密</button>}
              <button onClick={()=>handleDelete(item)} className="text-rose-500 flex items-center gap-1 font-medium"><Trash2 size={16}/>注销</button>
            </div></td></tr>
          )) : <tr><td colSpan="5"><EmptyState /></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-bold text-blue-600 text-base">{item.username}</span> <Badge text={item.status} /></div>
               <div className="text-sm text-slate-600 flex justify-between border-b border-slate-50 pb-2"><span>姓名: <span className="font-medium text-slate-800">{item.realName}</span></span> <span>{item.role}</span></div>
               <div className="flex gap-4 pt-1 justify-end">
                 <button onClick={()=>handleEdit(item)} className="text-blue-600 text-sm font-medium flex gap-1 items-center"><Edit size={14}/>配置</button>
                 {item.id === currentUser.id && <button onClick={()=>handleResetPwd(item)} className="text-emerald-600 text-sm font-medium flex gap-1 items-center"><Lock size={14}/>改密</button>}
                 <button onClick={()=>handleDelete(item)} className="text-rose-500 text-sm font-medium flex gap-1 items-center"><Trash2 size={14}/>注销</button>
               </div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};

export const AuditLogsPage = () => {
  const { auditLogs } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => auditLogs.filter(i => i.module.includes(search) || i.action.includes(search) || i.user.includes(search) || i.details.includes(search)), [auditLogs, search]);
  const safePage = Math.max(1, Math.min(page, Math.ceil(filtered.length / 10) || 1));
  const paginated = filtered.slice((safePage - 1) * 10, safePage * 10);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 min-h-full flex flex-col border border-slate-100">
      <PageHeader title="系统操作日志" action={<button onClick={()=>exportToCSV('操作日志',[{label:'发生时间',key:'timestamp'},{label:'操作人',key:'user'},{label:'所属模块',key:'module'},{label:'动作指令',key:'action'},{label:'详细信息',key:'details'}],filtered)} className="text-blue-600 border border-blue-600 px-4 py-2 rounded-xl text-sm flex gap-1.5"><Download size={16}/>导出审计表</button>} />
      <div className="flex mb-6"><SearchBar value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="全局检索模块/操作人/动作/详情..." className="flex-1 sm:max-w-md" /></div>
      <div className="rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="bg-slate-50 text-slate-600 border-b border-slate-200"><tr><th className="p-4 w-48">发生时间</th><th className="p-4 w-32">操作人</th><th className="p-4 w-32">所属模块</th><th className="p-4 w-32">动作指令</th><th className="p-4">操作详情</th></tr></thead><tbody>
          {paginated.map(i => (
            <tr key={i.id} className="border-b group hover:bg-slate-50 text-slate-600"><td className="p-4 font-mono text-xs">{i.timestamp}</td><td className="p-4 font-medium text-slate-800">{i.user}</td><td className="p-4"><Badge text={i.module}/></td><td className="p-4 font-bold text-blue-600">{i.action}</td><td className="p-4 truncate max-w-lg">{i.details}</td></tr>
          ))}
          {paginated.length === 0 && <tr><td colSpan="5"><EmptyState/></td></tr>}
        </tbody></table></div>
        <div className="md:hidden flex flex-col gap-3 p-3 bg-slate-50">
          {paginated.length > 0 ? paginated.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2">
               <div className="flex justify-between items-center"><span className="font-medium text-slate-800">{i.user}</span> <span className="text-xs text-slate-400">{i.timestamp}</span></div>
               <div className="text-sm"><Badge text={i.module}/><span className="ml-2 font-bold text-blue-600">{i.action}</span></div>
               <div className="text-sm text-slate-500 mt-1 border-t border-slate-50 pt-2">{i.details}</div>
            </div>
          )) : <EmptyState />}
        </div>
        <Pagination current={safePage} total={filtered.length} totalPages={Math.ceil(filtered.length / 10) || 1} onChange={setPage} />
      </div>
    </div>
  );
};