'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  X, 
  Info, 
  Mail,
  CreditCard,
  Building2,
  ArrowLeft,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';

type PlanType = 'buyer_monthly' | 'buyer_yearly' | 'agent_verification';

interface PlanDetails {
  id: PlanType;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'month' | 'year';
}

const planDetails: Record<PlanType, PlanDetails> = {
  buyer_monthly: {
    id: 'buyer_monthly',
    name: 'Buyer Premium',
    description: 'Everything serious buyers need',
    price: 9.99,
    billingPeriod: 'month'
  },
  buyer_yearly: {
    id: 'buyer_yearly',
    name: 'Buyer Premium (Yearly)',
    description: 'Everything serious buyers need - Save 17%',
    price: 99.99,
    billingPeriod: 'year'
  },
  agent_verification: {
    id: 'agent_verification',
    name: 'Verified Agent',
    description: 'Boost your listing visibility',
    price: 29.99,
    billingPeriod: 'month'
  }
};

// Bank transfer details (these should match the email template)
const bankDetails = {
  accountName: 'FixedPrice Scotland Ltd',
  sortCode: '00-00-00',
  accountNumber: '12345678',
  // Reference will be generated based on user
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role
  useEffect(() => {
    if (user) {
      apiClient.get<{ role?: string }>('/users/me')
        .then((res) => setUserRole(res.data?.role || null))
        .catch(() => setUserRole(null));
    }
  }, [user]);

  useEffect(() => {
    const plan = searchParams.get('plan') as PlanType;
    if (plan && (plan === 'buyer_monthly' || plan === 'buyer_yearly' || plan === 'agent_verification')) {
      // Prevent buyers from subscribing to agent plans
      if (userRole === 'buyer' && plan === 'agent_verification') {
        toast.error('Buyers cannot subscribe to agent plans', {
          description: 'Redirecting to pricing page...',
        });
        router.push('/pricing');
        return;
      }
      setPlanType(plan);
    } else {
      toast.error('Invalid plan selected', {
        description: 'Redirecting to pricing page...',
      });
      router.push('/pricing');
    }
  }, [searchParams, router, userRole]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.info('Please sign in to continue', {
        description: 'Redirecting to login...',
      });
      router.push(`/auth/login?redirect=/checkout?plan=${planType}`);
    }
  }, [user, authLoading, router, planType]);

  const handleCheckout = async () => {
    if (!planType || !user) return;

    setIsProcessing(true);
    try {
      const response = await apiClient.post('/subscriptions/subscribe', null, {
        params: { plan_type: planType }
      });

      // Get payment reference from API response (matches email)
      const ref = response.data.payment_reference || 
        `SUB-${user.email?.substring(0, 2).toUpperCase() || 'FP'}${planType.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-6)}`;
      setPaymentReference(ref);

      setIsSuccess(true);
      toast.success('Invoice sent!', {
        description: 'Please check your email for payment instructions.',
        duration: 5000,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to process subscription';
      toast.error('Checkout Error', {
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (!planType) {
    return null; // Will redirect
  }

  const plan = planDetails[planType];

  if (isSuccess) {
    return (
      <div className="container max-w-3xl mx-auto py-12">
        <Card className="border-primary shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Invoice Sent Successfully!</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a detailed invoice to <strong>{user.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Next Steps
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Check your email inbox (and spam folder) for the invoice</li>
                <li>Review the bank transfer details in the email</li>
                <li>Complete the bank transfer using the provided details</li>
                <li>Your subscription will be activated within 24 hours of payment confirmation</li>
              </ol>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Bank Transfer Details
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-primary/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Name:</span>
                  <span className="font-medium">{bankDetails.accountName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sort Code:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{bankDetails.sortCode}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(bankDetails.sortCode)}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{bankDetails.accountNumber}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(bankDetails.accountNumber)}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Payment Reference:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono text-primary">{paymentReference}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(paymentReference)}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg text-primary">£{plan.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Important:</p>
                <p>
                  Please include the payment reference when making your transfer. This ensures we can quickly match your payment and activate your subscription.
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground pt-2">
              Your subscription status will appear on your Account page (pending until payment is confirmed).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/pricing">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Pricing
                </Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/account">
                  Go to Account – view subscription status
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/pricing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {plan.billingPeriod === 'year' ? 'Yearly' : 'Monthly'} Billing
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">£{plan.price.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    per {plan.billingPeriod}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary">£{plan.price.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.billingPeriod === 'year' 
                    ? 'Billed annually. Cancel anytime.' 
                    : 'Billed monthly. Cancel anytime.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>How you'll pay for your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <div className="font-semibold">Bank Transfer</div>
                    <div className="text-sm text-muted-foreground">
                      Invoice will be sent to your email
                    </div>
                  </div>
                  <Badge>Current</Badge>
                </div>
              </div>

              <div className="border rounded-lg p-4 opacity-50">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-semibold text-muted-foreground">Card Payment</div>
                    <div className="text-sm text-muted-foreground">
                      Coming soon via Stripe
                    </div>
                  </div>
                  <Badge variant="secondary">Soon</Badge>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click "Complete Order" below</li>
                    <li>We'll send an invoice to <strong>{user.email}</strong></li>
                    <li>Complete the bank transfer using the details in the email</li>
                    <li>Your subscription activates within 24 hours</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Complete Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="font-medium">
                    {plan.billingPeriod === 'year' ? 'Yearly' : 'Monthly'}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">£{plan.price.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full py-6 text-base" 
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete Order'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By completing your order, you agree to our Terms of Service and Privacy Policy.
              </p>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Cancel anytime from your account</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>No hidden fees or charges</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Secure payment processing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
