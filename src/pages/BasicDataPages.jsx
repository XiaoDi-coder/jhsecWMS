import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { SimpleCrudPage } from './SimpleCrudPage';

export const ProductsPage = () => {
  const { products, setProducts, systemDict } = useContext(AppContext);
  const formFields = [
    { name: 'code', label: '编码' }, { name: 'name', label: '名称' }, { name: 'spec', label: '规格' }, 
    { name: 'category', label: '分类', type: 'select', options: systemDict.categories }, 
    { name: 'unit', label: '单位', type: 'select', options: systemDict.units }, 
    { name: 'price', label: '指导价' }, { name: 'status', label: '状态', type: 'select', options: ['上架', '下架'] }
  ];
  return <SimpleCrudPage title="商品管理" data={products} setData={setProducts} fields={formFields} displayColumns={[{key:'code',label:'编码'},{key:'name',label:'名称'},{key:'category',label:'分类'},{key:'price',label:'指导价'}]} defaultValues={{ status: '上架', unit: systemDict.units[0], category: systemDict.categories[0] }} />;
};

export const CustomersPage = () => {
  const { customers, setCustomers } = useContext(AppContext);
  const formFields = [{name:'name',label:'名称'}, {name:'contact',label:'联系人'}, {name:'phone',label:'联系方式'}, { name: 'status', label: '状态', type: 'select', options: ['启用', '禁用'] }];
  return <SimpleCrudPage title="客户管理" data={customers} setData={setCustomers} fields={formFields} displayColumns={[{key:'name',label:'名称'},{key:'contact',label:'联系人'},{key:'phone',label:'联系方式'},{key:'status',label:'状态'}]} defaultValues={{ status: '启用' }} />;
};

export const SuppliersPage = () => {
  const { suppliers, setSuppliers } = useContext(AppContext);
  const formFields = [{name:'name',label:'名称'}, {name:'contact',label:'联系人'}, {name:'phone',label:'联系方式'}, { name: 'status', label: '状态', type: 'select', options: ['启用', '禁用'] }];
  return <SimpleCrudPage title="供应商管理" data={suppliers} setData={setSuppliers} fields={formFields} displayColumns={[{key:'name',label:'名称'},{key:'contact',label:'联系人'},{key:'phone',label:'联系方式'},{key:'status',label:'状态'}]} defaultValues={{ status: '启用' }} />;
};