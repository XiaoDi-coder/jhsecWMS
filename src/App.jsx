import React, { lazy, Suspense, useContext, useEffect, useMemo, useState } from 'react';
import { User, LogOut, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { AppProvider, AppContext } from './context/AppContext';
import { EmptyState } from './components/common'; // 移除了导致崩溃的 CustomModal
import { menuConfig } from './data/mock';
import myLogo from './assets/logo.png';

// 页面懒加载：降低首屏体积，按需拉取功能页
const LoginPage = lazy(() => import('./pages/MiscPages').then((m) => ({ default: m.LoginPage })));
const OrderDetailPage = lazy(() => import('./pages/MiscPages').then((m) => ({ default: m.OrderDetailPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const InventoryQueryPage = lazy(() => import('./pages/InventoryQueryPage').then((m) => ({ default: m.InventoryQueryPage })));
const StockInPage = lazy(() => import('./pages/StockInPage').then((m) => ({ default: m.StockInPage })));
const StockInCreatePage = lazy(() => import('./pages/StockInPage').then((m) => ({ default: m.StockInCreatePage })));
const StockOutPage = lazy(() => import('./pages/StockOutPage').then((m) => ({ default: m.StockOutPage })));
const StockOutCreatePage = lazy(() => import('./pages/StockOutPage').then((m) => ({ default: m.StockOutCreatePage })));
const InventoryCheckPage = lazy(() => import('./pages/InventoryCheckPage').then((m) => ({ default: m.InventoryCheckPage })));
const InventoryCheckCreatePage = lazy(() => import('./pages/InventoryCheckPage').then((m) => ({ default: m.InventoryCheckCreatePage })));
const SalesOrdersPage = lazy(() => import('./pages/SalesOrdersPage').then((m) => ({ default: m.SalesOrdersPage })));
const SalesOrderCreatePage = lazy(() => import('./pages/SalesOrdersPage').then((m) => ({ default: m.SalesOrderCreatePage })));
const DealerManagePage = lazy(() => import('./pages/DealerManagePage').then((m) => ({ default: m.DealerManagePage })));
const DealerManageCreatePage = lazy(() => import('./pages/DealerManagePage').then((m) => ({ default: m.DealerManageCreatePage })));
const ReceivablesPage = lazy(() => import('./pages/ReceivablesPage').then((m) => ({ default: m.ReceivablesPage })));
const PayablesPage = lazy(() => import('./pages/PayablesPage').then((m) => ({ default: m.PayablesPage })));
const ProductsPage = lazy(() => import('./pages/BasicDataPages').then((m) => ({ default: m.ProductsPage })));
const CustomersPage = lazy(() => import('./pages/BasicDataPages').then((m) => ({ default: m.CustomersPage })));
const SuppliersPage = lazy(() => import('./pages/BasicDataPages').then((m) => ({ default: m.SuppliersPage })));
const WarehousesPage = lazy(() => import('./pages/BasicDataPages').then((m) => ({ default: m.WarehousesPage })));
const DictionaryManagePage = lazy(() => import('./pages/DictionaryManagePage').then((m) => ({ default: m.DictionaryManagePage })));
const RolesManagePage = lazy(() => import('./pages/SystemManagePages').then((m) => ({ default: m.RolesManagePage })));
const UsersManagePage = lazy(() => import('./pages/SystemManagePages').then((m) => ({ default: m.UsersManagePage })));
const AuditLogsPage = lazy(() => import('./pages/SystemManagePages').then((m) => ({ default: m.AuditLogsPage })));
const ReportInOutPage = lazy(() => import('./pages/ReportPages').then((m) => ({ default: m.ReportInOutPage })));
const ReportSalesPage = lazy(() => import('./pages/ReportPages').then((m) => ({ default: m.ReportSalesPage })));
const ReportInventoryPage = lazy(() => import('./pages/ReportPages').then((m) => ({ default: m.ReportInventoryPage })));

// ==========================================
// 🚨 防崩溃护盾：拦截一切导致白屏的致命错误 🚨
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-slate-50 p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-rose-100 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 text-4xl font-black">!</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">糟糕，模块渲染失败</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">系统护盾已成功拦截一次导致白屏的致命错误。这通常是因为本地残留的旧缓存数据结构与最新代码冲突造成的。</p>
            <div className="bg-slate-900 text-rose-400 p-4 rounded-xl font-mono text-sm overflow-x-auto mb-8 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </div>
            <div className="flex gap-4">
              <button onClick={() => { window.localStorage.clear(); window.location.reload(); }} className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-rose-500/30 transition-all">
                一键清空旧缓存并修复 (推荐)
              </button>
              <button onClick={() => window.location.reload()} className="flex-1 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                仅刷新重试
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[240px]">
    <div className="text-sm text-slate-500">页面加载中...</div>
  </div>
);

// ==========================================
// 💡 全局内联弹窗引擎 (无需外部引入) 💡
// ==========================================
const GlobalModals = () => {
  const { confirmConfig, setConfirmConfig, messageConfig, setMessageConfig, formConfig, setFormConfig } = useContext(AppContext);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!formConfig.isOpen) return;
    const next = formConfig.defaultValues || {};
    // 避免在 effect 同步 setState 引发级联渲染；next tick 再更新表单默认值
    Promise.resolve().then(() => setFormData(next));
  }, [formConfig.isOpen, formConfig.defaultValues]);

  return (
    <>
      {messageConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 mb-3">{messageConfig.title}</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{messageConfig.content}</p>
            <button onClick={() => setMessageConfig({ isOpen: false })} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">我知道了</button>
          </div>
        </div>
      )}
      
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 mb-3">{confirmConfig.title}</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{confirmConfig.content}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmConfig({ isOpen: false })} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors">取消</button>
              <button onClick={() => { confirmConfig.onConfirm(); setConfirmConfig({ isOpen: false }); }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">确认执行</button>
            </div>
          </div>
        </div>
      )}

      {formConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 mb-5">{formConfig.title}</h3>
            <div className="overflow-y-auto flex-1 pr-2 space-y-4 custom-scrollbar">
              {formConfig.fields?.map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:border-blue-500 bg-slate-50 transition-all text-sm">
                      <option value="">请选择</option>
                      {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:border-blue-500 bg-slate-50 transition-all text-sm" placeholder={`请输入${f.label}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
              <button onClick={() => setFormConfig({ isOpen: false })} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors">取消</button>
              <button onClick={() => { if (formConfig.onSubmit(formData) !== false) setFormConfig({ isOpen: false }); }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">保存数据</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// 主布局组件
// ==========================================
const MainLayout = () => {
  const { 
    isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser,
    activeTab, setActiveTab, expandedMenus, setExpandedMenus, 
    isMobileMenuOpen, setIsMobileMenuOpen, roles, addLog 
  } = useContext(AppContext);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setIsMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobileMenuOpen]);

  const routes = useMemo(() => ({
      'dashboard': <DashboardPage />,
      'inventory-query': <InventoryQueryPage />, 'stock-in': <StockInPage />, 'stock-in-create': <StockInCreatePage />,
      'stock-out': <StockOutPage />, 'stock-out-create': <StockOutCreatePage />,
      'inventory-check': <InventoryCheckPage />, 'inventory-check-create': <InventoryCheckCreatePage />,
      'sales-orders': <SalesOrdersPage />, 'sales-order-create': <SalesOrderCreatePage />,
      'dealer-manage': <DealerManagePage />, 'dealer-manage-create': <DealerManageCreatePage />,
      'receivables': <ReceivablesPage />, 'payables': <PayablesPage />,
      'products': <ProductsPage />, 'customers': <CustomersPage />, 'suppliers': <SuppliersPage />, 'warehouses': <WarehousesPage />,
      'dictionary': <DictionaryManagePage />, 'roles': <RolesManagePage />, 'users': <UsersManagePage />,
      'report-inout': <ReportInOutPage />, 'report-sales': <ReportSalesPage />, 'report-inventory': <ReportInventoryPage />,
      'audit-logs': <AuditLogsPage />,
      'order-detail': <OrderDetailPage />
    }), []);

  // 防御：未登录状态直接拦截
  if (!isAuthenticated || !currentUser) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

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
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

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

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
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
            <button onClick={()=>{ setIsAuthenticated(false); setCurrentUser(null); setActiveTab('dashboard'); addLog('安全网关', '用户登出', '成功注销系统连接'); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200"><LogOut size={18} /></button>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="animate-in fade-in duration-500 max-w-[1600px] w-full mx-auto flex-1 flex flex-col h-full">
            {/* 🛡️ 这里包裹了错误边界护盾 🛡️ */}
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                {routes[activeTab] || <EmptyState />}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
      
      {/* 挂载全局内联弹窗引擎 */}
      <GlobalModals />
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