"use client";

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registreer de Chart.js componenten
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProductPerformance {
  product_id: string;
  product_name: string;
  product_type: string;
  unit: string;
  planned_quantity: number;
  planned_revenue: number;
  actual_quantity: number;
  actual_revenue: number;
  achievement_percentage: number;
}

interface TrendDataPoint {
  period: string;
  data: ProductPerformance[];
}

interface BudgetEntry {
  id: string;
  product_id: string;
  amount: number;
  quantity: number;
  period: string;
}

interface ActualEntry {
  id: string;
  product_id: string;
  amount: number;
  quantity: number;
  period: string;
}

const invalidNames = ["Omzet", "Omzet Consultancy", "SaaS"];

export default function ProductDashboard() {
  const [loading, setLoading] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<ProductPerformance[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showRevenueLink, setShowRevenueLink] = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // Format: YYYY-MM

  // Helper function to filter out invalid products
  const isValidProduct = (product: any): boolean => {
    // Check both name and product_name properties
    const productName = product.name || product.product_name || '';
    return !invalidNames.includes(productName);
  };

  // Add a useEffect hook to directly hide unwanted products in the DOM
  useEffect(() => {
    // This function will directly hide the unwanted products in the DOM
    function removeUnwantedProducts() {
      // For debugging - log all first cells to see what we're working with
      console.log("All product cells:");
      document.querySelectorAll('tr td:first-child').forEach(cell => {
        console.log(cell.textContent.trim());
      });
      
      // Find all table rows
      const tableRows = document.querySelectorAll('tr');
      
      // Check each row
      tableRows.forEach(row => {
        // Get the first cell (product name)
        const firstCell = row.cells?.[0];
        
        // If the cell content is one of our unwanted products, hide the row
        if (firstCell) {
          const text = firstCell.textContent?.trim() || '';
          if (invalidNames.includes(text)) {
            console.log(`Hiding row with product: ${text}`);
            row.style.display = 'none';
          }
        }
      });
    }
    
    // Run once on load
    removeUnwantedProducts();
    
    // Set up a mutation observer to catch dynamically loaded content
    const observer = new MutationObserver(mutations => {
      removeUnwantedProducts();
    });
    
    // Start observing the document body
    observer.observe(document.body, { 
      childList: true,
      subtree: true 
    });
    
    // Clean up
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Haal product performance data op
      const success = await fetchProductPerformance();
      if (!success) {
        throw new Error('Failed to fetch product performance data');
      }
      
      // Haal trend data op
      await loadTrendData();
      
    } catch (error) {
      console.error('Error in loadData:', error);
      setError('Er is een fout opgetreden bij het laden van de gegevens.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async () => {
    try {
      setLoadingTrends(true);
      setError(null);
      
      // Initialize Supabase client
      const supabase = getBrowserSupabaseClient();
      
      // Get the last 12 months
      const now = new Date();
      const trendData = [];
      
      // Fetch all products once
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }
      
      // Filter out unwanted products in JavaScript
      const filteredProducts = (productsData || []).filter(product => 
        product.name !== 'Omzet' && 
        product.name !== 'Omzet Consultancy' &&
        product.name !== 'SaaS'
      );
      
      // Process each month
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const period = date.toISOString().slice(0, 7); // YYYY-MM format
        const [year, month] = period.split('-').map(Number);
        
        try {
          // Get budget entries for this month
          const { data: budgetData, error: budgetError } = await supabase
            .from('budget_entries')
            .select('*')
            .eq('type', 'revenue')
            .eq('year', year)
            .eq('month', month);
            
          if (budgetError) {
            console.error(`Error fetching budget entries for ${period}:`, budgetError);
            // Continue with next period
            continue;
          }
          
          // Get actual entries for this month
          const { data: actualData, error: actualError } = await supabase
            .from('actual_entries')
            .select('*')
            .eq('type', 'revenue')
            .eq('year', year)
            .eq('month', month);
            
          if (actualError) {
            console.error(`Error fetching actual entries for ${period}:`, actualError);
            // Continue with next period
            continue;
          }
          
          // Process the data for this month
          const monthData = filteredProducts.map(product => {
            // Find budget entries for this product
            const productBudget = budgetData.filter(entry => 
              entry.product_id === product.id
            );
            
            // Find actual entries for this product
            const productActual = actualData.filter(entry => 
              entry.product_id === product.id
            );
            
            // Calculate totals
            const plannedRevenue = productBudget.reduce((sum, entry) => 
              sum + parseFloat(entry.amount || 0), 0
            );
            
            const actualRevenue = productActual.reduce((sum, entry) => 
              sum + parseFloat(entry.amount || 0), 0
            );
            
            // Create performance object
            return {
              product_id: product.id,
              product_name: product.name,
              product_type: product.type,
              unit: product.type?.toLowerCase().includes('consultancy') ? 'uren' : 'gebruikers',
              planned_quantity: productBudget.reduce((sum, entry) => 
                sum + (entry.number_of_users || 0), 0
              ),
              actual_quantity: productActual.reduce((sum, entry) => 
                sum + (entry.number_of_users || 0), 0
              ),
              planned_revenue: plannedRevenue,
              actual_revenue: actualRevenue,
              achievement_percentage: plannedRevenue > 0 ? 
                (actualRevenue / plannedRevenue) * 100 : 0
            };
          });
          
          trendData.push({
            period,
            data: monthData
          });
        } catch (periodError) {
          console.error(`Error processing period ${period}:`, periodError);
          // Continue with next period
          continue;
        }
      }
      
      console.log('Retrieved trend data:', trendData);
      setTrendData(trendData);
      
    } catch (error) {
      console.error('Error in loadTrendData:', error);
      setError('Er is een fout opgetreden bij het ophalen van de trendgegevens.');
      setTrendData([]);
    } finally {
      setLoadingTrends(false);
    }
  };

  const fetchProductPerformance = async (): Promise<{ success: boolean; error?: unknown }> => {
    try {
      setLoading(true);
      setError(null);

      // Initialize Supabase client
      const supabase = getBrowserSupabaseClient();

      // Determine date range based on timeframe
      const now = new Date();
      let year, month;
      
      switch (timeframe) {
        case 'month':
          year = now.getFullYear();
          month = now.getMonth() + 1;
          break;
        case 'quarter':
          year = now.getFullYear();
          month = Math.floor(now.getMonth() / 3) * 3 + 1;
          break;
        case 'year':
          year = now.getFullYear();
          month = 1;
          break;
        default:
          year = now.getFullYear();
          month = now.getMonth() + 1;
      }

      console.log('Fetching product performance for period:', {
        timeframe,
        year,
        month
      });

      // Skip the RPC call and use direct table queries instead
      
      // Fetch products - using the correct syntax for filtering
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }
      
      // Filter out unwanted products in JavaScript
      const filteredProducts = (productsData || []).filter(product => 
        product.name !== 'Omzet' && 
        product.name !== 'Omzet Consultancy' &&
        product.name !== 'SaaS'
      );
      
      // Get budget entries for these products
      const { data: budgetData, error: budgetError } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('type', 'revenue')
        .eq('year', year);
        
      if (budgetError) {
        console.error('Error fetching budget entries:', budgetError);
        throw new Error(`Failed to fetch budget entries: ${budgetError.message}`);
      }
      
      // Get actual entries for these products
      const { data: actualData, error: actualError } = await supabase
        .from('actual_entries')
        .select('*')
        .eq('type', 'revenue')
        .eq('year', year);
        
      if (actualError) {
        console.error('Error fetching actual entries:', actualError);
        throw new Error(`Failed to fetch actual entries: ${actualError.message}`);
      }
      
      // Process the data
      const performanceData = filteredProducts.map(product => {
        // Find all budget entries for this product
        const productBudget = budgetData.filter(entry => 
          entry.product_id === product.id
        );
        
        // Find all actual entries for this product
        const productActual = actualData.filter(entry => 
          entry.product_id === product.id
        );
        
        // Calculate totals
        const plannedRevenue = productBudget.reduce((sum, entry) => 
          sum + parseFloat(entry.amount || 0), 0
        );
        
        const actualRevenue = productActual.reduce((sum, entry) => 
          sum + parseFloat(entry.amount || 0), 0
        );
        
        // Create performance object
        return {
          product_id: product.id,
          product_name: product.name,
          product_type: product.type,
          unit: product.type?.toLowerCase().includes('consultancy') ? 'uren' : 'gebruikers',
          planned_quantity: productBudget.reduce((sum, entry) => 
            sum + (entry.number_of_users || 0), 0
          ),
          actual_quantity: productActual.reduce((sum, entry) => 
            sum + (entry.number_of_users || 0), 0
          ),
          planned_revenue: plannedRevenue,
          actual_revenue: actualRevenue,
          achievement_percentage: plannedRevenue > 0 ? 
            (actualRevenue / plannedRevenue) * 100 : 0
        };
      });
      
      console.log('Processed performance data:', performanceData);
      setPerformanceData(performanceData);
      
      return { success: true };
    } catch (err) {
      console.error("Error in fetchProductPerformance:", err);
      setError("Er is een fout opgetreden bij het ophalen van de productgegevens.");
      setPerformanceData([]);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const handleCheckProductLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      setSyncMessage(null);
      
      const supabase = getBrowserSupabaseClient();
      
      // Haal alle bestaande producten op
      const { data: existingProducts, error: productsError } = await supabase
        .from('products')
        .select('*');
        
      if (productsError) throw productsError;
      
      // Haal alle inkomsten entries op die nog geen product hebben
      const { data: revenueEntries, error: entriesError } = await supabase
        .from('actual_entries')
        .select('*')
        .eq('entry_type', 'revenue')
        .is('product_id', null);
        
      if (entriesError) throw entriesError;
      
      // Haal alle budget entries op die nog geen product hebben
      const { data: budgetEntries, error: budgetError } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('type', 'revenue')
        .is('product_id', null);
        
      if (budgetError) throw budgetError;
      
      // Als er geen entries zijn zonder product, toon een bericht
      if (revenueEntries.length === 0 && budgetEntries.length === 0) {
        setSyncMessage('Alle inkomsten zijn al gekoppeld aan producten.');
        return;
      }
      
      // Toon een bericht over hoeveel entries er zijn zonder product
      setSyncMessage(`${revenueEntries.length} inkomsten en ${budgetEntries.length} budget entries hebben nog geen product.`);
      
      // Herlaad de data na het synchroniseren
      await loadData();
    } catch (err) {
      console.error('Error checking product links:', err);
      setError(`Synchronisatiefout: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Bereken KPIs
  const calculateKPIs = () => {
    if (!performanceData || performanceData.length === 0) {
      return {
        totalActualRevenue: 0,
        totalPlannedRevenue: 0,
        revenueAchievement: 0,
        totalProfit: 0,
        profitMargin: 0,
        totalQuantity: 0,
        averagePrice: 0
      };
    }
    
    // Filter out invalid products
    const filteredPerformanceData = performanceData.filter(product => 
      !invalidNames.includes(product.product_name)
    );
    
    // Bereken totalen
    const totals = filteredPerformanceData.reduce(
      (acc, product) => {
        acc.plannedAmount += product.planned_revenue || 0;
        acc.actualAmount += product.actual_revenue || 0;
        acc.totalQuantity += product.actual_quantity || 0;
        return acc;
      }, 
      { plannedAmount: 0, actualAmount: 0, totalQuantity: 0 }
    );
    
    // Bereken overall realisatiepercentage
    const overallPercentage = totals.plannedAmount > 0 
      ? (totals.actualAmount / totals.plannedAmount * 100) 
      : 0;
    
    // Bereken gemiddelde prijs per eenheid
    const averagePrice = totals.totalQuantity > 0 
      ? (totals.actualAmount / totals.totalQuantity) 
      : 0;
    
    return {
      totalActualRevenue: totals.actualAmount,
      totalPlannedRevenue: totals.plannedAmount,
      revenueAchievement: overallPercentage,
      totalProfit: totals.actualAmount - totals.plannedAmount,
      profitMargin: totals.actualAmount > 0 ? ((totals.actualAmount - totals.plannedAmount) / totals.actualAmount * 100) : 0,
      totalQuantity: totals.totalQuantity,
      averagePrice: averagePrice
    };
  };

  // Format bedragen als valuta
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Format percentages
  const formatPercentage = (percentage: number): string => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percentage / 100);
  };

  const kpis = calculateKPIs();

  // Functie om de trendgrafiek te renderen
  const renderTrendChart = () => {
    if (!trendData || trendData.length === 0) {
      return (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-medium mb-4 text-gray-800">Trendgrafiek</h2>
          <p className="text-gray-600">Geen trendgegevens beschikbaar.</p>
        </div>
      );
    }
    
    // Bereid de gegevens voor voor de grafiek
    const labels = trendData.map(item => {
      const [year, month] = item.period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
    }).reverse();
    
    // Bereken de totale geplande en werkelijke omzet per periode
    const plannedRevenueData = trendData.map(item => {
      return item.data
        .filter(product => 
          !invalidNames.includes(product.product_name)
        )
        .reduce((sum, product) => sum + (product.planned_revenue || 0), 0);
    }).reverse();
    
    const actualRevenueData = trendData.map(item => {
      return item.data
        .filter(product => 
          !invalidNames.includes(product.product_name)
        )
        .reduce((sum, product) => sum + (product.actual_revenue || 0), 0);
    }).reverse();
    
    // Configuratie voor de grafiek
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Omzet Trend (Laatste 12 maanden)',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + value.toLocaleString('nl-NL');
            }
          }
        }
      }
    };
    
    // Gegevens voor de grafiek
    const data = {
      labels,
      datasets: [
        {
          label: 'Geplande Omzet',
          data: plannedRevenueData,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Werkelijke Omzet',
          data: actualRevenueData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    };
    
    return (
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-medium mb-4 text-gray-800">Trendgrafiek</h2>
        <div className="h-80">
          <Line options={options} data={data} />
        </div>
      </div>
    );
  };

  // Maandelijkse Verkoop Prognose component
  const MonthlyForecast = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Maandelijkse Verkoop Prognose</h2>
          <Link 
            href="/forecasts" 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Beheer Prognoses
          </Link>
        </div>
        <p className="text-gray-600 mb-4">
          Bekijk en beheer de maandelijkse verkoopvoorspellingen voor alle producten.
        </p>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-gray-700">
            Klik op "Beheer Prognoses" om naar de prognosepagina te gaan.
          </p>
        </div>
      </div>
    );
  };

  // Strategische Verkoopvoorspelling component
  const StrategicSalesForecast = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Strategische Verkoopvoorspelling</h2>
          <Link 
            href="/forecasts/strategic" 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Beheer Voorspellingen
          </Link>
        </div>
        <p className="text-gray-600 mb-4">
          Gebruik de strategische voorspellingspagina om marketing events en productvoorspellingen te beheren.
        </p>
        <div className="bg-gray-50 p-4 rounded">
          <p className="text-gray-700">
            Klik op "Beheer Voorspellingen" om naar de strategische voorspellingspagina te gaan.
          </p>
        </div>
      </div>
    );
  };

  // Product Performance Overview component
  const ProductPerformanceOverview = () => {
    const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
    const [monthlyProductPlan, setMonthlyProductPlan] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      fetchProductData();
    }, []);
    
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const supabase = getBrowserSupabaseClient();
        
        // Haal producten op
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*');
          
        if (productsError) throw productsError;
        
        // Haal verkopen op voor de laatste 6 maanden
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: actualEntries, error: entriesError } = await supabase
          .from('actual_entries')
          .select('*')
          .eq('entry_type', 'revenue')
          .eq('data_source', 'application')
          .gte('entry_date', sixMonthsAgo.toISOString().split('T')[0]);
          
        if (entriesError) throw entriesError;
        
        // Haal budget/gepland op voor de komende 12 maanden
        const { data: budgetEntries, error: budgetError } = await supabase
          .from('budget_entries')
          .select('*')
          .eq('type', 'revenue')
          .eq('data_source', 'application');
          
        if (budgetError) throw budgetError;
        
        // Verwerk de data
        processProductData(products, actualEntries, budgetEntries);
        
      } catch (error) {
        console.error('Error fetching product data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const processProductData = (products, actualEntries, budgetEntries) => {
      // Filter out invalid products
      const filteredProducts = products.filter(product => 
        !invalidNames.includes(product.name)
      );
      
      // Bereken statistieken per product
      const productStats = filteredProducts.map(product => {
        // Filter verkopen voor dit product
        const productEntries = actualEntries.filter(entry => 
          entry.product_id === product.id);
          
        // Bereken totale verkoopaantallen
        const totalQuantity = productEntries.reduce((sum, entry) => 
          sum + (entry.number_of_users || 0), 0);
          
        // Filter planning voor dit product
        const productBudget = budgetEntries.filter(entry => 
          entry.product_id === product.id);
        
        // Bereken geplande aantallen
        const plannedQuantity = productBudget.reduce((sum, entry) => 
          sum + (entry.number_of_users || 0), 0);
        
        // Organiseer verkopen per maand
        const salesByMonth = {};
        productEntries.forEach(entry => {
          const date = new Date(entry.entry_date);
          const month = date.getMonth() + 1;
          const year = date.getFullYear();
          const key = `${year}-${month}`;
          
          if (!salesByMonth[key]) {
            salesByMonth[key] = {
              quantity: 0,
              revenue: 0
            };
          }
          
          salesByMonth[key].quantity += (entry.number_of_users || 0);
          salesByMonth[key].revenue += parseFloat(entry.amount || 0);
        });
        
        // Organiseer planning per maand
        const budgetByMonth = {};
        productBudget.forEach(entry => {
          const month = entry.month;
          const year = entry.year;
          const key = `${year}-${month}`;
          
          if (!budgetByMonth[key]) {
            budgetByMonth[key] = {
              quantity: 0,
              amount: 0
            };
          }
          
          budgetByMonth[key].quantity += (entry.number_of_users || 0);
          budgetByMonth[key].amount += parseFloat(entry.amount || 0);
        });
        
        return {
          ...product,
          totalQuantity,
          plannedQuantity,
          salesByMonth,
          budgetByMonth,
          achievement: plannedQuantity > 0 ? (totalQuantity / plannedQuantity) * 100 : 0
        };
      });
      
      // Sorteer op totale verkoopaantallen om top producten te bepalen
      const sortedProducts = [...productStats].sort((a, b) => 
        b.totalQuantity - a.totalQuantity);
      
      // Neem de top 3 (of minder als er minder producten zijn)
      const top = sortedProducts.slice(0, Math.min(3, sortedProducts.length));
      setTopProducts(top);
      
      // Genereer maandelijks productplan
      generateMonthlyProductPlan(productStats);
    };
    
    // Genereer maandelijks productplan
    const generateMonthlyProductPlan = (productStats) => {
      // Bepaal unieke maanden uit verkoop- en planningsdata
      const months = new Set();
      
      productStats.forEach(product => {
        // Voeg maanden toe uit verkoopdata
        Object.keys(product.salesByMonth).forEach(month => months.add(month));
        
        // Voeg maanden toe uit planningsdata
        Object.keys(product.budgetByMonth).forEach(month => months.add(month));
      });
      
      // Sorteer maanden chronologisch
      const sortedMonths = Array.from(months).sort();
      
      // Genereer plan per maand
      const plan = sortedMonths.map(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        
        // Verzamel productdata voor deze maand
        const productsForMonth = productStats.map(product => {
          const sales = product.salesByMonth[monthKey] || { quantity: 0, revenue: 0 };
          const budget = product.budgetByMonth[monthKey] || { quantity: 0, amount: 0 };
          
          return {
            id: product.id,
            name: product.name,
            type: product.type,
            unit: product.type === 'consultancy' ? 'uren' : 'gebruikers',
            planned: budget.quantity,
            actual: sales.quantity,
            achievement: budget.quantity > 0 ? (sales.quantity / budget.quantity) * 100 : 0
          };
        }).filter(p => p.planned > 0 || p.actual > 0);
        
        return {
          monthKey,
          year,
          month,
          monthName: new Date(year, month - 1).toLocaleString('nl-NL', { month: 'long' }),
          products: productsForMonth
        };
      });
      
      setMonthlyProductPlan(plan);
    };
    
    // Render top producten sectie
    const renderTopProducts = () => {
      if (loading) {
        return <p>Gegevens laden...</p>;
      }
      
      if (topProducts.length === 0) {
        return <p>Geen productgegevens beschikbaar.</p>;
      }
      
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {topProducts.map((product, index) => (
            <div key={product.id} className="bg-white rounded-lg shadow p-5 border-t-4 border-blue-500">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">
                  {product.name}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Verkocht</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {product.totalQuantity} <span className="text-sm font-normal">
                      {product.type === 'consultancy' ? 'uren' : 'gebruikers'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gepland</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {product.plannedQuantity} <span className="text-sm font-normal">
                      {product.type === 'consultancy' ? 'uren' : 'gebruikers'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Realisatie t.o.v. planning</span>
                  <span className={`text-sm font-semibold ${product.achievement >= 100 
                    ? 'text-green-700' 
                    : product.achievement >= 80 
                      ? 'text-yellow-700' 
                      : 'text-red-700'}`}>
                    {Math.round(product.achievement)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${product.achievement >= 100 
                      ? 'bg-green-600' 
                      : product.achievement >= 80 
                        ? 'bg-yellow-600' 
                        : 'bg-red-600'}`}
                    style={{ width: `${Math.min(100, Math.round(product.achievement))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    };
    
    // Render maandelijks productplan
    const renderMonthlyPlan = () => {
      if (loading) {
        return <p>Gegevens laden...</p>;
      }
      
      if (monthlyProductPlan.length === 0) {
        return <p>Geen planningsgegevens beschikbaar.</p>;
      }
      
      // Toon alleen laatste 3 maanden + toekomstige 9 maanden
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
      
      const relevantMonths = monthlyProductPlan
        .filter(m => m.monthKey >= currentYearMonth || 
                   m.monthKey >= `${now.getFullYear()}-${now.getMonth() - 2}`);
      
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Maand</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Geplande Producten</th>
                <th className="px-4 py-3 bg-gray-50 text-right text-sm font-medium text-gray-900">Gepland Aantal</th>
                <th className="px-4 py-3 bg-gray-50 text-right text-sm font-medium text-gray-900">Werkelijk Aantal</th>
                <th className="px-4 py-3 bg-gray-50 text-right text-sm font-medium text-gray-900">Realisatie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {relevantMonths.map((month) => {
                // Bepaal of dit de huidige maand is
                const isCurrentMonth = month.year === now.getFullYear() && month.month === now.getMonth() + 1;
                // Bepaal of dit een toekomstige maand is
                const isFutureMonth = new Date(month.year, month.month - 1) > now;
                
                // Sorteer producten op geplande aantallen
                const sortedProducts = [...month.products].sort((a, b) => b.planned - a.planned);
                
                return (
                  <tr key={month.monthKey} 
                      className={isCurrentMonth ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {month.monthName} {month.year}
                      {isCurrentMonth && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Huidig</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {sortedProducts.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {sortedProducts.map((product) => (
                            <li key={product.id} className="text-sm">
                              <span className="font-medium text-gray-900">
                                {product.name}
                              </span>
                              <span className="text-gray-700 text-xs ml-1">
                                ({product.unit})
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-700">Geen producten gepland</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {sortedProducts.reduce((sum, p) => sum + p.planned, 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {isFutureMonth ? (
                        <span className="text-gray-700">-</span>
                      ) : (
                        sortedProducts.reduce((sum, p) => sum + p.actual, 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {isFutureMonth ? (
                        <span className="text-gray-700">Nog niet begonnen</span>
                      ) : (
                        <div className="flex items-center justify-end">
                          {(() => {
                            const totalPlanned = sortedProducts.reduce((sum, p) => sum + p.planned, 0);
                            const totalActual = sortedProducts.reduce((sum, p) => sum + p.actual, 0);
                            const achievement = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
                            
                            return (
                              <>
                                <span className={`font-medium ${achievement >= 100 
                                  ? 'text-green-700' 
                                  : achievement >= 80 
                                    ? 'text-yellow-700' 
                                    : 'text-red-700'}`}>
                                  {Math.round(achievement)}%
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-2 ml-2">
                                  <div 
                                    className={`h-2 rounded-full ${achievement >= 100 
                                      ? 'bg-green-600' 
                                      : achievement >= 80 
                                        ? 'bg-yellow-600' 
                                        : 'bg-red-600'}`}
                                    style={{ width: `${Math.min(100, Math.round(achievement))}%` }}
                                  ></div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };
    
    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Product Verkoop Overzicht</h2>
        
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Top Producten</h3>
        {renderTopProducts()}
        
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Maandelijks Productplan</h3>
        {renderMonthlyPlan()}
      </div>
    );
  };

  // Functie om de producten te groeperen per categorie
  const groupProductsByCategory = () => {
    if (!performanceData || performanceData.length === 0) {
      return [];
    }
    
    // Groepeer producten per categorie
    const categories = {
      consultancy: {
        name: 'Consultancy',
        products: [],
        planned_revenue: 0,
        actual_revenue: 0,
        planned_quantity: 0,
        actual_quantity: 0
      },
      saas: {
        name: 'SaaS',
        products: [],
        planned_revenue: 0,
        actual_revenue: 0,
        planned_quantity: 0,
        actual_quantity: 0
      }
    };
    
    // Filter out invalid products but keep SaaS products
    const filteredPerformanceData = performanceData.filter(product => {
      const productName = product.product_name || '';
      // Only filter out "Omzet" and "Omzet Consultancy", keep SaaS products
      return !['Omzet', 'Omzet Consultancy'].includes(productName);
    });
    
    filteredPerformanceData.forEach(product => {
      const category = product.unit === 'uren' ? 'consultancy' : 'saas';
      
      categories[category].products.push(product);
      categories[category].planned_revenue += product.planned_revenue || 0;
      categories[category].actual_revenue += product.actual_revenue || 0;
      categories[category].planned_quantity += product.planned_quantity || 0;
      categories[category].actual_quantity += product.actual_quantity || 0;
    });
    
    // Bereken achievement percentage per categorie
    Object.keys(categories).forEach(key => {
      const category = categories[key];
      category.achievement_percentage = category.planned_revenue > 0 
        ? Math.round((category.actual_revenue / category.planned_revenue * 100) * 100) / 100
        : 0;
    });
    
    return Object.values(categories);
  };

  const handleTimeframeChange = (value: 'month' | 'quarter' | 'year'): void => {
    setTimeframe(value);
  };

  const calculateProductPerformance = (
    products: Product[],
    actualEntries: ActualEntry[],
    budgetEntries: BudgetEntry[]
  ): ProductPerformance[] => {
    return products.map((product: Product) => {
      const productActualEntries = actualEntries.filter((entry: ActualEntry) => entry.product_id === product.id);
      const productBudgetEntries = budgetEntries.filter((entry: BudgetEntry) => entry.product_id === product.id);

      const actualAmount = productActualEntries.reduce((sum: number, entry: ActualEntry) => sum + entry.amount, 0);
      const actualQuantity = productActualEntries.reduce((sum: number, entry: ActualEntry) => sum + entry.quantity, 0);
      const plannedAmount = productBudgetEntries.reduce((sum: number, entry: BudgetEntry) => sum + entry.amount, 0);
      const plannedQuantity = productBudgetEntries.reduce((sum: number, entry: BudgetEntry) => sum + entry.quantity, 0);

      return {
        product_id: product.id,
        product_name: product.name,
        planned_quantity: plannedQuantity,
        actual_quantity: actualQuantity,
        planned_revenue: plannedAmount,
        actual_revenue: actualAmount,
        achievement_percentage: plannedAmount > 0 ? (actualAmount / plannedAmount) * 100 : 0,
        unit: product.unit
      };
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Dashboard</h1>
            <p className="text-gray-700">Overzicht van productprestaties en verkopen</p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
            <div className="flex">
              <button 
                className={`px-3 py-1 text-sm border ${timeframe === 'month' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-300 text-gray-700'}`}
                onClick={() => handleTimeframeChange('month')}
              >
                Maand
              </button>
              <button 
                className={`px-3 py-1 text-sm border ${timeframe === 'quarter' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-300 text-gray-700'}`}
                onClick={() => handleTimeframeChange('quarter')}
              >
                Kwartaal
              </button>
              <button 
                className={`px-3 py-1 text-sm border ${timeframe === 'year' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-300 text-gray-700'}`}
                onClick={() => handleTimeframeChange('year')}
              >
                Jaar
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecteer periode</label>
            <input 
              type="month" 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded px-3 py-1 text-gray-700"
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {syncMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {syncMessage}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-600">Geplande Omzet</h3>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(kpis.totalPlannedRevenue)}</p>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-700">Werkelijke Omzet</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalActualRevenue)}</p>
              <div className="mt-1 text-sm">
                <span className={kpis.revenueAchievement >= 100 ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                  {formatPercentage(kpis.revenueAchievement)} van plan
                </span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-700">Winstmarge</h3>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(kpis.profitMargin)}</p>
              <p className="text-sm text-gray-700">{formatCurrency(kpis.totalProfit)} winst</p>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-700">Verkochte Eenheden</h3>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalQuantity}</p>
              <p className="text-sm text-gray-700">Gem. {formatCurrency(kpis.averagePrice)} per {performanceData.length > 0 && performanceData[0].unit === 'uren' ? 'uur' : 'gebruiker'}</p>
            </div>
          </div>
          
          {/* Trendgrafiek */}
          {loadingTrends ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            renderTrendChart()
          )}
          
          {/* Product Performance Overview */}
          <ProductPerformanceOverview />
          
          {/* Strategische Verkoopvoorspelling */}
          <StrategicSalesForecast />
          
          {/* Maandelijkse Verkoop Prognose */}
          <MonthlyForecast />
          
          {/* Categorieën Overzicht */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-lg font-medium mb-4 text-gray-800">Categorieën Overzicht</h2>
            
            {performanceData.length === 0 ? (
              <p className="text-gray-700">Geen gegevens gevonden voor deze periode.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Categorie</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Gepland Aantal</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Gepland (€)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Werkelijk Aantal</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Werkelijk (€)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Behaald (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {groupProductsByCategory().map(category => {
                      const percentage = category.achievement_percentage || 0;
                      
                      return (
                        <tr key={category.name}>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-800 font-medium">
                            {category.name}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{category.planned_quantity || 0}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{formatCurrency(category.planned_revenue || 0)}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{category.actual_quantity || 0}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{formatCurrency(category.actual_revenue || 0)}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <span className={percentage >= 100 ? 'text-green-700 font-medium' : percentage >= 75 ? 'text-yellow-700 font-medium' : 'text-red-700 font-medium'}>
                              {formatPercentage(percentage)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Product Prestaties */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-lg font-medium mb-4 text-gray-800">Product Prestaties</h2>
            
            {performanceData.length === 0 ? (
              <p className="text-gray-700">Geen gegevens gevonden voor deze periode.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Eenheid</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Gepland Aantal</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Gepland (€)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Werkelijk Aantal</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Werkelijk (€)</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Behaald (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {performanceData
                      .filter(product => {
                        const productName = product.product_name || '';
                        return !invalidNames.includes(productName);
                      })
                      .map(product => {
                      const percentage = product.achievement_percentage || 0;
                      
                      return (
                        <tr key={product.product_id}>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-800">
                            {product.product_name}
                          </td>
                          <td className="px-4 py-2 text-center whitespace-nowrap text-gray-800">
                            {product.unit}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{product.planned_quantity || 0}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{formatCurrency(product.planned_revenue || 0)}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{product.actual_quantity || 0}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap text-gray-800">{formatCurrency(product.actual_revenue || 0)}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <span className={percentage >= 100 ? 'text-green-700 font-medium' : percentage >= 75 ? 'text-yellow-700 font-medium' : 'text-red-700 font-medium'}>
                              {formatPercentage(percentage)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Sync Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleCheckProductLinks}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={loading}
            >
              Controleer Product Koppelingen
            </button>
          </div>
        </>
      )}
    </div>
  );
} 