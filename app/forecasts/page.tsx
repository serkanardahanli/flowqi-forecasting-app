'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Link from 'next/link';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Chart } from '@/components/Chart';

export default function ForecastsPage() {
  const [year, setYear] = useState(2025);
  const [kpis, setKpis] = useState({
    plannedRevenue: 425000,
    saasPercentage: 38,
    plannedExpenses: 350000,
    personnelPercentage: 39,
    rdPercentage: 14,
    marketingSpent: 75000,
    marketingTarget: 80000,
    expectedProfit: 75000,
    burnRate: 20000
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Controleer authenticatie en haal forecast data op
    const fetchForecastData = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        
        // Check voor actieve sessie
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Authenticatiefout:', sessionError || 'Geen actieve sessie');
          return;
        }
        
        // Haal KPIs op uit Supabase
        const { data: kpiData, error: kpiError } = await supabase
          .from('kpi_targets')
          .select('*')
          .eq('year', year)
          .single();
          
        if (kpiData) {
          setKpis(kpiData);
        }
        
        // Als er geen expliciete data is, kunnen we de standaard values gebruiken
        // die al in de state zijn ingesteld
        
      } catch (error) {
        console.error('Fout bij ophalen van forecast data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchForecastData();
  }, [year]);

  // Helper om status-indicator te tonen
  const getStatusIndicator = (value, target, type = 'standard') => {
    if (type === 'inverse') {
      // Voor metrics waar lager beter is
      return value <= target ? '✅' : value <= target * 1.1 ? '⚠️' : '🔴';
    } else {
      // Voor metrics waar hoger beter is
      return value >= target ? '✅' : value >= target * 0.9 ? '⚠️' : '🔴';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[500px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Forecast & Begroting</h1>
        <div className="flex gap-4">
          <select 
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Export
          </button>
        </div>
      </div>

      {/* KPI Overzicht */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Geplande omzet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(kpis.plannedRevenue/1000).toFixed(0)}K</div>
            <div className="mt-1 flex items-center text-xs text-green-600">
              <span className="inline-block mr-1">+12%</span> t.o.v. vorig jaar
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>SaaS: {kpis.saasPercentage}%</span>
                <span>Consultancy: {100-kpis.saasPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${kpis.saasPercentage}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Geplande uitgaven</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(kpis.plannedExpenses/1000).toFixed(0)}K</div>
            <div className="mt-1 flex items-center text-xs text-gray-600">
              <span className="inline-block mr-1">Target: max €400K</span>
              <span className="ml-1">{getStatusIndicator(kpis.plannedExpenses, 400000, 'inverse')}</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Personeelskosten: {kpis.personnelPercentage}%</span>
                <span>Target: max 40%</span>
              </div>
              <div 
                className={`w-full h-2 rounded-full overflow-hidden ${kpis.personnelPercentage <= 40 ? "bg-green-100" : "bg-red-100"}`}
              >
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${kpis.personnelPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Marketing & R&D</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-700 mb-1">
                <span>Marketing: €{(kpis.marketingSpent/1000).toFixed(0)}K</span>
                <span>Target: €{(kpis.marketingTarget/1000).toFixed(0)}K {getStatusIndicator(kpis.marketingSpent, kpis.marketingTarget)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(kpis.marketingSpent/kpis.marketingTarget)*100}%` }}
                ></div>
              </div>
            </div>
            <div className="mb-1">
              <div className="flex justify-between text-xs text-gray-700 mb-1">
                <span>R&D: {kpis.rdPercentage}%</span>
                <span>Target: 15% {getStatusIndicator(kpis.rdPercentage, 15)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${kpis.rdPercentage/20*100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Verwacht resultaat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{(kpis.expectedProfit/1000).toFixed(0)}K</div>
            <div className="text-xs text-gray-500 mt-1">Marge: {((kpis.expectedProfit/kpis.plannedRevenue)*100).toFixed(1)}%</div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-700 mb-1">
                <span>Burn rate:</span>
                <span>€{(kpis.burnRate/1000).toFixed(0)}K/maand</span>
              </div>
              <div className="flex justify-between text-xs text-gray-700">
                <span>Break-even:</span>
                <span className="text-green-600">✅ Bereikt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs voor Planned vs Realized */}
      <Tabs defaultValue="planned" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="planned">📈 Geplande Begroting</TabsTrigger>
          <TabsTrigger value="realized">📊 Realisatie vs Planning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="planned" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inkomsten Planning</CardTitle>
              <CardDescription>
                Plan je inkomsten per maand, opgesplitst naar Consultancy en SaaS abonnementen
              </CardDescription>
              <div className="flex justify-end">
                <Link 
                  href="/omzet" 
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Beheer in Omzetbeheer →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabel layout zoals in je huidige omzetbeheer */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-2">Type</th>
                      <th className="text-right p-2">Jan</th>
                      <th className="text-right p-2">Feb</th>
                      <th className="text-right p-2">Mrt</th>
                      {/* Andere maanden */}
                      <th className="text-right p-2">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Consultancy</td>
                      <td className="text-right p-2">€14.000</td>
                      <td className="text-right p-2">€14.000</td>
                      <td className="text-right p-2">€14.000</td>
                      {/* Andere maanden */}
                      <td className="text-right p-2 font-medium">€168.000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">SaaS</td>
                      <td className="text-right p-2">€7.000</td>
                      <td className="text-right p-2">€7.500</td>
                      <td className="text-right p-2">€8.000</td>
                      {/* Andere maanden */}
                      <td className="text-right p-2 font-medium">€102.000</td>
                    </tr>
                    <tr className="font-bold bg-gray-50">
                      <td className="p-2">Totaal</td>
                      <td className="text-right p-2">€21.000</td>
                      <td className="text-right p-2">€21.500</td>
                      <td className="text-right p-2">€22.000</td>
                      {/* Andere maanden */}
                      <td className="text-right p-2">€270.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uitgaven Planning</CardTitle>
              <CardDescription>
                Beheer je uitgaven per categorie en maand
              </CardDescription>
              <div className="flex justify-end">
                <Link 
                  href="/uitgaven" 
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Beheer in Uitgavenbeheer →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {/* Uitgaventabel zoals in je huidige Kosten Beheer */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Omschrijving</th>
                      <th className="text-right p-2">Jan</th>
                      <th className="text-right p-2">Feb</th>
                      <th className="text-right p-2">Mrt</th>
                      {/* Andere maanden */}
                      <th className="text-right p-2">Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">4000</td>
                      <td className="p-2">Bruto Loon</td>
                      <td className="text-right p-2 text-red-600">-€15.000</td>
                      <td className="text-right p-2 text-red-600">-€15.000</td>
                      <td className="text-right p-2 text-red-600">-€15.000</td>
                      {/* Andere maanden */}
                      <td className="text-right p-2 font-medium text-red-600">-€180.000</td>
                    </tr>
                    {/* Andere uitgavencategorieën */}
                    <tr className="font-bold bg-gray-50">
                      <td className="p-2" colSpan={2}>Totaal</td>
                      <td className="text-right p-2 text-red-600">-€25.000</td>
                      <td className="text-right p-2 text-red-600">-€25.000</td>
                      <td className="text-right p-2 text-red-600">-€25.000</td>
                      {/* Andere maanden */}
                      <td className="text-right p-2 text-red-600">-€350.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="realized" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Realisatie vs Planning</CardTitle>
              <CardDescription>
                Vergelijk je werkelijke resultaten met je budget
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80">
                {/* Hier zou een grafiek komen die realisatie vs planning toont */}
                <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Grafiek: Realisatie vs. Planning</p>
                  <p className="text-sm text-gray-400 mt-2">Data wordt geladen vanuit je financiële administratie</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Inkomsten Vergelijking</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Categorie</th>
                        <th className="text-right py-2">Gepland</th>
                        <th className="text-right py-2">Gerealiseerd</th>
                        <th className="text-right py-2">Verschil</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Consultancy</td>
                        <td className="text-right py-2">€168.000</td>
                        <td className="text-right py-2">€172.000</td>
                        <td className="text-right py-2 text-green-600">+€4.000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">SaaS</td>
                        <td className="text-right py-2">€102.000</td>
                        <td className="text-right py-2">€95.000</td>
                        <td className="text-right py-2 text-red-600">-€7.000</td>
                      </tr>
                      <tr className="font-medium">
                        <td className="py-2">Totaal</td>
                        <td className="text-right py-2">€270.000</td>
                        <td className="text-right py-2">€267.000</td>
                        <td className="text-right py-2 text-red-600">-€3.000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Uitgaven Vergelijking</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Categorie</th>
                        <th className="text-right py-2">Gepland</th>
                        <th className="text-right py-2">Gerealiseerd</th>
                        <th className="text-right py-2">Verschil</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Personeelskosten</td>
                        <td className="text-right py-2">€180.000</td>
                        <td className="text-right py-2">€175.000</td>
                        <td className="text-right py-2 text-green-600">+€5.000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Marketing</td>
                        <td className="text-right py-2">€80.000</td>
                        <td className="text-right py-2">€85.000</td>
                        <td className="text-right py-2 text-red-600">-€5.000</td>
                      </tr>
                      <tr className="font-medium">
                        <td className="py-2">Totaal</td>
                        <td className="text-right py-2">€350.000</td>
                        <td className="text-right py-2">€345.000</td>
                        <td className="text-right py-2 text-green-600">+€5.000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>KPI Prestaties</CardTitle>
              <CardDescription>
                Voortgang op je belangrijkste KPIs en targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Omzet Targets</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>SaaS Omzet %</span>
                        <span>38% / 40%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${kpis.saasPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Gemiddelde uurprijs Consultancy</span>
                        <span>€95 / €100</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${kpis.rdPercentage/20*100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Recurring Revenue %</span>
                        <span>45% / 50%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(kpis.marketingSpent/kpis.marketingTarget)*100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Kosten Targets</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Personeelskosten %</span>
                        <span>39% / 40%</span>
                      </div>
                      <div 
                        className={`w-full h-2 rounded-full overflow-hidden ${kpis.personnelPercentage <= 40 ? "bg-green-100" : "bg-red-100"}`}
                      >
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${kpis.personnelPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>R&D Investering %</span>
                        <span>14% / 15%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${kpis.rdPercentage/20*100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Marketing Budget Gebruik</span>
                        <span>€75K / €80K</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(kpis.marketingSpent/kpis.marketingTarget)*100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 