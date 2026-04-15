import React from 'react';

// Card Skeleton for resource cards
export const CardSkeleton = () => (
  <div className="card bg-base-100 shadow-lg animate-pulse">
    <div className="card-body">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 bg-base-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-base-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-base-300 rounded w-1/2"></div>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-base-300 rounded w-full"></div>
        <div className="h-4 bg-base-300 rounded w-2/3"></div>
        <div className="h-4 bg-base-300 rounded w-1/2"></div>
      </div>
      
      <div className="flex gap-2">
        <div className="h-8 bg-base-300 rounded w-20"></div>
        <div className="h-8 bg-base-300 rounded w-16"></div>
      </div>
    </div>
  </div>
);

// Table Row Skeleton for admin table
export const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td>
      <div className="w-4 h-4 bg-base-300 rounded"></div>
    </td>
    <td>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-base-300 rounded"></div>
        <div className="flex-1">
          <div className="h-4 bg-base-300 rounded w-32 mb-1"></div>
          <div className="h-3 bg-base-300 rounded w-24"></div>
        </div>
      </div>
    </td>
    <td>
      <div className="h-4 bg-base-300 rounded w-20"></div>
    </td>
    <td>
      <div className="h-4 bg-base-300 rounded w-24"></div>
    </td>
    <td>
      <div className="h-4 bg-base-300 rounded w-12"></div>
    </td>
    <td>
      <div className="h-6 bg-base-300 rounded w-16"></div>
    </td>
    <td>
      <div className="flex gap-2">
        <div className="h-8 bg-base-300 rounded w-12"></div>
        <div className="h-8 bg-base-300 rounded w-16"></div>
        <div className="h-8 bg-base-300 rounded w-12"></div>
      </div>
    </td>
  </tr>
);

// Detail Page Skeleton
export const DetailSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    {/* Breadcrumb skeleton */}
    <div className="flex gap-2 mb-6 animate-pulse">
      <div className="h-4 bg-base-300 rounded w-16"></div>
      <div className="h-4 bg-base-300 rounded w-20"></div>
      <div className="h-4 bg-base-300 rounded w-24"></div>
    </div>

    {/* Header card skeleton */}
    <div className="card bg-base-100 shadow-xl mb-8 animate-pulse">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-base-300 rounded"></div>
            <div>
              <div className="h-8 bg-base-300 rounded w-48 mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-32 mb-2"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-base-300 rounded w-24"></div>
                <div className="h-4 bg-base-300 rounded w-20"></div>
                <div className="h-4 bg-base-300 rounded w-16"></div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-base-300 rounded w-24"></div>
            <div className="h-10 bg-base-300 rounded w-20"></div>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-base-300 rounded w-full"></div>
            <div className="h-3 bg-base-300 rounded w-5/6"></div>
            <div className="h-3 bg-base-300 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Availability card skeleton */}
    <div className="card bg-base-100 shadow-xl mb-8 animate-pulse">
      <div className="card-body">
        <div className="h-6 bg-base-300 rounded w-32 mb-4"></div>
        <div className="form-control mb-4">
          <div className="h-4 bg-base-300 rounded w-20 mb-2"></div>
          <div className="h-10 bg-base-300 rounded w-48"></div>
        </div>
        <div className="space-y-2">
          <div className="h-12 bg-base-300 rounded"></div>
          <div className="h-12 bg-base-300 rounded"></div>
          <div className="h-12 bg-base-300 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// Form Skeleton
export const FormSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="form-control">
          <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
          <div className="h-10 bg-base-300 rounded"></div>
        </div>
      ))}
    </div>
    
    <div className="form-control">
      <div className="h-4 bg-base-300 rounded w-32 mb-2"></div>
      <div className="h-24 bg-base-300 rounded"></div>
    </div>
    
    <div className="form-control">
      <div className="h-4 bg-base-300 rounded w-28 mb-2"></div>
      <div className="h-10 bg-base-300 rounded w-32"></div>
    </div>
  </div>
);

// Loading Spinner for buttons
export const ButtonSpinner = () => (
  <span className="loading loading-spinner loading-sm"></span>
);

// Page Loading
export const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="text-center">
      <span className="loading loading-spinner loading-lg"></span>
      <p className="mt-4 text-base-content/70">Loading...</p>
    </div>
  </div>
);

export default {
  CardSkeleton,
  TableRowSkeleton,
  DetailSkeleton,
  FormSkeleton,
  ButtonSpinner,
  PageLoader
};
