import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Shield, Users, Package, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // OTP verification removed - direct authentication

  // Redirect if already authenticated
  if (user) {
    setTimeout(() => setLocation("/"), 0);
    return null;
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await registerMutation.mutateAsync({
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        fullName: formData.get("fullName") as string,
        phone: formData.get("phone") as string,
      });

      toast({
        title: "Registration Successful!",
        description: "Welcome to Rentiverse! You're now logged in.",
      });
      
      // User is automatically logged in after registration
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // OTP verification functions removed - direct authentication

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await loginMutation.mutateAsync({
        username: formData.get("username") as string,
        password: formData.get("password") as string,
      });
      
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // OTP verification UI removed - direct authentication

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Auth Forms */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Rentiverse</h1>
            <p className="mt-2 text-muted-foreground">
              Your trusted rental management platform
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="data-[state=active]:bg-renti-teal data-[state=active]:text-white">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-renti-teal data-[state=active]:text-white">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        name="username"
                        type="text"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-renti-teal hover:bg-renti-teal/90 text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    
                    <div className="space-y-2 text-center text-sm">
                      <button
                        type="button"
                        onClick={() => setLocation("/forgot-password")}
                        className="text-renti-teal hover:text-renti-teal/80 font-medium"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join Rentiverse and start renting today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          placeholder="johndoe"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Create a strong password"
                        minLength={6}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-renti-teal hover:bg-renti-teal/90 text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-renti-teal via-renti-navy to-renti-gray text-white p-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Welcome to Rentiverse
            </h2>
            <p className="text-teal-100 text-lg leading-relaxed">
              Your comprehensive rental management platform. Browse products, manage orders, 
              and track your rentals all in one seamless experience.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Extensive Catalog</h3>
                <p className="text-teal-100 text-sm">
                  Browse thousands of quality products across multiple categories
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Easy Booking</h3>
                <p className="text-teal-100 text-sm">
                  Simple rental process with instant booking confirmation
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Payments</h3>
                <p className="text-teal-100 text-sm">
                  Safe and reliable payment processing with Razorpay
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Order Tracking</h3>
                <p className="text-teal-100 text-sm">
                  Real-time updates on your rental status and history
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-white/10 rounded-lg border border-white/20">
            <p className="text-sm text-teal-100">
              "Using Rentiverse for our equipment needs has been amazing. The platform 
              is intuitive and the rental process is incredibly smooth."
            </p>
            <div className="mt-3">
              <p className="font-semibold">Michael Chen</p>
              <p className="text-xs text-teal-200">Event Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}