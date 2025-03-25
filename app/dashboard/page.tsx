'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import type { Database } from '@/app/lib/database.types';
import Layout from '@/app/components/Layout';

// Define types at the top of the file after the import statements
interface ExpenseItem {
  id: string;
  code: string;
  description: string;
  amount: number;
  month: number;
  year: number;
}

interface RevenueInfo {
  current: number;
  previous: number;
}

interface CategoryData {
  category: string;
  amount: number;
  monthlyAmounts: number[];
  percent?: number;
  change?: number;
  previousAmount?: number;
}

interface CategoryRecord {
  [code: string]: CategoryData;
}

interface PreviousCategoryRecord {
  [code: string]: {
    category: string;
    amount: number;
  };
}

interface MonthlyRevenueData {
  month: string;
  consultancy: number;
  saas: number;
  total: number;
}

interface ConsultancyProject {
  id: string;
  start_date: string;
  end_date: string;
  monthly_value: number;
  rate?: number;
  hours?: number;
}

interface SaasClient {
  id: string;
  start_date: string;
  client_name: string;
  monthly_value: number;
}

export default function ExecutiveDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [yearData, setYearData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    margin: 0
  });
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryTotals, setCategoryTotals] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<number[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [trends, setTrends] = useState({
    revenue: { percent: 0, isUp: true },
    expenses: { percent: 0, isUp: true },
    profit: { percent: 0, isUp: true },
    margin: { percent: 0, isUp: true }
  });

  // Voorkom hydration issues door client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Haal data op wanneer het jaar verandert
  useEffect(() => {
    if (isClient) {
      fetchDashboardData();
    }
  }, [selectedYear, isClient]);

  const fetchRevenueData = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Probeer omzet te halen uit de 'revenue' tabel
      const { data: currentYearRevenue, error: currentError } = await supabase
        .from('revenue')
        .select('*')
        .eq('year', selectedYear);
      
      if (currentError) throw currentError;
      
      const { data: previousYearRevenue, error: previousError } = await supabase
        .from('revenue')
        .select('*')
        .eq('year', selectedYear - 1);
      
      if (previousError) throw previousError;
      
      // Gebruik de gevonden waarden of 0 als fallback
      const currentAmount = currentYearRevenue && currentYearRevenue.length > 0
        ? currentYearRevenue[0].amount
        : 0;
        
      const previousAmount = previousYearRevenue && previousYearRevenue.length > 0
        ? previousYearRevenue[0].amount
        : 0;
      
      console.log('Revenue data fetched:', { current: currentAmount, previous: previousAmount });
      
      return { current: currentAmount, previous: previousAmount };
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return { current: 0, previous: 0 };
    }
  };

  const processExpenseData = (currentYearData: ExpenseItem[], previousYearData: ExpenseItem[], revenueInfo: RevenueInfo) => {
    // Definieer de hoofdcategorieën met hun codes
    const mainCategories = [
      { code: '4000', description: 'Personeelskosten' },
      { code: '4400', description: 'Marketing' },
      { code: '4600', description: 'R&D' },
      { code: '4700', description: 'Kantoorkosten' },
      { code: '4500', description: 'Klantondersteuning' },
      { code: '4800', description: 'Reiskosten' }
    ];

    // Verwerk huidige jaar data
    const currentYearCategories: CategoryRecord = {};
    let currentYearTotalExpenses = 0;

    // Initialiseer de categorieën
    mainCategories.forEach(cat => {
      currentYearCategories[cat.code] = {
        category: cat.description,
        amount: 0,
        monthlyAmounts: Array(12).fill(0)
      };
    });

    // Verwerk alle uitgaven van het huidige jaar
    currentYearData.forEach(expense => {
      // Zoek welke hoofdcategorie deze uitgave behoort
      const categoryCode = expense.code.substring(0, 2) + '00';
      
      // Als we deze categorie kennen, tel het bedrag op
      if (currentYearCategories[categoryCode]) {
        // Uitgaven worden negatief opgeslagen, daarom nemen we de absolute waarde
        const amount = Math.abs(expense.amount);
        currentYearCategories[categoryCode].amount += amount;
        
        // Voeg ook toe aan de maandelijkse uitgaven als er een maand is gespecificeerd
        if (expense.month >= 0 && expense.month < 12) {
          currentYearCategories[categoryCode].monthlyAmounts[expense.month] += amount;
        }
        
        // Tel op bij totale uitgaven
        currentYearTotalExpenses += amount;
      }
    });

    // Verwerk vorig jaar data voor trends
    const previousYearCategories: PreviousCategoryRecord = {};
    let previousYearTotalExpenses = 0;

    // Initialiseer de categorieën voor vorig jaar
    mainCategories.forEach(cat => {
      previousYearCategories[cat.code] = {
        category: cat.description,
        amount: 0
      };
    });

    // Verwerk alle uitgaven van het vorige jaar
    previousYearData.forEach(expense => {
      const categoryCode = expense.code.substring(0, 2) + '00';
      
      if (previousYearCategories[categoryCode]) {
        const amount = Math.abs(expense.amount);
        previousYearCategories[categoryCode].amount += amount;
        previousYearTotalExpenses += amount;
      }
    });

    // Bereken trends en percentages
    const categoriesArray = Object.keys(currentYearCategories).map(code => {
      const currentAmount = currentYearCategories[code].amount;
      const previousAmount = previousYearCategories[code]?.amount || 0;
      
      // Bereken de verandering in percentage
      let changePercent = 0;
      if (previousAmount > 0) {
        changePercent = ((currentAmount - previousAmount) / previousAmount) * 100;
      }
      
      return {
        ...currentYearCategories[code],
        percent: currentYearTotalExpenses > 0 ? (currentAmount / currentYearTotalExpenses) * 100 : 0,
        change: changePercent,
        previousAmount
      };
    });

    // Sorteren op bedrag (hoogste eerst)
    categoriesArray.sort((a, b) => b.amount - a.amount);
    
    // Update state met verwerkte data
    setCategoryTotals(categoriesArray);
    
    // Bereken maandelijkse data voor grafiek
    const monthlyExpenseData = [];
    for (let i = 0; i < 12; i++) {
      let monthTotal = 0;
      Object.values(currentYearCategories).forEach(cat => {
        monthTotal += cat.monthlyAmounts[i];
      });
      monthlyExpenseData.push(monthTotal);
    }
    setMonthlyData(monthlyExpenseData);
    
    // Gebruik de doorgegeven omzetgegevens
    const currentRevenue = monthlyRevenue.reduce((sum, month) => sum + month.consultancy + month.saas, 0);
    const previousRevenue = revenueInfo.previous || currentYearTotalExpenses * 1.5;
    
    console.log('Using revenue values:', { currentRevenue, previousRevenue });
    
    // Bereken winst en marge
    const currentProfit = currentRevenue - currentYearTotalExpenses;
    const previousProfit = previousRevenue - previousYearTotalExpenses;
    
    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
    const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;
    
    // Bereken trends
    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const expensesTrend = previousYearTotalExpenses > 0 ? ((currentYearTotalExpenses - previousYearTotalExpenses) / previousYearTotalExpenses) * 100 : 0;
    const profitTrend = previousProfit > 0 ? ((currentProfit - previousProfit) / previousProfit) * 100 : 0;
    const marginTrend = previousMargin > 0 ? (currentMargin - previousMargin) : 0;
    
    console.log('Calculated trends:', { revenueTrend, expensesTrend, profitTrend, marginTrend });
    
    // Update state met actuele gegevens
    setYearData({
      revenue: currentRevenue,
      expenses: currentYearTotalExpenses,
      profit: currentProfit,
      margin: currentMargin
    });
    
    // Update trends
    setTrends({
      revenue: {
        percent: Math.abs(revenueTrend),
        isUp: revenueTrend >= 0
      },
      expenses: {
        percent: Math.abs(expensesTrend),
        isUp: expensesTrend >= 0
      },
      profit: {
        percent: Math.abs(profitTrend),
        isUp: profitTrend >= 0
      },
      margin: {
        percent: Math.abs(marginTrend),
        isUp: marginTrend >= 0
      }
    });
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Controleer eerst of er een actieve sessie is
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Auth session error:', sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.error('No active session found');
        throw new Error('Auth session missing!');
      }
      
      // Probeer dummy data te gebruiken als geen echte data beschikbaar is
      let currentYearData = [];
      let previousYearData = [];
      
      try {
        // Haal uitgaven op
        const { data: current, error: currentYearError } = await supabase
          .from('expenses')
          .select('*')
          .eq('year', selectedYear);
        
        if (!currentYearError && current) {
          currentYearData = current;
        } else {
          console.warn('Geen uitgaven gevonden voor huidig jaar, gebruik demo data');
          // Gebruik dummy data als er geen echte data is
          currentYearData = getDummyExpenses(selectedYear);
        }

        const { data: previous, error: previousYearError } = await supabase
          .from('expenses')
          .select('*')
          .eq('year', selectedYear - 1);
        
        if (!previousYearError && previous) {
          previousYearData = previous;
        } else {
          console.warn('Geen uitgaven gevonden voor vorig jaar, gebruik demo data');
          // Gebruik dummy data als er geen echte data is
          previousYearData = getDummyExpenses(selectedYear - 1);
        }
      } catch (err) {
        console.error('Error fetching expense data, using fallback data:', err);
        currentYearData = getDummyExpenses(selectedYear);
        previousYearData = getDummyExpenses(selectedYear - 1);
      }

      // Haal omzetgegevens op uit revenue tabel
      const revData = await fetchRevenueData();
      
      // Haal verkoopgegevens op
      const salesRevenue = await fetchSalesData();
      
      // Haal gedetailleerde verkoopgegevens op (nieuw)
      const salesData = await fetchDetailedSalesData();
      setMonthlyRevenue(salesData.monthlyRevenue);
      
      // Als er verkoopgegevens zijn, gebruik die in plaats van de handmatig ingevoerde omzet
      if (salesRevenue > 0) {
        revData.current = salesRevenue;
      }

      // Verwerk de data voor het dashboard
      processExpenseData(currentYearData, previousYearData, revData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetailedSalesData = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Consultancy projecten ophalen
      const { data: consultancyProjects, error: consultancyError } = await supabase
        .from('consultancy_projects')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (consultancyError) throw consultancyError;
        
      // SaaS klanten ophalen
      const { data: saasClients, error: saasError } = await supabase
        .from('saas_clients')
        .select('*')
        .order('client_name', { ascending: true });
      
      if (saasError) throw saasError;
        
      // Maandelijkse inkomsten berekenen
      const monthlyRevenueData = calculateMonthlyRevenue(consultancyProjects, saasClients);
      
      return { consultancyProjects, saasClients, monthlyRevenue: monthlyRevenueData };
    } catch (error) {
      console.error('Error fetching detailed sales data:', error);
      return { consultancyProjects: [], saasClients: [], monthlyRevenue: [] };
    }
  };

  const calculateMonthlyRevenue = (consultancyProjects: ConsultancyProject[], saasClients: SaasClient[]): MonthlyRevenueData[] => {
    const monthlyData = Array(12).fill(0).map((_, i) => ({
      month: new Date(selectedYear, i).toLocaleString('nl-NL', { month: 'long' }),
      consultancy: 0,
      saas: 0,
      total: 0
    }));
    
    // Bereken consultancy-inkomsten per maand
    consultancyProjects.forEach(project => {
      const projectStart = new Date(project.start_date);
      const projectEnd = new Date(project.end_date);
      
      // Bereken maandelijkse waarde met veilige berekening
      const monthlyValue = project.monthly_value || 
        (project.rate && project.hours ? project.rate * project.hours : 0);
      
      for (let month = 0; month < 12; month++) {
        const currentMonthStart = new Date(selectedYear, month, 1);
        const currentMonthEnd = new Date(selectedYear, month + 1, 0);
        
        // Check of project actief is in deze maand
        if (projectStart <= currentMonthEnd && projectEnd >= currentMonthStart) {
          monthlyData[month].consultancy += monthlyValue;
          monthlyData[month].total += monthlyValue;
        }
      }
    });
    
    // Bereken SaaS-inkomsten per maand
    saasClients.forEach(client => {
      const clientStart = new Date(client.start_date);
      
      for (let month = 0; month < 12; month++) {
        const currentMonth = new Date(selectedYear, month, 1);
        
        // Check of client actief is in deze maand
        if (clientStart <= currentMonth) {
          monthlyData[month].saas += client.monthly_value || 0;
          monthlyData[month].total += client.monthly_value || 0;
        }
      }
    });
    
    return monthlyData;
  };

  const fetchSalesData = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Haal verkoopgegevens op uit je 'sales' of 'invoices' tabel
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .gte('due_date', `${selectedYear}-01-01`)
        .lt('due_date', `${selectedYear + 1}-01-01`);
      
      if (salesError) throw salesError;
      
      // Haal abonnementsgegevens op (MRR)
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('active', true);
      
      if (subscriptionError) throw subscriptionError;
      
      // Bereken totale omzet uit verkopen
      let salesRevenue = 0;
      if (salesData && salesData.length > 0) {
        salesRevenue = salesData.reduce((total, sale) => total + (sale.amount || 0), 0);
      }
      
      // Bereken omzet uit abonnementen (MRR * 12 maanden)
      let subscriptionRevenue = 0;
      if (subscriptionData && subscriptionData.length > 0) {
        const mrr = subscriptionData.reduce((total, sub) => total + (sub.monthly_amount || 0), 0);
        subscriptionRevenue = mrr * 12; // Jaarlijkse abonnementsomzet
      }
      
      // Totale omzet berekenen
      const totalRevenue = salesRevenue + subscriptionRevenue;
      
      console.log('Sales revenue:', salesRevenue);
      console.log('Subscription revenue:', subscriptionRevenue);
      console.log('Total revenue:', totalRevenue);
      
      return totalRevenue;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return 0;
    }
  };

  // Hulpfunctie om dummy data te genereren voor demo doeleinden
  const getDummyExpenses = (year: number): ExpenseItem[] => {
    const categories = ['4000', '4400', '4600', '4700', '4500', '4800'];
    const expenses: ExpenseItem[] = [];
    
    categories.forEach(code => {
      for (let month = 0; month < 12; month++) {
        // Genereer een random bedrag tussen 1000 en 10000
        const amount = -(Math.floor(Math.random() * 9000) + 1000);
        
        expenses.push({
          id: `${year}-${code}-${month}`,
          code: code,
          description: `Demo uitgave ${code}`,
          amount: amount,
          month: month,
          year: year
        });
      }
    });
    
    return expenses;
  };

  // Render deel
  if (!isClient) {
    return <Layout><div className="loading">Loading executive dashboard...</div></Layout>;
  }

  return (
    <Layout>
      <div style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        color: '#333'
      }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 8px 0' }}>Financial Dashboard</h1>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Overzicht van belangrijke financiële indicatoren</p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <Link
              href="/expenses"
              style={{
                textDecoration: 'none',
                color: '#2563eb',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Ga naar uitgavenbeheer →
            </Link>
          </div>
        </header>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <p>Data laden...</p>
          </div>
        ) : (
          <>
            {/* KPI Overzicht */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <KpiCard
                title="Omzet"
                value={`€${(yearData.revenue/1000).toFixed(0)}K`}
                trend={`${trends.revenue.percent.toFixed(1)}%`}
                trendUp={trends.revenue.isUp}
              />
              <KpiCard
                title="Uitgaven"
                value={`€${(yearData.expenses/1000).toFixed(0)}K`}
                trend={`${trends.expenses.percent.toFixed(1)}%`}
                trendUp={trends.expenses.isUp}
                trendIsGood={false}
              />
              <KpiCard
                title="Winst"
                value={`€${(yearData.profit/1000).toFixed(0)}K`}
                trend={`${trends.profit.percent.toFixed(1)}%`}
                trendUp={trends.profit.isUp}
              />
              <KpiCard
                title="Marge"
                value={`${yearData.margin.toFixed(1)}%`}
                trend={`${trends.margin.percent.toFixed(1)}%`}
                trendUp={trends.margin.isUp}
              />
            </div>
            
            {/* Gecombineerde Maandelijkse Inkomsten & Uitgaven */}
            <div style={{
              borderRadius: '12px',
              border: '1px solid #eee',
              padding: '24px',
              marginBottom: '32px',
              backgroundColor: 'white'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Maandelijks Financieel Overzicht</h2>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Exporteren
                </button>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>Categorie</th>
                      {['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'].map(month => (
                        <th key={month} style={{ textAlign: 'right', padding: '12px 8px', fontSize: '14px', fontWeight: '500' }}>{month}</th>
                      ))}
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#92400e' }}>Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Inkomsten: Consultancy */}
                    <tr style={{ borderBottom: '1px solid #eee', backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#1e40af' }} colSpan={14}>Inkomsten</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>Consultancy</td>
                      {monthlyRevenue.map((monthData, index) => (
                        <td key={index} style={{ textAlign: 'right', padding: '12px 8px', fontSize: '14px' }}>
                          {new Intl.NumberFormat('nl-NL', {
                            style: 'currency',
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(monthData.consultancy)}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                        {new Intl.NumberFormat('nl-NL', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0
                        }).format(monthlyRevenue.reduce((sum, month) => sum + month.consultancy, 0))}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>SaaS</td>
                      {monthlyRevenue.map((monthData, index) => (
                        <td key={index} style={{ textAlign: 'right', padding: '12px 8px', fontSize: '14px' }}>
                          {new Intl.NumberFormat('nl-NL', {
                            style: 'currency',
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(monthData.saas)}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                        {new Intl.NumberFormat('nl-NL', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0
                        }).format(monthlyRevenue.reduce((sum, month) => sum + month.saas, 0))}
                      </td>
                    </tr>
                    
                    {/* Uitgaven per categorie */}
                    <tr style={{ borderBottom: '1px solid #eee', backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#b91c1c' }} colSpan={14}>Uitgaven</td>
                    </tr>
                    {categoryTotals.map(category => (
                      <tr key={category.category} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{category.category}</td>
                        {category.monthlyAmounts.map((amount, index) => (
                          <td key={index} style={{ textAlign: 'right', padding: '12px 8px', fontSize: '14px' }}>
                            {new Intl.NumberFormat('nl-NL', {
                              style: 'currency',
                              currency: 'EUR',
                              maximumFractionDigits: 0
                            }).format(amount)}
                          </td>
                        ))}
                        <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                          {new Intl.NumberFormat('nl-NL', {
                            style: 'currency',
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(category.amount)}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Totaalregel */}
                    <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>Totaal</td>
                      {['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'].map((_, index) => {
                        // Calculate monthly income total
                        const monthlyIncomeTotal = (monthlyRevenue[index]?.consultancy || 0) +
                                                 (monthlyRevenue[index]?.saas || 0);
                        
                        // Calculate monthly expense total
                        const monthlyExpenseTotal = categoryTotals.reduce((sum, cat) =>
                          sum + (cat.monthlyAmounts[index] || 0), 0);
                        
                        // Calculate monthly total (income - expenses)
                        const monthTotal = monthlyIncomeTotal - monthlyExpenseTotal;
                        
                        return (
                          <td key={index} style={{ textAlign: 'right', padding: '12px 8px', fontSize: '14px', fontWeight: '600' }}>
                            {new Intl.NumberFormat('nl-NL', {
                              style: 'currency',
                              currency: 'EUR',
                              maximumFractionDigits: 0
                            }).format(monthTotal)}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                        {new Intl.NumberFormat('nl-NL', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0
                        }).format(
                          // Total yearly income
                          monthlyRevenue.reduce((sum, month) => sum + month.total, 0) -
                          // Total yearly expenses
                          categoryTotals.reduce((sum, cat) => sum + cat.amount, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

// Herbruikbare componenten
interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  trendIsGood?: boolean;
}

const KpiCard = ({
  title,
  value,
  trend,
  trendUp,
  trendIsGood = true
}: KpiCardProps) => {
  const trendColor = trendUp === trendIsGood ? '#10b981' : '#ef4444';
  
  return (
    <div style={{
      padding: '24px',
      borderRadius: '12px',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
    }}>
      <h3 style={{
        fontSize: '14px',
        color: '#6b7280',
        margin: '0 0 8px 0',
        fontWeight: '500'
      }}>
        {title}
      </h3>
      <div style={{
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '16px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '14px',
        color: trendColor
      }}>
        {trendUp ? '↑' : '↓'} {trend} t.o.v. vorig jaar
      </div>
    </div>
  );
};