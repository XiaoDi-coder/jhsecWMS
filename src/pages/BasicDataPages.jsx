import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { SimpleCrudPage } from './SimpleCrudPage';
import request from '../utils/request';

// ==========================================
// 1. 商品管理
// ==========================================
export const ProductsPage = () => {
  const { products, setProducts, systemDict } = useContext(AppContext);
  
  // 【防崩溃保护】：如果本地缓存损坏或丢失字段，自动降级到安全默认值
  const safeDict = systemDict || {};
  const categories = Array.isArray(safeDict.categories) && safeDict.categories.length > 0 ? safeDict.categories : ['电子产品', '通用物资'];
  const units = Array.isArray(safeDict.units) && safeDict.units.length > 0 ? safeDict.units : ['件', '个'];

  const formFields = [
    { name: 'code', label: '商品编码' }, 
    { name: 'name', label: '商品名称' }, 
    { name: 'spec', label: '规格型号' }, 
    { name: 'category', label: '商品分类', type: 'select', options: categories }, 
    { name: 'unit', label: '计量单位', type: 'select', options: units }, 
    { name: 'price', label: '标准指导价(元)', type: 'number' }, 
    { name: 'status', label: '上架状态', type: 'select', options: ['上架', '下架'] }
  ];
  
  const productPersist = {
    create: async (formData) => {
      const resp = await request.post('/products', {
        product_code: formData.code,
        product_name: formData.name,
        category: formData.category,
        unit: formData.unit,
        standard_price: Number(formData.price || 0),
      });
      return {
        id: resp?.data?.id,
        ...formData,
      };
    },
    update: async (oldItem, formData) => {
      await request.put(`/products/${oldItem.id}`, {
        product_name: formData.name,
        category: formData.category,
        unit: formData.unit,
        standard_price: Number(formData.price || 0),
      });
    },
    remove: async (item) => {
      await request.delete(`/products/${item.id}`);
    },
  };

  return (
    <SimpleCrudPage 
      title="商品物资库" 
      data={products || []} // 保护 data 不为 undefined
      setData={setProducts} 
      fields={formFields} 
      displayColumns={[
        {key:'code', label:'商品编码'}, {key:'name', label:'商品名称'}, 
        {key:'category', label:'所属分类'}, {key:'price', label:'标准指导价'}, 
        {key:'status', label:'状态'}
      ]} 
      defaultValues={{ status: '上架', unit: units[0], category: categories[0] }} 
      persist={productPersist}
    />
  );
};

// ==========================================
// 2. 客户管理
// ==========================================
export const CustomersPage = () => {
  const { customers, setCustomers } = useContext(AppContext);
  const formFields = [
    { name: 'name', label: '客户/企业名称' }, 
    { name: 'contact', label: '主要联系人' }, 
    { name: 'phone', label: '联系电话' }, 
    { name: 'address', label: '详细地址' },
    { name: 'level', label: '客户等级', type: 'select', options: ['普通客户', 'VIP客户', '战略合作伙伴'] },
    { name: 'status', label: '合作状态', type: 'select', options: ['启用', '禁用'] }
  ];
  const customerPersist = {
    create: async (formData) => {
      const code = `CUS${Date.now()}`;
      const resp = await request.post('/partners', {
        partner_code: code,
        partner_name: formData.name,
        partner_type: 'CUSTOMER',
        contact_person: formData.contact,
        contact_phone: formData.phone,
      });
      return { id: resp?.data?.id, ...formData };
    },
    update: async () => {
      // 当前后端未提供 partner 更新接口，前端先本地更新保持体验一致
      return Promise.resolve();
    },
    remove: async (item) => {
      await request.delete(`/partners/${item.id}`);
    },
  };

  return (
    <SimpleCrudPage 
      title="合作客户名录" 
      data={customers || []} 
      setData={setCustomers} 
      fields={formFields} 
      displayColumns={[
        {key:'name', label:'客户/企业名称'}, {key:'contact', label:'主要联系人'}, 
        {key:'phone', label:'联系电话'}, {key:'level', label:'客户等级'}, 
        {key:'status', label:'状态'}
      ]} 
      defaultValues={{ status: '启用', level: '普通客户' }} 
      persist={customerPersist}
    />
  );
};

// ==========================================
// 3. 供应商管理
// ==========================================
export const SuppliersPage = () => {
  const { suppliers, setSuppliers } = useContext(AppContext);
  const formFields = [
    { name: 'name', label: '供应商名称' }, 
    { name: 'contact', label: '业务对接人' }, 
    { name: 'phone', label: '联系电话' }, 
    { name: 'bankAccount', label: '收款银行账号' },
    { name: 'status', label: '合作状态', type: 'select', options: ['启用', '禁用'] }
  ];
  const supplierPersist = {
    create: async (formData) => {
      const code = `SUP${Date.now()}`;
      const resp = await request.post('/partners', {
        partner_code: code,
        partner_name: formData.name,
        partner_type: 'SUPPLIER',
        contact_person: formData.contact,
        contact_phone: formData.phone,
      });
      return { id: resp?.data?.id, ...formData };
    },
    update: async () => Promise.resolve(),
    remove: async (item) => {
      await request.delete(`/partners/${item.id}`);
    },
  };

  return (
    <SimpleCrudPage 
      title="供应商名录" 
      data={suppliers || []} 
      setData={setSuppliers} 
      fields={formFields} 
      displayColumns={[
        {key:'name', label:'供应商名称'}, {key:'contact', label:'业务对接人'}, 
        {key:'phone', label:'联系电话'}, {key:'status', label:'状态'}
      ]} 
      defaultValues={{ status: '启用' }} 
      persist={supplierPersist}
    />
  );
};

// ==========================================
// 4. 仓库管理 (新增模块)
// ==========================================
export const WarehousesPage = () => {
  const { warehouses, setWarehouses } = useContext(AppContext);
  const formFields = [
    { name: 'code', label: '仓库编号' },
    { name: 'name', label: '仓库名称' }, 
    { name: 'manager', label: '仓库主管' }, 
    { name: 'location', label: '所在位置/地址' },
    { name: 'type', label: '仓库类型', type: 'select', options: ['中心主仓', '中转前置仓', '退货残次仓', '保税冷链仓'] },
    { name: 'status', label: '运营状态', type: 'select', options: ['正常运营', '停用维护'] }
  ];

  const warehousePersist = {
    create: async (formData) => {
      const resp = await request.post('/warehouses', {
        warehouse_code: formData.code,
        warehouse_name: formData.name,
        location: formData.location,
      });
      return { id: resp?.data?.id, ...formData };
    },
    update: async (oldItem, formData) => {
      await request.put(`/warehouses/${oldItem.id}`, {
        warehouse_name: formData.name,
        location: formData.location,
        status: formData.status === '停用维护' ? 0 : 1,
      });
    },
  };

  return (
    <SimpleCrudPage 
      title="仓库配置" 
      data={warehouses || []} 
      setData={setWarehouses} 
      fields={formFields} 
      displayColumns={[
        {key:'code', label:'编号'}, {key:'name', label:'仓库名称'}, 
        {key:'type', label:'类型'}, {key:'manager', label:'主管'}, 
        {key:'status', label:'状态'}
      ]} 
      defaultValues={{ status: '正常运营', type: '中心主仓' }} 
      persist={warehousePersist}
    />
  );
};