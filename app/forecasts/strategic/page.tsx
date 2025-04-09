"use client";

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import Link from 'next/link';
import { format, addMonths, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

export default function StrategicForecastingPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  
  // State voor het toevoegen/bewerken van events
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    event_type: 'Beurs',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    expected_leads: 0,
    description: ''
  });
  
  // State voor het toevoegen/bewerken van voorspellingen
  const [isAddingForecast, setIsAddingForecast] = useState(false);
  const [newForecast, setNewForecast] = useState({
    product_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    forecasted_quantity: 0,
    marketing_event_id: null,
    notes: ''
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = getBrowserSupabaseClient();
      
      // Laad producten (niveau 3 GL accounts)
      const { data: glAccounts, error: glError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('level', 3)
        .eq('type', 'Inkomsten');
        
      if (glError) throw glError;
      
      // Laad bijbehorende producten
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*');
        
      if (productError) throw productError;
      
      // Combineer producten met hun GL accounts
      const productsWithGL = productData.map(product => {
        const glAccount = glAccounts.find(acc => acc.id === product.gl_account_id);
        return {
          ...product,
          gl_code: glAccount?.code || null,
          gl_name: glAccount?.name || null,
          display_name: product.name
        };
      });
      
      setProducts(productsWithGL);
      
      // Laad events
      const { data: eventsData, error: eventsError } = await supabase
        .from('marketing_events')
        .select('*')
        .order('start_date', { ascending: false });
        
      if (eventsError) throw eventsError;
      
      setEvents(eventsData || []);
      
      // Laad voorspellingen
      const { data: forecastsData, error: forecastsError } = await supabase
        .from('product_forecasts')
        .select(`
          *,
          products (id, name),
          marketing_events (id, name)
        `)
        .order('year', { ascending: true })
        .order('month', { ascending: true });
        
      if (forecastsError) throw forecastsError;
      
      setForecasts(forecastsData || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Functie om een nieuw event toe te voegen
  const handleAddEvent = async () => {
    try {
      setLoading(true);
      const supabase = getBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('marketing_events')
        .insert([{
          name: newEvent.name,
          event_type: newEvent.event_type,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          expected_leads: newEvent.expected_leads,
          description: newEvent.description
        }])
        .select();
        
      if (error) throw error;
      
      // Reset form en reload data
      setNewEvent({
        name: '',
        event_type: 'Beurs',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        expected_leads: 0,
        description: ''
      });
      
      setIsAddingEvent(false);
      await loadData();
      
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Functie om een nieuwe voorspelling toe te voegen
  const handleAddForecast = async () => {
    try {
      setLoading(true);
      const supabase = getBrowserSupabaseClient();
      
      // Haal GL account ID op voor dit product
      const product = products.find(p => p.id === newForecast.product_id);
      
      const { data, error } = await supabase
        .from('product_forecasts')
        .insert([{
          product_id: newForecast.product_id,
          gl_account_id: product?.gl_account_id || null,
          year: newForecast.year,
          month: newForecast.month,
          forecasted_quantity: newForecast.forecasted_quantity,
          marketing_event_id: newForecast.marketing_event_id,
          notes: newForecast.notes
        }])
        .select();
        
      if (error) throw error;
      
      // Reset form en reload data
      setNewForecast({
        product_id: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        forecasted_quantity: 0,
        marketing_event_id: null,
        notes: ''
      });
      
      setIsAddingForecast(false);
      await loadData();
      
    } catch (error) {
      console.error('Error adding forecast:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-800">Strategische Verkoopvoorspelling</h1>
        <Link 
          href="/forecasts" 
          className="text-sm text-indigo-700 hover:text-indigo-900 font-medium"
        >
          ← Terug naar Forecasts
        </Link>
      </div>
      
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="events" className="text-gray-800">Marketing Events</TabsTrigger>
          <TabsTrigger value="forecasts" className="text-gray-800">Product Voorspellingen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-indigo-800">Marketing Events</CardTitle>
                <CardDescription className="text-gray-700">
                  Beheer marketing events en hun verwachte impact op verkopen
                </CardDescription>
              </div>
              <button 
                onClick={() => setIsAddingEvent(!isAddingEvent)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isAddingEvent ? 'Annuleren' : 'Nieuw Event'}
              </button>
            </CardHeader>
            <CardContent>
              {isAddingEvent && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-medium mb-4">Nieuw Marketing Event</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                      <input 
                        type="text"
                        className="w-full p-2 border rounded"
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={newEvent.event_type}
                        onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                      >
                        <option value="Beurs">Beurs</option>
                        <option value="Campagne">Campagne</option>
                        <option value="Webinar">Webinar</option>
                        <option value="Conferentie">Conferentie</option>
                        <option value="Overig">Overig</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
                      <input 
                        type="date"
                        className="w-full p-2 border rounded"
                        value={newEvent.start_date}
                        onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Einddatum</label>
                      <input 
                        type="date"
                        className="w-full p-2 border rounded"
                        value={newEvent.end_date}
                        onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Verwachte Leads</label>
                      <input 
                        type="number"
                        className="w-full p-2 border rounded"
                        value={newEvent.expected_leads}
                        onChange={(e) => setNewEvent({...newEvent, expected_leads: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
                      <textarea 
                        className="w-full p-2 border rounded"
                        rows={3}
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddEvent}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      disabled={loading || !newEvent.name}
                    >
                      Event Toevoegen
                    </button>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : events.length === 0 ? (
                <p className="text-gray-700">Geen events gevonden. Maak een nieuw event aan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Naam</th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Type</th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Periode</th>
                        <th className="px-4 py-3 bg-gray-50 text-right text-sm font-medium text-gray-900">Verwachte Leads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{event.event_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {format(parseISO(event.start_date), 'd MMM yyyy', { locale: nl })} - 
                            {format(parseISO(event.end_date), 'd MMM yyyy', { locale: nl })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{event.expected_leads}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="forecasts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-indigo-800">Product Voorspellingen</CardTitle>
                <CardDescription>
                  Beheer voorspellingen voor productverkopen per maand
                </CardDescription>
              </div>
              <button 
                onClick={() => setIsAddingForecast(!isAddingForecast)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isAddingForecast ? 'Annuleren' : 'Nieuwe Voorspelling'}
              </button>
            </CardHeader>
            <CardContent>
              {isAddingForecast && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-medium mb-4">Nieuwe Product Voorspelling</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={newForecast.product_id}
                        onChange={(e) => setNewForecast({...newForecast, product_id: e.target.value})}
                      >
                        <option value="">-- Selecteer een product --</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gekoppeld aan Event</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={newForecast.marketing_event_id || ''}
                        onChange={(e) => setNewForecast({...newForecast, marketing_event_id: e.target.value || null})}
                      >
                        <option value="">-- Geen event --</option>
                        {events.map(event => (
                          <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jaar</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={newForecast.year}
                        onChange={(e) => setNewForecast({...newForecast, year: parseInt(e.target.value)})}
                      >
                        {Array.from({length: 3}, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maand</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={newForecast.month}
                        onChange={(e) => setNewForecast({...newForecast, month: parseInt(e.target.value)})}
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>
                            {format(new Date(2022, month - 1, 1), 'MMMM', { locale: nl })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voorspelde Aantal</label>
                      <input 
                        type="number"
                        className="w-full p-2 border rounded"
                        value={newForecast.forecasted_quantity}
                        onChange={(e) => setNewForecast({...newForecast, forecasted_quantity: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
                      <textarea 
                        className="w-full p-2 border rounded"
                        rows={3}
                        value={newForecast.notes}
                        onChange={(e) => setNewForecast({...newForecast, notes: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddForecast}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      disabled={loading || !newForecast.product_id}
                    >
                      Voorspelling Toevoegen
                    </button>
                  </div>
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : forecasts.length === 0 ? (
                <p>Geen voorspellingen gevonden. Maak een nieuwe voorspelling aan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Product</th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Periode</th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Gekoppeld Event</th>
                        <th className="px-4 py-3 bg-gray-50 text-right text-sm font-medium text-gray-900">Voorspelling</th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-sm font-medium text-gray-900">Notities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {forecasts.map((forecast) => {
                        const product = products.find(p => p.id === forecast.product_id);
                        return (
                          <tr key={forecast.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {product?.name || forecast.products?.name || 'Onbekend product'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {format(new Date(forecast.year, forecast.month - 1, 1), 'MMMM yyyy', { locale: nl })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {forecast.marketing_events?.name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {forecast.forecasted_quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {forecast.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 