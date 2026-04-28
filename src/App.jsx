import React, { useContext, useEffect } from 'react';
import { Package, User, LogOut, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { AppProvider, AppContext } from './context/AppContext';
import { EmptyState, CustomModal } from './components/common';
import { menuConfig } from './data/mock';

// 引入拆分后的所有页面模块
import { LoginPage, OrderDetailPage } from './pages/MiscPages';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryQueryPage } from './pages/InventoryQueryPage';
import { StockInPage, StockInCreatePage } from './pages/StockInPage';
import { StockOutPage, StockOutCreatePage } from './pages/StockOutPage';
import { InventoryCheckPage, InventoryCheckCreatePage } from './pages/InventoryCheckPage';
import { SalesOrdersPage, SalesOrderCreatePage } from './pages/SalesOrdersPage';
import { DealerManagePage, DealerManageCreatePage } from './pages/DealerManagePage';
import { ReceivablesPage } from './pages/ReceivablesPage';
import { PayablesPage } from './pages/PayablesPage';
import { ProductsPage, CustomersPage, SuppliersPage } from './pages/BasicDataPages';
import { DictionaryManagePage } from './pages/DictionaryManagePage';
import { RolesManagePage, UsersManagePage } from './pages/SystemManagePages';
import { ReportInOutPage, ReportSalesPage } from './pages/ReportPages';

const MainLayout = () => {
  const { 
    isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser,
    activeTab, setActiveTab, expandedMenus, setExpandedMenus, 
    isMobileMenuOpen, setIsMobileMenuOpen, roles, addLog 
  } = useContext(AppContext);

  // 响应式监听关闭侧边栏
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setIsMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) return <LoginPage />;

  // 路由映射表
  const renderContent = () => {
    const routes = {
      'dashboard': <DashboardPage />,
      'inventory-query': <InventoryQueryPage />, 'stock-in': <StockInPage />, 'stock-in-create': <StockInCreatePage />,
      'stock-out': <StockOutPage />, 'stock-out-create': <StockOutCreatePage />,
      'inventory-check': <InventoryCheckPage />, 'inventory-check-create': <InventoryCheckCreatePage />,
      'sales-orders': <SalesOrdersPage />, 'sales-order-create': <SalesOrderCreatePage />,
      'dealer-manage': <DealerManagePage />, 'dealer-manage-create': <DealerManageCreatePage />,
      'receivables': <ReceivablesPage />, 'payables': <PayablesPage />,
      'products': <ProductsPage />, 'customers': <CustomersPage />, 'suppliers': <SuppliersPage />,
      'dictionary': <DictionaryManagePage />, 'roles': <RolesManagePage />, 'users': <UsersManagePage />,
      'report-inout': <ReportInOutPage />, 'report-sales': <ReportSalesPage />,
      'order-detail': <OrderDetailPage />
    };
    return routes[activeTab] || <EmptyState />;
  };

  const toggleMenu = (id) => setExpandedMenus(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  const userRolePerms = roles.find(r => r.name === currentUser.role)?.permissions || [];
  const hasPerm = (id) => userRolePerms.includes('all') || userRolePerms.includes(id);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white text-lg tracking-wider border-b border-slate-800"><Package className="mr-3 text-blue-500" size={24} /> JHSEC WMS</div>
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {menuConfig.map(menu => {
            if (!hasPerm(menu.id)) return null;
            const isExpanded = expandedMenus.includes(menu.id);
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500 hover:text-slate-800 p-1" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
            <div className="hidden sm:flex items-center text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              {menuConfig.find(m => m.id === activeTab || (m.children && m.children.some(c => c.id === activeTab)))?.label} <ChevronRight size={14} className="mx-1" />
              <span className="text-blue-600">{menuConfig.flatMap(m => m.children || []).find(c => c.id === activeTab)?.label || '主控台'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-5">
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl pr-4 border border-slate-100">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white"><User size={18} /></div>
              <div className="flex-col hidden sm:flex"><span className="text-sm font-bold text-slate-800 leading-tight">{currentUser.realName}</span><span className="text-[11px] text-slate-500">{currentUser.role}</span></div>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <button onClick={()=>{ setIsAuthenticated(false); setCurrentUser(null); setActiveTab('dashboard'); addLog('安全网关', '用户登出', '成功注销系统连接'); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200"><LogOut size={18} /></button>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="animate-in fade-in duration-500 max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
            {renderContent()}
          </div>
        </main>
      </div>
      <CustomModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}