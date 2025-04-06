import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import HowItWorks from "@/pages/how-it-works";
import FAQs from "@/pages/faqs";
import Contact from "@/pages/contact";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  const [location] = useLocation();
  const showHeaderFooter = !location.startsWith("/auth") && !location.startsWith("/admin");

  return (
    <>
      {showHeaderFooter && <Header />}
      <main className={`flex-grow ${showHeaderFooter ? 'container mx-auto px-4 py-6 md:py-8' : ''}`}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/faqs" component={FAQs} />
          <Route path="/contact" component={Contact} />
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/admin" component={AdminPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {showHeaderFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
