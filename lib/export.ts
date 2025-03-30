// This file contains utility functions for exporting financial data
import { Period } from '@/app/components/dashboard/PeriodSelector';
import { formatCurrency } from '@/lib/utils';

interface ExportData {
  revenue: {
    planned: number;
    actual: number;
    previousYear?: number;
    categories: {
      code: string;
      name: string;
      planned: number;
      actual: number;
      previousYear?: number;
      subcategories?: {
        code: string;
        name: string;
        planned: number;
        actual: number;
        previousYear?: number;
      }[];
    }[];
  };
  expenses: {
    planned: number;
    actual: number;
    previousYear?: number;
    categories: {
      code: string;
      name: string;
      planned: number;
      actual: number;
      previousYear?: number;
      subcategories?: {
        code: string;
        name: string;
        planned: number;
        actual: number;
        previousYear?: number;
      }[];
    }[];
  };
}

// Helper function to get period display text
function getPeriodDisplay(period: Period, year: number, month: number): string {
  const months = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  switch (period) {
    case 'month':
      return `${months[month - 1]} ${year}`;
    case 'quarter':
      const quarter = Math.ceil(month / 3);
      return `Q${quarter} ${year}`;
    case 'half-year':
      const half = Math.ceil(month / 6);
      return `H${half} ${year}`;
    case 'year':
      return `${year}`;
  }
}

// Export to Excel format
export async function exportToExcel(
  data: ExportData, 
  fileName: string,
  period: Period,
  year: number,
  month: number
): Promise<void> {
  try {
    // Dynamically import the xlsx library
    const XLSX = await import('xlsx');
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create sheets for revenue and expenses
    const revenueSheet = createRevenueSheet(data, period, year, month);
    const expensesSheet = createExpensesSheet(data, period, year, month);
    const summarySheet = createSummarySheet(data, period, year, month);
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Omzet');
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Uitgaven');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Samenvatting');
    
    // Export workbook
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Er is een fout opgetreden bij het exporteren naar Excel.');
  }
}

// Create revenue sheet
function createRevenueSheet(
  data: ExportData, 
  period: Period,
  year: number,
  month: number
): any {
  // Dynamically import the xlsx library
  const XLSX = require('xlsx');
  
  // Prepare header row
  const header = ['Code', 'Naam', 'Begroot', 'Werkelijk', 'Verschil', 'Verschil %'];
  
  // Prepare data rows
  const rows: any[][] = [];
  
  // Add title row
  rows.push([`Omzet Overzicht - ${getPeriodDisplay(period, year, month)}`]);
  rows.push([]);
  rows.push(header);
  
  // Add data rows
  data.revenue.categories.forEach(category => {
    // Add category row
    const variance = category.actual - category.planned;
    const variancePercent = category.planned !== 0 
      ? (variance / Math.abs(category.planned)) * 100
      : 0;
    
    rows.push([
      category.code,
      category.name,
      category.planned,
      category.actual,
      variance,
      variancePercent.toFixed(1) + '%'
    ]);
    
    // Add subcategories if available
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(sub => {
        const subVariance = sub.actual - sub.planned;
        const subVariancePercent = sub.planned !== 0 
          ? (subVariance / Math.abs(sub.planned)) * 100
          : 0;
        
        rows.push([
          sub.code,
          `  ${sub.name}`,
          sub.planned,
          sub.actual,
          subVariance,
          subVariancePercent.toFixed(1) + '%'
        ]);
      });
    }
  });
  
  // Add total row
  rows.push([]);
  rows.push([
    '',
    'Totaal',
    data.revenue.planned,
    data.revenue.actual,
    data.revenue.actual - data.revenue.planned,
    data.revenue.planned !== 0 
      ? (((data.revenue.actual - data.revenue.planned) / Math.abs(data.revenue.planned)) * 100).toFixed(1) + '%'
      : '0.0%'
  ]);
  
  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  ws['!cols'] = [
    { width: 10 },  // Code
    { width: 30 },  // Name
    { width: 15 },  // Planned
    { width: 15 },  // Actual
    { width: 15 },  // Variance
    { width: 15 }   // Variance %
  ];
  
  return ws;
}

// Create expenses sheet
function createExpensesSheet(
  data: ExportData, 
  period: Period,
  year: number,
  month: number
): any {
  // Dynamically import the xlsx library
  const XLSX = require('xlsx');
  
  // Prepare header row
  const header = ['Code', 'Naam', 'Begroot', 'Werkelijk', 'Verschil', 'Verschil %'];
  
  // Prepare data rows
  const rows: any[][] = [];
  
  // Add title row
  rows.push([`Uitgaven Overzicht - ${getPeriodDisplay(period, year, month)}`]);
  rows.push([]);
  rows.push(header);
  
  // Add data rows
  data.expenses.categories.forEach(category => {
    // Add category row
    const variance = category.actual - category.planned;
    const variancePercent = category.planned !== 0 
      ? (variance / Math.abs(category.planned)) * 100
      : 0;
    
    rows.push([
      category.code,
      category.name,
      category.planned,
      category.actual,
      variance,
      variancePercent.toFixed(1) + '%'
    ]);
    
    // Add subcategories if available
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(sub => {
        const subVariance = sub.actual - sub.planned;
        const subVariancePercent = sub.planned !== 0 
          ? (subVariance / Math.abs(sub.planned)) * 100
          : 0;
        
        rows.push([
          sub.code,
          `  ${sub.name}`,
          sub.planned,
          sub.actual,
          subVariance,
          subVariancePercent.toFixed(1) + '%'
        ]);
      });
    }
  });
  
  // Add total row
  rows.push([]);
  rows.push([
    '',
    'Totaal',
    data.expenses.planned,
    data.expenses.actual,
    data.expenses.actual - data.expenses.planned,
    data.expenses.planned !== 0 
      ? (((data.expenses.actual - data.expenses.planned) / Math.abs(data.expenses.planned)) * 100).toFixed(1) + '%'
      : '0.0%'
  ]);
  
  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  ws['!cols'] = [
    { width: 10 },  // Code
    { width: 30 },  // Name
    { width: 15 },  // Planned
    { width: 15 },  // Actual
    { width: 15 },  // Variance
    { width: 15 }   // Variance %
  ];
  
  return ws;
}

// Create summary sheet
function createSummarySheet(
  data: ExportData, 
  period: Period,
  year: number,
  month: number
): any {
  // Dynamically import the xlsx library
  const XLSX = require('xlsx');
  
  // Calculate totals
  const profit = {
    planned: data.revenue.planned - data.expenses.planned,
    actual: data.revenue.actual - data.expenses.actual
  };
  
  const margin = {
    planned: data.revenue.planned !== 0 ? (profit.planned / data.revenue.planned) * 100 : 0,
    actual: data.revenue.actual !== 0 ? (profit.actual / data.revenue.actual) * 100 : 0
  };
  
  // Prepare data rows
  const rows: any[][] = [];
  
  // Add title row
  rows.push([`Financiële Samenvatting - ${getPeriodDisplay(period, year, month)}`]);
  rows.push([]);
  
  // Add KPI sections
  rows.push(['Kerncijfers', 'Begroot', 'Werkelijk', 'Verschil', 'Verschil %']);
  
  // Revenue row
  const revenueVariance = data.revenue.actual - data.revenue.planned;
  const revenueVariancePercent = data.revenue.planned !== 0 
    ? (revenueVariance / Math.abs(data.revenue.planned)) * 100
    : 0;
  
  rows.push([
    'Omzet',
    data.revenue.planned,
    data.revenue.actual,
    revenueVariance,
    revenueVariancePercent.toFixed(1) + '%'
  ]);
  
  // Expenses row
  const expensesVariance = data.expenses.actual - data.expenses.planned;
  const expensesVariancePercent = data.expenses.planned !== 0 
    ? (expensesVariance / Math.abs(data.expenses.planned)) * 100
    : 0;
  
  rows.push([
    'Uitgaven',
    data.expenses.planned,
    data.expenses.actual,
    expensesVariance,
    expensesVariancePercent.toFixed(1) + '%'
  ]);
  
  // Profit row
  const profitVariance = profit.actual - profit.planned;
  const profitVariancePercent = profit.planned !== 0 
    ? (profitVariance / Math.abs(profit.planned)) * 100
    : 0;
  
  rows.push([
    'Resultaat',
    profit.planned,
    profit.actual,
    profitVariance,
    profitVariancePercent.toFixed(1) + '%'
  ]);
  
  // Margin row
  const marginVariance = margin.actual - margin.planned;
  
  rows.push([
    'Marge',
    margin.planned.toFixed(1) + '%',
    margin.actual.toFixed(1) + '%',
    marginVariance.toFixed(1) + '%',
    ''
  ]);
  
  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  ws['!cols'] = [
    { width: 20 },  // KPI name
    { width: 15 },  // Planned
    { width: 15 },  // Actual
    { width: 15 },  // Variance
    { width: 15 }   // Variance %
  ];
  
  return ws;
}

// Export to PDF format
export async function exportToPDF(
  data: ExportData, 
  fileName: string,
  period: Period,
  year: number,
  month: number
): Promise<void> {
  try {
    // Dynamically import the pdfmake library and fonts
    const pdfMake = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    pdfMake.default.vfs = pdfFonts.default.pdfMake.vfs;
    
    // Create document definition
    const docDefinition = createPdfDocDefinition(data, period, year, month);
    
    // Generate and download PDF
    pdfMake.default.createPdf(docDefinition).download(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('Er is een fout opgetreden bij het exporteren naar PDF.');
  }
}

// Create PDF document definition
function createPdfDocDefinition(
  data: ExportData, 
  period: Period,
  year: number,
  month: number
): any {
  // Calculate totals
  const profit = {
    planned: data.revenue.planned - data.expenses.planned,
    actual: data.revenue.actual - data.expenses.actual
  };
  
  const margin = {
    planned: data.revenue.planned !== 0 ? (profit.planned / data.revenue.planned) * 100 : 0,
    actual: data.revenue.actual !== 0 ? (profit.actual / data.revenue.actual) * 100 : 0
  };
  
  // Helper for variance styling
  const getVarianceStyle = (actual: number, planned: number, inverseColors = false) => {
    const variance = actual - planned;
    if (Math.abs(variance) < 0.01) return {};
    
    if (inverseColors) {
      // For expenses, lower than planned is good
      return { color: variance < 0 ? '#16a34a' : '#dc2626' };
    }
    
    // For revenue, higher than planned is good
    return { color: variance > 0 ? '#16a34a' : '#dc2626' };
  };
  
  // Document definition
  return {
    content: [
      // Title
      { 
        text: `FlowQi Financieel Overzicht - ${getPeriodDisplay(period, year, month)}`,
        style: 'header',
        margin: [0, 0, 0, 20]
      },
      
      // Summary section
      {
        text: 'Financiële Samenvatting',
        style: 'subheader',
        margin: [0, 10, 0, 5]
      },
      
      // KPI table
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Kerncijfers', style: 'tableHeader' },
              { text: 'Begroot', style: 'tableHeader', alignment: 'right' },
              { text: 'Werkelijk', style: 'tableHeader', alignment: 'right' },
              { text: 'Verschil', style: 'tableHeader', alignment: 'right' },
              { text: 'Verschil %', style: 'tableHeader', alignment: 'right' }
            ],
            [
              'Omzet',
              { text: formatCurrency(data.revenue.planned), alignment: 'right' },
              { text: formatCurrency(data.revenue.actual), alignment: 'right' },
              { 
                text: formatCurrency(data.revenue.actual - data.revenue.planned), 
                alignment: 'right',
                ...getVarianceStyle(data.revenue.actual, data.revenue.planned)
              },
              { 
                text: data.revenue.planned !== 0 
                  ? ((data.revenue.actual - data.revenue.planned) / Math.abs(data.revenue.planned) * 100).toFixed(1) + '%'
                  : '0.0%', 
                alignment: 'right',
                ...getVarianceStyle(data.revenue.actual, data.revenue.planned)
              }
            ],
            [
              'Uitgaven',
              { text: formatCurrency(data.expenses.planned), alignment: 'right' },
              { text: formatCurrency(data.expenses.actual), alignment: 'right' },
              { 
                text: formatCurrency(data.expenses.actual - data.expenses.planned), 
                alignment: 'right',
                ...getVarianceStyle(data.expenses.actual, data.expenses.planned, true)
              },
              { 
                text: data.expenses.planned !== 0 
                  ? ((data.expenses.actual - data.expenses.planned) / Math.abs(data.expenses.planned) * 100).toFixed(1) + '%'
                  : '0.0%', 
                alignment: 'right',
                ...getVarianceStyle(data.expenses.actual, data.expenses.planned, true)
              }
            ],
            [
              'Resultaat',
              { text: formatCurrency(profit.planned), alignment: 'right' },
              { text: formatCurrency(profit.actual), alignment: 'right' },
              { 
                text: formatCurrency(profit.actual - profit.planned), 
                alignment: 'right',
                ...getVarianceStyle(profit.actual, profit.planned)
              },
              { 
                text: profit.planned !== 0 
                  ? ((profit.actual - profit.planned) / Math.abs(profit.planned) * 100).toFixed(1) + '%'
                  : '0.0%', 
                alignment: 'right',
                ...getVarianceStyle(profit.actual, profit.planned)
              }
            ],
            [
              'Marge',
              { text: margin.planned.toFixed(1) + '%', alignment: 'right' },
              { text: margin.actual.toFixed(1) + '%', alignment: 'right' },
              { 
                text: (margin.actual - margin.planned).toFixed(1) + '%', 
                alignment: 'right',
                ...getVarianceStyle(margin.actual, margin.planned)
              },
              { text: '', alignment: 'right' }
            ]
          ]
        },
        margin: [0, 0, 0, 20]
      },
      
      // Revenue section
      {
        text: 'Omzet Overzicht',
        style: 'subheader',
        margin: [0, 10, 0, 5]
      },
      
      createPdfCategoryTable(data.revenue.categories, data.revenue.planned, data.revenue.actual, false),
      
      // Expenses section
      {
        text: 'Uitgaven Overzicht',
        style: 'subheader',
        pageBreak: 'before',
        margin: [0, 10, 0, 5]
      },
      
      createPdfCategoryTable(data.expenses.categories, data.expenses.planned, data.expenses.actual, true)
    ],
    
    // Styles
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#333333'
      },
      subheader: {
        fontSize: 14,
        bold: true,
        color: '#666666'
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: '#333333'
      }
    },
    
    // Default style
    defaultStyle: {
      fontSize: 10
    }
  };
}

// Create PDF table for categories
function createPdfCategoryTable(
  categories: any[],
  totalPlanned: number,
  totalActual: number,
  inverseColors: boolean
): any {
  // Prepare table body
  const tableBody: any[][] = [
    [
      { text: 'Code', style: 'tableHeader' },
      { text: 'Naam', style: 'tableHeader' },
      { text: 'Begroot', style: 'tableHeader', alignment: 'right' },
      { text: 'Werkelijk', style: 'tableHeader', alignment: 'right' },
      { text: 'Verschil', style: 'tableHeader', alignment: 'right' },
      { text: 'Verschil %', style: 'tableHeader', alignment: 'right' }
    ]
  ];
  
  // Helper for variance styling
  const getVarianceStyle = (actual: number, planned: number) => {
    const variance = actual - planned;
    if (Math.abs(variance) < 0.01) return {};
    
    if (inverseColors) {
      // For expenses, lower than planned is good
      return { color: variance < 0 ? '#16a34a' : '#dc2626' };
    }
    
    // For revenue, higher than planned is good
    return { color: variance > 0 ? '#16a34a' : '#dc2626' };
  };
  
  // Add categories
  categories.forEach(category => {
    // Add category row
    const variance = category.actual - category.planned;
    const variancePercent = category.planned !== 0 
      ? (variance / Math.abs(category.planned)) * 100
      : 0;
    
    tableBody.push([
      { text: category.code, bold: true },
      { text: category.name, bold: true },
      { text: formatCurrency(category.planned), alignment: 'right', bold: true },
      { text: formatCurrency(category.actual), alignment: 'right', bold: true },
      { 
        text: formatCurrency(variance), 
        alignment: 'right',
        bold: true,
        ...getVarianceStyle(category.actual, category.planned)
      },
      { 
        text: variancePercent.toFixed(1) + '%', 
        alignment: 'right',
        bold: true,
        ...getVarianceStyle(category.actual, category.planned)
      }
    ]);
    
    // Add subcategories if available
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach((sub: any) => {
        const subVariance = sub.actual - sub.planned;
        const subVariancePercent = sub.planned !== 0 
          ? (subVariance / Math.abs(sub.planned)) * 100
          : 0;
        
        tableBody.push([
          { text: sub.code },
          { text: `  ${sub.name}` },
          { text: formatCurrency(sub.planned), alignment: 'right' },
          { text: formatCurrency(sub.actual), alignment: 'right' },
          { 
            text: formatCurrency(subVariance), 
            alignment: 'right',
            ...getVarianceStyle(sub.actual, sub.planned)
          },
          { 
            text: subVariancePercent.toFixed(1) + '%', 
            alignment: 'right',
            ...getVarianceStyle(sub.actual, sub.planned)
          }
        ]);
      });
    }
  });
  
  // Add total row
  const totalVariance = totalActual - totalPlanned;
  const totalVariancePercent = totalPlanned !== 0 
    ? (totalVariance / Math.abs(totalPlanned)) * 100
    : 0;
  
  tableBody.push([
    { text: '', bold: true },
    { text: 'Totaal', bold: true },
    { text: formatCurrency(totalPlanned), alignment: 'right', bold: true },
    { text: formatCurrency(totalActual), alignment: 'right', bold: true },
    { 
      text: formatCurrency(totalVariance), 
      alignment: 'right',
      bold: true,
      ...getVarianceStyle(totalActual, totalPlanned)
    },
    { 
      text: totalVariancePercent.toFixed(1) + '%', 
      alignment: 'right',
      bold: true,
      ...getVarianceStyle(totalActual, totalPlanned)
    }
  ]);
  
  // Create table
  return {
    table: {
      headerRows: 1,
      widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
      body: tableBody
    }
  };
} 