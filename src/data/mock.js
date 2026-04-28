import { 
  LayoutDashboard, Box, ShoppingCart, Database, BarChart2, Settings 
} from 'lucide-react';
import { getLocalDate } from '../utils'; // 引入上一页我们抽离的日期工具

// 系统菜单架构配置
export const menuConfig = [
  { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { id: 'warehouse', label: '仓库管理', icon: Box, children: [ { id: 'stock-in', label: '入库管理' }, { id: 'stock-out', label: '出库管理' }, { id: 'inventory-query', label: '库存查询' }, { id: 'inventory-check', label: '库存盘点' } ] },
  { id: 'sales', label: '销管与财务', icon: ShoppingCart, children: [ { id: 'sales-orders', label: '销售订单' }, { id: 'dealer-manage', label: '经销管理' }, { id: 'receivables', label: '应收管理' }, { id: 'payables', label: '应付管理' } ] },
  { id: 'basic-data', label: '基础数据', icon: Database, children: [ { id: 'products', label: '商品管理' }, { id: 'customers', label: '客户管理' }, { id: 'suppliers', label: '供应商管理' } ] },
  { id: 'reports', label: '报表统计', icon: BarChart2, children: [ { id: 'report-inout', label: '出入库报表' }, { id: 'report-sales', label: '销售报表' }, { id: 'report-inventory', label: '库存报表' } ] },
  { id: 'system', label: '系统管理', icon: Settings, children: [ { id: 'users', label: '用户账号' }, { id: 'roles', label: '角色权限' }, { id: 'dictionary', label: '数据字典' }, { id: 'audit-logs', label: '操作日志' } ] }
];

// 全局数据字典
export const initialDict = {
  categories: ['服装', '安防装备', '办公耗材', '电子产品'],
  units: ['件', '套', '块', '双', '台', '个', '箱'],
  warehouses: ['主仓库', '备用仓库', '杭州1号仓']
};

// 初始库存数据
export const initialInventory = [
  { id: 1, code: '23123', name: '安保制服', spec: 'XL', warehouse: '主仓库', currentStock: 150, minStock: 50, status: '正常', cost: '¥120.00' }, 
  { id: 2, code: '23124', name: '防暴盾牌', spec: '标准', warehouse: '主仓库', currentStock: 30, minStock: 50, status: '库存预警', cost: '¥450.00' }, 
  { id: 3, code: '23125', name: '防刺服', spec: 'L', warehouse: '主仓库', currentStock: 210, minStock: 50, status: '正常', cost: '¥300.00' }
];

// 初始销售订单
export const initialSalesOrders = [
  { id: 1, orderNo: 'SO1776395186086800', customer: '客户 A', itemCount: '1种', totalCount: 1, totalAmount: '4444.00', status: '草稿', operator: '系统管理员', remark: '尽快发货', date: getLocalDate(), items: [{ id: 'item1', product: '防暴盾牌', qty: 1, price: 4444 }] },
  { id: 2, orderNo: 'SO1776395186086801', customer: '客户 B', itemCount: '1种', totalCount: 50, totalAmount: '12500.00', status: '已审核', operator: '张三', remark: '大客户订单', date: getLocalDate(), items: [{ id: 'item2', product: '安保制服', qty: 50, price: 250 }] }
];

// 初始入库单
export const initialStockIn = [
  { id: 1, orderNo: 'RK1776321057190', type: '采购入库', warehouse: '主仓库', supplier: '测试供应商', amount: '0.00', operator: 'admin', status: '待审核', remark: '日常采购批次', date: getLocalDate(), items: [{ id: 'item3', product: '防暴盾牌', qty: 1, price: 0 }] }
];

// 初始出库单
export const initialStockOut = [
  { id: 1, orderNo: 'CK1776321057888', type: '销售出库', warehouse: '主仓库', customer: '客户 A', amount: '4444.00', operator: '张三', status: '待发货', remark: '加急处理', date: getLocalDate(), items: [{ id: 'item4', product: '防暴盾牌', qty: 1, price: 4444 }] }
];

// 初始商品基础数据
export const initialProducts = [
  { id: 1, code: '23123', name: '安保制服', spec: 'XL', unit: '套', category: '服装', price: '200.00', status: '上架' }, 
  { id: 2, code: '23124', name: '防暴盾牌', spec: '标准', unit: '块', category: '安防装备', price: '500.00', status: '上架' }, 
  { id: 3, code: '23125', name: '防刺服', spec: 'L', unit: '件', category: '安防装备', price: '300.00', status: '上架' }
];

// 初始客户与供应商
export const initialCustomers = [
  { id: 1, name: '客户 A', contact: '李四', phone: '13912345678', address: '测试地址', status: '启用' }, 
  { id: 2, name: '客户 B', contact: '王五', phone: '13800000000', address: '测试地址', status: '启用' }
];
export const initialSuppliers = [
  { id: 1, name: '测试供应商', contact: '赵六', phone: '13700000000', address: '杭州市', status: '启用' }
];

// 初始账号与权限角色
export const initialUsers = [
  { id: 1, username: 'admin', password: '123', realName: '系统管理员', role: '超级管理员', status: '启用' }
];
export const initialRoles = [
  { id: 1, name: '超级管理员', desc: '系统最高权限', permissions: ['all'], status: '启用' }, 
  { id: 2, name: '仓库管理员', desc: '负责仓库出入库及盘点', permissions: ['dashboard', 'warehouse', 'stock-in', 'stock-out', 'inventory-query', 'inventory-check'], status: '启用' }
];

// 初始盘点记录
export const initialInventoryChecks = [
  { id: 1, orderNo: 'PD1776321057001', warehouse: '主仓库', date: getLocalDate(), itemCount: 1, diffAmount: '-400.00', status: '已完成', operator: 'admin', items: [{ id: 'item5', product: '安保制服', sysQty: 150, actualQty: 148, price: 200 }] }
];

// 初始经销管理记录
export const initialDealerRecords = [
  { id: 1, dealer: '经销商A', productCode: '23123', productName: '安保制服', spec: 'XL', qty: 100, price: '180.00', date: getLocalDate(), operator: 'admin', remark: '首次铺货' }
];

// 初始财务流水（应收/应付）
export const initialReceivables = [
  { id: 1, orderNo: 'SO1776395186086801', customer: '客户 B', totalAmount: '12500.00', receivedAmount: '10000.00', unreceivedAmount: '2500.00', status: '部分结清', date: getLocalDate(), payments: [{ date: getLocalDate(), amount: '10000.00', voucherNo: 'BANK888' }] }
];
export const initialPayables = [
  { id: 1, orderNo: 'RK1776321057999', supplier: '测试供应商', totalAmount: '8800.00', paidAmount: '8800.00', unpaidAmount: '0.00', status: '已结清', date: '2026-04-12', payments: [{ date: '2026-04-13', amount: '8800.00', voucherNo: 'PAY12345' }] }
];

// 初始系统操作日志
export const initialAuditLogs = [
  { id: 1, timestamp: `${getLocalDate()} 08:30:00`, user: '系统', module: '系统架构', action: '引擎初始化', details: 'WMS 4.0 LocalStorage 持久化与分页性能引擎加载成功。' }
];