// src/context/AppContext.jsx
import React, { createContext, useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import * as mockData from '../data/mock';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 1. 核心业务持久化状态 (LocalStorage)
  const [systemDict, setSystemDict] = useLocalStorage('wms_v4_dict', mockData.initialDict);
  const [inventory, setInventory] = useLocalStorage('wms_v4_inventory', mockData.initialInventory); 
  const [salesOrders, setSalesOrders] = useLocalStorage('wms_v4_sales', mockData.initialSalesOrders);
  const [stockIn, setStockIn] = useLocalStorage('wms_v4_stockin', mockData.initialStockIn); 
  const [stockOut, setStockOut] = useLocalStorage('wms_v4_stockout', mockData.initialStockOut);
  const [products, setProducts] = useLocalStorage('wms_v4_products', mockData.initialProducts); 
  const [customers, setCustomers] = useLocalStorage('wms_v4_customers', mockData.initialCustomers);
  const [suppliers, setSuppliers] = useLocalStorage('wms_v4_suppliers', mockData.initialSuppliers); 
  const [users, setUsers] = useLocalStorage('wms_v4_users', mockData.initialUsers);
  const [roles, setRoles] = useLocalStorage('wms_v4_roles', mockData.initialRoles); 
  const [receivables, setReceivables] = useLocalStorage('wms_v4_receivables', mockData.initialReceivables);
  const [payables, setPayables] = useLocalStorage('wms_v4_payables', mockData.initialPayables);
  const [auditLogs, setAuditLogs] = useLocalStorage('wms_v4_auditlogs', mockData.initialAuditLogs);
  const [inventoryChecks, setInventoryChecks] = useLocalStorage('wms_v4_invchecks', mockData.initialInventoryChecks); 
  const [dealerRecords, setDealerRecords] = useLocalStorage('wms_v4_dealers', mockData.initialDealerRecords);

  // 2. 系统运行时状态 (运行时内存)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState(['warehouse', 'sales', 'system']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null); 
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, type: 'form', title: '', message: '', fields: [], formData: {}, onConfirm: null 
  });

  // 3. 全局通用操作函数
  const addLog = (module, action, details) => {
    const d = new Date();
    const t = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    setAuditLogs(prev => [{ id: Date.now() + Math.random(), timestamp: t, user: currentUser?.realName || '系统', module, action, details }, ...prev]);
  };

  const showConfirm = (title, msg, fn) => {
    setModalConfig({ isOpen: true, type: 'confirm', title, message: msg, onConfirm: fn });
  };

  const showForm = (title, fields, data, fn) => {
    setModalConfig({ isOpen: true, type: 'form', title, fields, formData: data || {}, onConfirm: fn });
  };

  const showMessage = (title, msg) => {
    setModalConfig({ isOpen: true, type: 'alert', title, message: msg });
  };

  // 4. 将所有状态和方法打包输出
  const contextValue = useMemo(() => ({
    // 用户与系统状态
    isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser,
    activeTab, setActiveTab, expandedMenus, setExpandedMenus, 
    isMobileMenuOpen, setIsMobileMenuOpen,
    currentDetail, setCurrentDetail, editingRecord, setEditingRecord,
    
    // 业务数据
    inventory, setInventory, salesOrders, setSalesOrders, stockIn, setStockIn, stockOut, setStockOut, 
    products, setProducts, customers, setCustomers, suppliers, setSuppliers, users, setUsers, 
    roles, setRoles, receivables, setReceivables, inventoryChecks, setInventoryChecks, 
    dealerRecords, setDealerRecords, payables, setPayables, auditLogs, systemDict, setSystemDict,
    
    // 方法与弹窗
    addLog, modalConfig, setModalConfig, showConfirm, showForm, showMessage
  }), [
    isAuthenticated, currentUser, activeTab, expandedMenus, isMobileMenuOpen, 
    currentDetail, editingRecord, inventory, salesOrders, stockIn, stockOut, 
    products, customers, suppliers, users, roles, receivables, payables, 
    auditLogs, inventoryChecks, dealerRecords, modalConfig, systemDict
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};