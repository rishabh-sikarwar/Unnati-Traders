"use client"

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { checkRole } from '@/utils/roles'
import { 
  Card,   
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

const Dashboard = () => {
  const { user, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalSales: 125000,
      totalPurchases: 89000,
      totalOrders: 342,
      totalStock: 1250,
      salesTarget: 150000,
      salesAchieved: 125000
    },
    salesData: [
      { month: 'Jan', sales: 12000, purchases: 8000, target: 15000 },
      { month: 'Feb', sales: 15000, purchases: 9500, target: 16000 },
      { month: 'Mar', sales: 18000, purchases: 11000, target: 17000 },
      { month: 'Apr', sales: 22000, purchases: 13000, target: 20000 },
      { month: 'May', sales: 25000, purchases: 15000, target: 23000 },
      { month: 'Jun', sales: 33000, purchases: 20000, target: 25000 }
    ],
    categoryData: [
      { name: 'Electronics', value: 35, sales: 43750 },
      { name: 'Clothing', value: 25, sales: 31250 },
      { name: 'Home & Garden', value: 20, sales: 25000 },
      { name: 'Books', value: 12, sales: 15000 },
      { name: 'Others', value: 8, sales: 10000 }
    ],
    recentOrders: [
      { id: '001', customer: 'John Doe', amount: 1250, status: 'Completed', date: '2024-07-20' },
      { id: '002', customer: 'Jane Smith', amount: 890, status: 'Pending', date: '2024-07-21' },
      { id: '003', customer: 'Bob Johnson', amount: 2150, status: 'Processing', date: '2024-07-22' },
      { id: '004', customer: 'Alice Brown', amount: 750, status: 'Completed', date: '2024-07-23' },
      { id: '005', customer: 'Charlie Wilson', amount: 1680, status: 'Shipped', date: '2024-07-24' }
    ]
  })
  const [filters, setFilters] = useState({
    period: 'monthly',
    category: 'all',
    dataType: 'all'
  })

  useEffect(() => {
    const checkAdminRole = async () => {
      if (isLoaded && user) {
        try {
          const adminStatus = await checkRole('admin')
          setIsAdmin(adminStatus)
        } catch (error) {
          console.error('Error checking role:', error)
          setIsAdmin(false)
        } finally {
          setLoading(false)
        }
      }
    }
    checkAdminRole()
  }, [isLoaded, user])

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }))
    // Here you would typically fetch filtered data from backend
    // fetchFilteredData({ ...filters, [type]: value })
  }

  const refreshData = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      // Here you would fetch fresh data from backend
      setLoading(false)
    }, 1000)
  }

  const exportData = () => {
    // Here you would implement data export functionality
    console.log('Exporting data with filters:', filters)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const salesTargetPercentage = Math.round((dashboardData.summary.salesAchieved / dashboardData.summary.salesTarget) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              You don't have admin privileges to access this dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.firstName || 'Admin'}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Data Type</label>
                <Select value={filters.dataType} onValueChange={(value) => handleFilterChange('dataType', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data</SelectItem>
                    <SelectItem value="sales">Sales Only</SelectItem>
                    <SelectItem value="purchases">Purchases Only</SelectItem>
                    <SelectItem value="orders">Orders Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{dashboardData.summary.totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+12.3% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{dashboardData.summary.totalPurchases.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-500">+8.1% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardData.summary.totalOrders}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-sm text-red-500">-2.4% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Items</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dashboardData.summary.totalStock}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+5.7% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Target Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Target Achievement</CardTitle>
            <CardDescription>
              Current progress towards monthly sales target
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Target: ₹{dashboardData.summary.salesTarget.toLocaleString()}</span>
                <span>Achieved: ₹{dashboardData.summary.salesAchieved.toLocaleString()}</span>
              </div>
              <Progress value={salesTargetPercentage} className="h-3" />
              <div className="flex justify-between items-center">
                <Badge variant={salesTargetPercentage >= 100 ? "default" : "secondary"}>
                  {salesTargetPercentage}% Complete
                </Badge>
                <span className="text-sm text-gray-600">
                  ₹{(dashboardData.summary.salesTarget - dashboardData.summary.salesAchieved).toLocaleString()} remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Tabs defaultValue="sales-trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales-trends">Sales Trends</TabsTrigger>
            <TabsTrigger value="category-breakdown">Category Breakdown</TabsTrigger>
            <TabsTrigger value="sales-vs-purchases">Sales vs Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="sales-trends">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales Trends</CardTitle>
                <CardDescription>
                  Sales performance and target comparison over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dashboardData.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} name="Sales" />
                    <Line type="monotone" dataKey="target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="category-breakdown">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>
                  Distribution of sales across different product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-4">
                    {dashboardData.categoryData.map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{category.sales.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{category.value}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-vs-purchases">
            <Card>
              <CardHeader>
                <CardTitle>Sales vs Purchases</CardTitle>
                <CardDescription>
                  Monthly comparison between sales and purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dashboardData.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Bar dataKey="sales" fill="#10B981" name="Sales" />
                    <Bar dataKey="purchases" fill="#3B82F6" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest customer orders and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order ID</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">#{order.id}</td>
                      <td className="p-2">{order.customer}</td>
                      <td className="p-2 font-semibold">₹{order.amount.toLocaleString()}</td>
                      <td className="p-2">
                        <Badge 
                          variant={
                            order.status === 'Completed' ? 'default' :
                            order.status === 'Processing' ? 'secondary' :
                            order.status === 'Shipped' ? 'outline' : 'destructive'
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm text-gray-600">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-16 flex flex-col space-y-2">
                <Package className="w-6 h-6" />
                <span>Generate Bill</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col space-y-2">
                <ShoppingCart className="w-6 h-6" />
                <span>Place Order</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col space-y-2">
                <Package className="w-6 h-6" />
                <span>Maintain Stock</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
