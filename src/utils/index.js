export const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

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
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${getLocalDate()}.csv`;
  document.body.appendChild(link);
  link.click();
};