import { useState, useContext } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { Badge } from '../components/common';
import myLogo from '../assets/logo.png';

export const LoginPage = () => {
  const { users, setIsAuthenticated, setCurrentUser, addLog } = useContext(AppContext);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.status === '禁用') return setError('该账号已被禁用，请联系管理员！');
      setCurrentUser(user);
      setIsAuthenticated(true);
      addLog('安全网关', '用户登录', `用户 ${user.realName} 成功登录系统`);
    } else {
      setError('用户名或密码错误！');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <img src={myLogo} alt="Logo" className="w-20 h-20 object-contain mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">金华保安 WMS</h1>
          <p className="text-slate-500 mt-1 text-sm">仓销管理系统</p>
        </div>
        {error && <div className="bg-rose-50 text-rose-500 p-3 rounded-xl text-sm mb-6 text-center font-medium border border-rose-100">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div><label className="block text-sm font-medium mb-2 text-slate-700">账号</label><input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" required/></div>
          <div><label className="block text-sm font-medium mb-2 text-slate-700">密码</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all" required/></div>
          <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 mt-2">安全登录</button>
        </form>
      </div>
    </div>
  );
};

export const OrderDetailPage = () => {
  const { currentDetail, setActiveTab } = useContext(AppContext);
  if (!currentDetail || !currentDetail.data) return null;
  const { type, data } = currentDetail;
  const isSales = type === 'sales';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-8 min-h-full border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActiveTab(isSales ? 'sales-orders' : (type.includes('in') ? 'stock-in' : (type.includes('out') ? 'stock-out' : 'dashboard')))} className="border border-slate-200 bg-white px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm"><ArrowLeft size={16} /> 返回</button>
        <h2 className="text-xl font-bold text-slate-800">单据详情: {data.orderNo}</h2>
        <Badge text={data.status} />
      </div>
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div><div className="text-sm text-slate-500 mb-1">日期</div><div className="font-bold text-slate-800">{data.date}</div></div>
        {data.warehouse && <div><div className="text-sm text-slate-500 mb-1">相关仓库</div><div className="font-bold text-slate-800">{data.warehouse}</div></div>}
        {(data.customer || data.supplier) && <div><div className="text-sm text-slate-500 mb-1">{data.customer ? '客户' : '供应商'}</div><div className="font-bold text-slate-800">{data.customer || data.supplier}</div></div>}
        <div><div className="text-sm text-slate-500 mb-1">{data.diffAmount ? '差异金额' : '总金额'}</div><div className="font-bold text-rose-600 text-lg">¥{data.totalAmount || data.amount || data.diffAmount}</div></div>
      </div>
      <h3 className="text-sm font-bold flex items-center mb-4"><span className="w-1.5 h-4 bg-blue-500 rounded-full mr-2"></span>商品明细</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm"><table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-4">商品名称</th><th className="p-4">单价</th><th className="p-4">{data.diffAmount ? '实盘数量' : '数量'}</th><th className="p-4">小计</th></tr></thead><tbody>
        {(data.items||[]).map((item, idx) => (
          <tr key={idx} className="border-b"><td className="p-4 font-medium">{item.product}</td><td className="p-4 text-slate-500">¥{item.price}</td><td className="p-4">{item.qty || item.actualQty}</td><td className="p-4 font-bold text-rose-500">¥{(Number(item.qty || item.actualQty) * Number(item.price)).toFixed(2)}</td></tr>
        ))}
      </tbody></table></div>
    </div>
  );
};