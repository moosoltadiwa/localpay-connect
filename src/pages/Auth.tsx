import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, User, Zap, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    rememberMe: false,
  });

  useEffect(() => {
    setIsSignup(searchParams.get("mode") === "signup");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignup) {
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
        return;
      }
      if (!formData.agreeTerms) {
        toast({
          title: "Terms required",
          description: "Please agree to the terms and conditions.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Account created!",
        description: "Welcome to ZimBoost. You can now log in.",
      });
    } else {
      toast({
        title: "Login successful!",
        description: "Welcome back to ZimBoost.",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>{isSignup ? "Sign Up" : "Sign In"} - ZimBoost SMM Panel</title>
        <meta
          name="description"
          content={isSignup 
            ? "Create your free ZimBoost account and start growing your social media today."
            : "Sign in to your ZimBoost account to manage your orders and grow your social media."
          }
        />
      </Helmet>

      <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="glass-card rounded-2xl p-8 shadow-lg">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">ZimBoost</span>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {isSignup ? "Create Your Account" : "Welcome Back"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isSignup
                  ? "Start growing your social media today"
                  : "Sign in to access your dashboard"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 h-12 bg-background border-border"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 bg-background border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 h-12 bg-background border-border"
                      required
                    />
                  </div>
                </div>
              )}

              {isSignup ? (
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, agreeTerms: checked as boolean })
                    }
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-tight">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, rememberMe: checked as boolean })
                      }
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button type="submit" variant="hero" className="w-full h-12">
                {isSignup ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <Link
                  to={isSignup ? "/auth" : "/auth?mode=signup"}
                  className="text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  {isSignup ? "Sign in" : "Sign up"}
                </Link>
              </p>
            </div>

            {/* Payment Methods */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Secure payments powered by
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="px-4 py-2 bg-secondary rounded-lg">
                  <span className="font-bold text-sm text-foreground">PayNow</span>
                </div>
                <div className="px-4 py-2 bg-secondary rounded-lg">
                  <span className="font-bold text-sm text-foreground">EcoCash</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
