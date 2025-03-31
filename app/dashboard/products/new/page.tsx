'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/app/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0, 'Price must be a positive number')
  ),
  category: z.string().optional(),
  type: z.enum(['SaaS', 'Consultancy']),
  is_required: z.boolean().default(false),
  gl_account_id: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      type: 'SaaS',
      is_required: false,
      gl_account_id: '',
    },
  });
  
  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    
    const supabase = getBrowserSupabaseClient();
    
    try {
      // Create the product
      const { error: insertError } = await supabase.from('products').insert({
        name: data.name,
        description: data.description || null,
        price: data.price,
        category: data.category || null,
        organization_id: '00000000-0000-0000-0000-000000000000',
        type: data.type,
        is_required: data.is_required,
        gl_account_id: data.gl_account_id || null
      });
      
      if (insertError) throw insertError;
      
      // Redirect back to products list
      router.push('/dashboard/products');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.message || 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Product</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new product or service to your organization</p>
      </div>
      
      <div className="rounded-md bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <div className="mt-1">
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="block w-full rounded-md border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
            </div>
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price *
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="price"
                type="number"
                step="0.01"
                {...register('price')}
                className={`block w-full rounded-md border-gray-300 pl-7 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                  errors.price ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <div className="mt-1">
              <input
                id="category"
                type="text"
                {...register('category')}
                className="block w-full rounded-md border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
            </div>
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type *
            </label>
            <div className="mt-1">
              <select
                id="type"
                {...register('type')}
                className="block w-full rounded-md border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="SaaS">SaaS</option>
                <option value="Consultancy">Consultancy</option>
              </select>
              {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="is_required"
              type="checkbox"
              {...register('is_required')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_required" className="text-sm font-medium text-gray-700">
              Required product
            </label>
          </div>
          
          <div>
            <label htmlFor="gl_account_id" className="block text-sm font-medium text-gray-700">
              GL Account ID
            </label>
            <div className="mt-1">
              <input
                id="gl_account_id"
                type="text"
                {...register('gl_account_id')}
                className="block w-full rounded-md border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.gl_account_id && <p className="mt-1 text-xs text-red-600">{errors.gl_account_id.message}</p>}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/dashboard/products"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 