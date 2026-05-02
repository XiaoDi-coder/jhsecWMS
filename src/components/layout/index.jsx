import { useContext, useEffect } from 'react';
import { User, LogOut, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { menuConfig } from '../../data/mock';
import myLogo from '../../assets/logo.png'; // 确保路径正确

const Layout = ({ children }) => {
  const { 
    setIsAuthenticated, currentUser, setCurrentUser,
    activeTab, setActiveTab, expandedMenus, setExpandedMenus, 
    isMobileMenuOpen, setIsMobileMenuOpen, roles, addLog 
  } = useContext(AppContext);

  // 处理窗口大小变化，自动关闭移动端菜单
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setIsMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobileMenuOpen]);

  // 权限校验逻辑
  const safeRoles = Array.isArray(roles) ? roles : [];
  const safeExpandedMenus = Array.isArray(expandedMenus) ? expandedMenus : [];

  const toggleMenu = (id) => setExpandedMenus(prev => {
    const p = Array.isArray(prev) ? prev : [];
    return p.includes(id) ? p.filter(m => m !== id) : [...p, id];
  });

  const userRolePerms = safeRoles.find(r => r.name === currentUser?.role)?.permissions || [];
  const hasPerm = (id) => userRolePerms.includes('all') || userRolePerms.includes(id);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* 移动端遮罩层 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* --- 左侧边栏 (Sidebar) --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-[72px] flex items-center px-6 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={()=>{setActiveTab('dashboard'); setIsMobileMenuOpen(false);}}>
          <img src={myLogo} alt="Logo" className="h-10 w-10 object-contain mr-3.5 rounded-lg bg-white p-1" />
          <div className="flex flex-col">
            <span className="font-bold text-[15px] text-white tracking-wide leading-tight">金华保安 WMS</span>
            <span className="text-[11px] text-blue-400/80 font-medium mt-0.5 tracking-wider uppercase">企业级仓销系统</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {menuConfig.map(menu => {
            if (!hasPerm(menu.id)) return null;
            const isExpanded = safeExpandedMenus.includes(menu.id);
            return (
              <div key={menu.id} className="mb-1 px-3">
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeTab === menu.id || (menu.children && menu.children.some(c => activeTab === c.id)) ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800 hover:text-white'}`} onClick={() => menu.children ? toggleMenu(menu.id) : setActiveTab(menu.id)}>
                  <div className="flex items-center"><menu.icon size={18} className="mr-3" /> <span className="font-medium text-sm">{menu.label}</span></div>
                  {menu.children && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                </div>
                {menu.children && isExpanded && (
                  <div className="mt-1 ml-4 border-l border-slate-800 pl-2 space-y-1">
                    {menu.children.map(child => hasPerm(child.id) && (
                      <div key={child.id} onClick={() => { setActiveTab(child.id); setIsMobileMenuOpen(false); }} className={`px-3 py-2 rounded-lg cursor-pointer text-sm transition-all flex items-center ${activeTab === child.id ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${activeTab === child.id ? 'bg-white' : 'bg-slate-600'}`}></div> {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* --- 右侧主区域 --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* --- 顶部导航 (Header) --- */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500 hover:text-slate-800 p-1" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
            <div className="hidden sm:flex items-center text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              {menuConfig.find(m => m.id === activeTab || (m.children && m.children.some(c => c.id === activeTab)))?.label || '导航'} <ChevronRight size={14} className="mx-1" />
              <span className="text-blue-600">{menuConfig.flatMap(m => m.children || []).find(c => c.id === activeTab)?.label || '主控台'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-5">
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl pr-4 border border-slate-100">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white"><User size={18} /></div>
              <div className="flex-col hidden sm:flex"><span className="text-sm font-bold text-slate-800 leading-tight">{currentUser?.realName}</span><span className="text-[11px] text-slate-500">{currentUser?.role}</span></div>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <button onClick={()=>{ localStorage.removeItem('wms_token'); localStorage.removeItem('wms_user'); setIsAuthenticated(false); setCurrentUser(null); setActiveTab('dashboard'); addLog('安全网关', '用户登出', '成功注销系统连接'); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200"><LogOut size={18} /></button>
          </div>
        </header>
        
        {/* --- 主体内容区 (Main Content) --- */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="animate-in fade-in duration-500 max-w-[1600px] w-full mx-auto flex-1 flex flex-col h-full">
            {/* 这里的 children 就是通过 activeTab 匹配到的具体页面组件 */}
            {children} 
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;