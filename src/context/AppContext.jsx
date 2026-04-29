import React, { createContext, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('isAuthenticated', false);
  const [currentUser, setCurrentUser] = useLocalStorage('currentUser', null);
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', 'dashboard');
  const [expandedMenus, setExpandedMenus] = useLocalStorage('expandedMenus', ['warehouse', 'sales', 'basic-data', 'system']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });
  const [messageConfig, setMessageConfig] = useState({ isOpen: false });
  const [formConfig, setFormConfig] = useState({ isOpen: false });
  
  const [currentDetail, setCurrentDetail] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const [systemDict, setSystemDict] = useLocalStorage('systemDict', {
    categories: ['电子产品', '办公耗材', '五金劳保', '安防设备', '通用物资'],
    units: ['件', '个', '台', '套', '箱', '米', '千克'],
    warehouses: ['中心主仓', '中转前置仓', '退货残次仓']
  });

  const [roles, setRoles] = useLocalStorage('roles', [
    { id: 1, name: '超级管理员', desc: '系统最高权限，拥有所有模块访问权', status: '启用', permissions: ['all'] },
    { id: 2, name: '库房主管', desc: '负责库存管理与出入库审核', status: '启用', permissions: ['warehouse', 'stock-in', 'stock-out', 'inventory-query', 'inventory-check'] },
    { id: 3, name: '销售专员', desc: '负责销售订单与客户维护', status: '启用', permissions: ['sales', 'sales-orders', 'customers'] }
  ]);

  const [users, setUsers] = useLocalStorage('users', [
    { id: 1, username: 'admin', password: '123', realName: '系统超级管理员', role: '超级管理员', status: '启用' },
    { id: 2, username: 'kuguan', password: '123', realName: '张库管', role: '库房主管', status: '启用' }
  ]);

  const [products, setProducts] = useLocalStorage('products', [
    { id: 1, code: 'PRD-001', name: '高清监控摄像头', spec: '1080P/夜视', category: '安防设备', unit: '台', price: 299.00, status: '上架' },
    { id: 2, code: 'PRD-002', name: '工业级防爆对讲机', spec: '5KM/防尘防水', category: '安防设备', unit: '部', price: 599.00, status: '上架' }
  ]);

  const [customers, setCustomers] = useLocalStorage('customers', [
    { id: 1, name: '金华市第一人民医院', contact: '王主任', phone: '13800138000', address: '金华市婺城区', level: 'VIP客户', status: '启用' },
    { id: 2, name: '义乌国际商贸城A区', contact: '陈经理', phone: '13900139000', address: '金华市义乌市', level: '战略合作伙伴', status: '启用' }
  ]);

  const [suppliers, setSuppliers] = useLocalStorage('suppliers', [
    { id: 1, name: '海康威视浙江总代', contact: '李总', phone: '13700137000', bankAccount: '6222021000123456789', status: '启用' },
    { id: 2, name: '大华科技华东运营', contact: '赵经理', phone: '13600136000', bankAccount: '6222021000987654321', status: '启用' }
  ]);

  // 新增：物理仓库的配置信息列表
  const [warehouses, setWarehouses] = useLocalStorage('warehouses', [
    { id: 1, code: 'WH-001', name: '中心主仓', manager: '张主管', location: '金华市婺城区某某街道1号', type: '中心主仓', status: '正常运营' },
    { id: 2, code: 'WH-002', name: '义乌前置仓', manager: '李专员', location: '金华市义乌市某某物流园', type: '中转前置仓', status: '正常运营' }
  ]);

  const [inventory, setInventory] = useLocalStorage('inventory', [
    { id: 1, code: 'PRD-001', name: '高清监控摄像头', warehouse: '中心主仓', currentStock: 150, minStock: 50, status: '正常' },
    { id: 2, code: 'PRD-002', name: '工业级防爆对讲机', warehouse: '中心主仓', currentStock: 20, minStock: 50, status: '库存预警' }
  ]);
  
  const [stockIn, setStockIn] = useLocalStorage('stockIn', []);
  const [stockOut, setStockOut] = useLocalStorage('stockOut', []);
  const [inventoryChecks, setInventoryChecks] = useLocalStorage('inventoryChecks', []);
  const [salesOrders, setSalesOrders] = useLocalStorage('salesOrders', []);
  const [dealerRecords, setDealerRecords] = useLocalStorage('dealerRecords', []);
  const [receivables, setReceivables] = useLocalStorage('receivables', []);
  const [payables, setPayables] = useLocalStorage('payables', []);
  const [auditLogs, setAuditLogs] = useLocalStorage('auditLogs', []);

  const addLog = useCallback((module, action, details) => {
    const newLog = { id: Date.now() + Math.random(), timestamp: new Date().toLocaleString('zh-CN', { hour12: false }), user: currentUser?.realName || 'System', module, action, details };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser, setAuditLogs]);

  const showConfirm = (title, content, onConfirm) => setConfirmConfig({ isOpen: true, title, content, onConfirm });
  const showMessage = (title, content) => setMessageConfig({ isOpen: true, title, content });
  const showForm = (title, fields, defaultValues, onSubmit) => setFormConfig({ isOpen: true, title, fields, defaultValues, onSubmit });
  const closeModal = () => { setConfirmConfig({ isOpen: false }); setMessageConfig({ isOpen: false }); setFormConfig({ isOpen: false }); };

  const contextValue = {
    isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser,
    activeTab, setActiveTab, expandedMenus, setExpandedMenus, isMobileMenuOpen, setIsMobileMenuOpen,
    confirmConfig, setConfirmConfig, showConfirm, messageConfig, setMessageConfig, showMessage,
    formConfig, setFormConfig, showForm, closeModal, currentDetail, setCurrentDetail, editingRecord, setEditingRecord,
    systemDict, setSystemDict, roles, setRoles, users, setUsers,
    products, setProducts, customers, setCustomers, suppliers, setSuppliers, warehouses, setWarehouses,
    inventory, setInventory, stockIn, setStockIn, stockOut, setStockOut, inventoryChecks, setInventoryChecks,
    salesOrders, setSalesOrders, dealerRecords, setDealerRecords, receivables, setReceivables, payables, setPayables,
    auditLogs, setAuditLogs, addLog
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};