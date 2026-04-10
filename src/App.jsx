import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { I18nProvider } from '@/lib/i18n';

// Layouts
import CustomerLayout from '@/components/layout/CustomerLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// Customer pages
import Home from '@/pages/customer/Home';
import RestaurantDetail from '@/pages/customer/RestaurantDetail';
import RestaurantEditor from '@/pages/editor/RestaurantEditor';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminRestaurants from '@/pages/admin/AdminRestaurants';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminMeals from '@/pages/admin/AdminMeals';
import AdminNews from '@/pages/admin/AdminNews';



const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Customer routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:slug" element={<RestaurantDetail />} />
        <Route path="/:slug/editor" element={<RestaurantEditor />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/restaurants" element={<AdminRestaurants />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/meals" element={<AdminMeals />} />
        <Route path="/admin/events" element={<AdminNews />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <I18nProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </I18nProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App