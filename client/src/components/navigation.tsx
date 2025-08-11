import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/context/CartContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const { user, logoutMutation } = useAuth();
  const { getItemCount } = useCart();

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications', { unreadOnly: true }],
  });

  const unreadCount = Array.isArray(notifications) ? notifications.length : 0;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center space-x-3">
            <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'}>
              <div className="flex items-center space-x-3 cursor-pointer">
                <Logo />
                {user?.role === 'admin' && (
                  <Badge className="bg-renti-amber text-renti-navy">
                    ADMIN
                  </Badge>
                )}
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Cart for customers */}
            {user?.role === 'customer' && (
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <i className="fas fa-shopping-cart text-xl"></i>
                  {getItemCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-renti-amber text-renti-navy text-xs w-5 h-5 flex items-center justify-center p-0">
                      {getItemCount()}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <i className="fas fa-bell text-xl"></i>
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-renti-teal text-white text-sm">
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    {user?.fullName || user?.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <i className="fas fa-user mr-2"></i>
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <i className="fas fa-cog mr-2"></i>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
