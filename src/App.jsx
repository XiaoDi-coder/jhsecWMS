import React, { lazy, Suspense, useContext, useMemo, useState, useEffect } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import { EmptyState } from './components/common'; 
import Layout from './components/layout'; // 引入我们新建的 Layout 布局组件

// ==========================================
// 页面懒加载 (保持你原有的配置)
// ==========================================
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
// 防崩溃护盾与 Loading (保持不变)
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
// 全局内联弹窗引擎 (保持不变)
// ==========================================
const GlobalModals = () => {
  const { confirmConfig, setConfirmConfig, messageConfig, setMessageConfig, formConfig, setFormConfig } = useContext(AppContext);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!formConfig.isOpen) return;
    const next = formConfig.defaultValues || {};
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
// 核心路由与应用内容挂载点
// ==========================================
const AppContent = () => {
  const { isAuthenticated, currentUser, activeTab } = useContext(AppContext);

  // 路由配置表
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

  // 防御：未登录状态直接拦截，不展示 Layout，只展示 LoginPage
  if (!isAuthenticated || !currentUser) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    // 使用我们刚抽离的 Layout 包裹核心内容
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          {routes[activeTab] || <EmptyState />}
        </Suspense>
      </ErrorBoundary>
      <GlobalModals />
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}