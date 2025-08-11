import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const searchParams = window.location.search;
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(searchParams);
    const resetToken = urlParams.get('token');
    
    if (resetToken) {
      setToken(resetToken);
      // Validate token
      validateToken(resetToken);
    } else {
      toast({ 
        title: "Invalid reset link", 
        description: "The password reset link is invalid or missing",
        variant: "destructive" 
      });
      setLocation("/forgot-password");
    }
  }, [searchParams, navigate, toast]);

  const validateToken = async (resetToken: string) => {
    try {
      const response = await apiRequest('POST', '/api/validate-reset-token', { token: resetToken });
      if (response.ok) {
        setIsValidToken(true);
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      toast({ 
        title: "Invalid or expired link", 
        description: "This password reset link is invalid or has expired",
        variant: "destructive" 
      });
      setLocation("/forgot-password");
    }
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      const response = await apiRequest('POST', '/api/reset-password', { 
        token, 
        newPassword 
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({ 
        title: "Password reset successful", 
        description: "Your password has been updated successfully" 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Password reset failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (passwords.newPassword.length < 6) {
      toast({ 
        title: "Password too short", 
        description: "Password must be at least 6 characters long",
        variant: "destructive" 
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ 
        title: "Passwords don't match", 
        description: "Please make sure both password fields match",
        variant: "destructive" 
      });
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: passwords.newPassword
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-renti-navy">Password Reset Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              
              <Button 
                onClick={() => setLocation("/auth")}
                className="w-full bg-renti-teal hover:bg-renti-teal/90"
              >
                Continue to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating Reset Link...</h2>
              <p className="text-gray-600">Please wait while we verify your password reset link.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-renti-navy">Reset Your Password</CardTitle>
            <p className="text-gray-600 mt-2">
              Enter your new password below
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your new password must be at least 6 characters long and contain a mix of letters and numbers for better security.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full bg-renti-teal hover:bg-renti-teal/90"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}