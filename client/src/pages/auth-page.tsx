import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ServiceIcon } from "@/lib/icons";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  if (user) {
    return <Redirect to="/admin" />;
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/")}
          >
            Go to Home
          </Button>
        </div>

        <div className="text-center space-y">
          <h1 className="text-xl font-semibold text-gray-800">
            <ServiceIcon name="price-tag-3" className="text-primary text-2xl" />
            DiscountFinder
          </h1>

          <p className="text-muted-foreground">
            Find the best credit card offers for different services. Admin login
            required to manage offers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter your administrator credentials to manage offers
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLoginSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      username: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      password: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="mt-12 w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow">
        <h3 className="text-xl font-bold mb-2">Security Note</h3>
        <p>
          This admin portal is protected and requires authentication. Only
          authorized personnel can access it.
        </p>
      </div>
    </div>
  );
}
