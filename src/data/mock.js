import { LayoutDashboard, Box, ShoppingCart, Database, BarChart2, Settings } from 'lucide-react';

export const menuConfig = [
  { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { id: 'warehouse', label: '仓储管理', icon: Box, children: [
    { id: 'inventory-query', label: '库存查询' },
    { id: 'stock-in', label: '入库管理' },
    { id: 'stock-out', label: '出库管理' },
    { id: 'inventory-check', label: '库存盘点' }
  ]},
  { id: 'sales', label: '销管与财务', icon: ShoppingCart, children: [
    { id: 'sales-orders', label: '销售订单' },
    { id: 'dealer-manage', label: '经销管理' },
    { id: 'receivables', label: '应收账款' },
    { id: 'payables', label: '应付账款' }
  ]},
  { id: 'basic-data', label: '基础数据', icon: Database, children: [
    { id: 'products', label: '商品管理' },
    { id: 'customers', label: '客户管理' },
    { id: 'suppliers', label: '供应商管理' },
    { id: 'warehouses', label: '仓库管理' }
  ]},
  { id: 'report', label: '报表统计', icon: BarChart2, children: [
    { id: 'report-inout', label: '出入库报表' },
    { id: 'report-sales', label: '销售报表' },
    { id: 'report-inventory', label: '库存报表' }
  ]},
  { id: 'system', label: '系统设置', icon: Settings, children: [
    { id: 'dictionary', label: '数据字典' },
    { id: 'roles', label: '角色权限' },
    { id: 'users', label: '用户账号' },
    { id: 'audit-logs', label: '操作日志' }
  ]}
];