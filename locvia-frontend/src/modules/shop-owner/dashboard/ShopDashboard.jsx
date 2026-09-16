// src/modules/shop-owner/dashboard/ShopDashboard.jsx
// Main Shop Owner Dashboard Page Container for Module 19

import DashboardHeader from './components/DashboardHeader';
import ShopStatusCard from './components/ShopStatusCard';
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
import RecentOrders from './components/RecentOrders';
import OrderStatusSummary from './components/OrderStatusSummary';
import RevenueChart from './components/RevenueChart';
import LowStockCard from './components/LowStockCard';
import TopProducts from './components/TopProducts';
import ShopPerformance from './components/ShopPerformance';
import RecentActivity from './components/RecentActivity';

export default function ShopDashboard() {
  return (
    <div className="shop-dashboard-wrapper">
      
      {/* Dashboard Top Header */}
      <DashboardHeader />

      {/* Main Content Body */}
      <div className="shop-dashboard-container">
        
        {/* Prominent Shop Status Card */}
        <ShopStatusCard />

        {/* 4 Metric Overview Cards */}
        <StatsCards />

        {/* Quick Actions Shortcuts */}
        <QuickActions />

        {/* Dashboard 2-Column Responsive Layout */}
        <div className="dashboard-grid-layout">
          
          {/* Main Column (Left): Orders Table & Revenue Chart */}
          <div className="dashboard-grid-main">
            <RecentOrders />
            <RevenueChart />
          </div>

          {/* Side Column (Right): Status Summary, Low Stock, Top Products, Performance, Activity */}
          <div className="dashboard-grid-side">
            <OrderStatusSummary />
            <LowStockCard />
            <TopProducts />
            <ShopPerformance />
            <RecentActivity />
          </div>

        </div>

      </div>

    </div>
  );
}
