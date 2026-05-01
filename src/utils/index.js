export const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

// 获取本地日期（向前偏移 days 天），用于表单默认值/快速筛选，避免时区偏差。
export const getLocalDateNDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

// 生成临时 id：避免在组件渲染阶段直接使用 Date.now/Math.random。
export const createId = () => {
  // 生成整数型 id，便于后续过滤/对比
  return Date.now() + Math.floor(Math.random() * 1000000);
};

// 生成单据号：例如 RK + 时间戳
export const createOrderNo = (prefix) => `${prefix}${Date.now()}`;

export const exportToCSV = (filename, headers, data) => {
  const bom = '\uFEFF'; 
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  const dataRows = data.map(row => {
    return headers.map(h => {
      let val = row[h.key];
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });
  const csvContent = bom + [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `${filename}_${getLocalDate()}.csv`;
  document.body.appendChild(link);
  link.click();
  // 释放对象 URL，避免导出多次后内存持续增长
  URL.revokeObjectURL(url);
  link.remove();
};