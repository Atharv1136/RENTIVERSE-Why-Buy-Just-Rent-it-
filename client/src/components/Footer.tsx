import { Heart, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-renti-navy text-white mt-12">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-renti-teal">Rentiverse</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted rental management platform. Streamline your business with our comprehensive solution.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Heart className="h-4 w-4 text-red-400" />
              <span>Made with care for rental businesses</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-renti-teal transition-colors">Dashboard</a></li>
              <li><a href="#" className="hover:text-renti-teal transition-colors">Products</a></li>
              <li><a href="#" className="hover:text-renti-teal transition-colors">Orders</a></li>
              <li><a href="#" className="hover:text-renti-teal transition-colors">Analytics</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-renti-teal transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-renti-teal transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-renti-teal transition-colors">Contact Support</a></li>
              <li><a href="#" className="hover:text-renti-teal transition-colors">Community</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contact</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-renti-teal" />
                <span>support@rentiverse.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-renti-teal" />
                <span>91+ 9860385314</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-renti-teal" />
                <span>Pune, Maharashtra, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © 2025 Rentiverse. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-renti-teal transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-renti-teal transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-renti-teal transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}