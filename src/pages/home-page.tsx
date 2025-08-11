import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setLocation('/admin');
      } else {
        setLocation('/dashboard');
      }
    }
  }, [user, setLocation]);

  const handleGetStarted = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo />
              <div>
                <h1 className="text-xl font-bold text-renti-navy">RENTIVERSE</h1>
                <p className="text-xs text-gray-600">Why Buy? Just Rent It!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/auth')}
                className="text-renti-gray hover:text-renti-teal"
              >
                Login
              </Button>
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-renti-teal hover:bg-renti-teal/90 text-white"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-renti-navy to-renti-teal text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                Streamline Your Rental Business
              </h2>
              <p className="text-xl mb-8 text-gray-100">
                Complete rental management solution from product browsing to returns. 
                Manage inventory, bookings, payments, and customer relationships all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGetStarted}
                  className="bg-renti-amber hover:bg-amber-500 text-renti-navy px-8 py-3 rounded-lg font-semibold text-lg"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline"
                  className="border border-white text-white hover:bg-white hover:text-renti-navy px-8 py-3 rounded-lg font-semibold text-lg"
                >
                  View Demo
                </Button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-semibold mb-6">Key Features</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-calendar-check text-renti-amber"></i>
                  <span>Smart Availability Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fas fa-credit-card text-renti-amber"></i>
                  <span>Integrated Payment Processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fas fa-bell text-renti-amber"></i>
                  <span>Automated Notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fas fa-chart-line text-renti-amber"></i>
                  <span>Comprehensive Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-renti-navy mb-4">
              Everything You Need to Manage Rentals
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for rental businesses of all sizes
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-renti-teal rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-boxes text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-renti-navy">Product Management</h3>
              <p className="text-gray-600">
                Configure rental products with flexible duration options, pricing rules, and availability tracking.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-renti-teal rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-shopping-cart text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-renti-navy">Order Processing</h3>
              <p className="text-gray-600">
                Streamlined workflow from quotation to return with automated status tracking and updates.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-renti-teal rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-users text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-renti-navy">Customer Portal</h3>
              <p className="text-gray-600">
                Self-service portal for customers to browse, book, track rentals, and manage their account.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
