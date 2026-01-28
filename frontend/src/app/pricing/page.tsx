'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  X, 
  Info, 
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Mail,
  Search,
  MapPin,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type PlanType = 'buyer_monthly' | 'buyer_yearly' | 'agent_verification';

interface Plan {
  id: PlanType | 'free';
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  badge?: string;
  features: {
    included: string[];
    excluded?: string[];
  };
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Public Access',
    description: 'Free property browsing for everyone',
    monthlyPrice: 0,
    features: {
      included: [
        'Browse Fixed Price listings',
        'Basic area & postcode filters',
        'View Explicit Fixed Price properties',
        'Link to original listings',
        'Mobile-responsive access'
      ],
      excluded: [
        'Likely Fixed Price classifications',
        'Success probability scores',
        'Saved searches',
        'Email alerts',
        'Advanced filters'
      ]
    },
    cta: 'Get Started Free'
  },
  {
    id: 'buyer_monthly',
    name: 'Buyer Premium',
    description: 'Everything serious buyers need',
    monthlyPrice: 9.99,
    yearlyPrice: 95.90, // 12 * monthly with 20% discount
    badge: 'Most Popular',
    popular: true,
    features: {
      included: [
        'Everything in Public Access',
        'Full access to Likely Fixed Price AI classifications',
        'Detailed Postcode Success Probabilities (High/Medium/Low)',
        'Unlimited saved searches',
        'Instant email alerts for new matches',
        'Advanced budget & area filters',
        'Priority access to "Back to Market" properties',
        'Success probability explanations'
      ]
    },
    cta: 'Subscribe Now'
  },
  {
    id: 'agent_verification',
    name: 'Verified Agent',
    description: 'Boost your listing visibility',
    monthlyPrice: 29.99,
    yearlyPrice: 287.90, // 12 * monthly with 20% discount
    features: {
      included: [
        'Everything in Buyer Premium',
        'Verified badge on all your listings',
        'Boosted placement in search results',
        'Agent dashboard & analytics',
        'Direct branding on listing cards',
        'Priority customer support',
        'Market insights & trends'
      ]
    },
    cta: 'Register as Agent'
  }
];

const featureComparison = [
  {
    category: 'Property Access',
    features: [
      { name: 'Browse Fixed Price Listings', free: true, premium: true, agent: true },
      { name: 'Explicit Fixed Price Only', free: true, premium: true, agent: true },
      { name: 'Likely Fixed Price (AI Classified)', free: false, premium: true, agent: true },
      { name: 'Link to Original Listings', free: true, premium: true, agent: true },
    ]
  },
  {
    category: 'Intelligence & Analysis',
    features: [
      { name: 'Basic Area Filters', free: true, premium: true, agent: true },
      { name: 'Success Probability Scores', free: false, premium: true, agent: true },
      { name: 'Postcode Sale History Analysis', free: false, premium: true, agent: true },
      { name: 'Wasted Viewing Eliminator', free: false, premium: true, agent: true },
      { name: 'AI Classification Explanations', free: false, premium: true, agent: true },
    ]
  },
  {
    category: 'Saved Searches & Alerts',
    features: [
      { name: 'Save Search Criteria', free: false, premium: true, agent: true },
      { name: 'Email Alerts for New Matches', free: false, premium: true, agent: true },
      { name: 'Unlimited Saved Searches', free: false, premium: true, agent: true },
      { name: 'Price Change Notifications', free: false, premium: true, agent: true },
      { name: '"Back to Market" Alerts', free: false, premium: true, agent: true },
    ]
  },
  {
    category: 'Agent Features',
    features: [
      { name: 'Verified Badge', free: false, premium: false, agent: true },
      { name: 'Boosted Listing Placement', free: false, premium: false, agent: true },
      { name: 'Agent Dashboard', free: false, premium: false, agent: true },
      { name: 'Listing Analytics', free: false, premium: false, agent: true },
      { name: 'Market Insights', free: false, premium: false, agent: true },
    ]
  }
];

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role to filter plans
  useEffect(() => {
    if (user) {
      apiClient.get<{ role?: string }>('/users/me')
        .then((res) => setUserRole(res.data?.role || null))
        .catch(() => setUserRole(null));
    } else {
      setUserRole(null);
    }
  }, [user]);

  const handleSubscribe = (planId: PlanType) => {
    if (!user) {
      toast.info('Please sign in to subscribe', {
        description: 'Redirecting to login...',
      });
      router.push(`/auth/login?redirect=/checkout?plan=${planId}`);
      return;
    }

    // Prevent buyers from subscribing to agent plans
    if (userRole === 'buyer' && planId === 'agent_verification') {
      toast.error('Buyers cannot subscribe to agent plans', {
        description: 'Please choose a buyer plan instead.',
      });
      return;
    }

    // Redirect to checkout page
    router.push(`/checkout?plan=${planId}`);
  };

  // Filter plans based on user role - buyers can't see agent plans
  const availablePlans = userRole === 'buyer' 
    ? plans.filter(plan => plan.id !== 'agent_verification')
    : plans;

  const getPrice = (plan: Plan) => {
    if (plan.id === 'free') return 0;
    if (billingCycle === 'yearly' && plan.yearlyPrice) {
      return plan.yearlyPrice;
    }
    return plan.monthlyPrice;
  };

  const getYearlySavings = (plan: Plan) => {
    if (!plan.yearlyPrice) return null;
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="flex flex-col gap-16 pb-20 pt-8">
      {/* Header */}
      <section className="container max-w-4xl mx-auto px-4 text-center space-y-6">
        <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary bg-primary/5">
          Transparent Pricing
        </Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Choose Your Plan
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Start free, upgrade when you're serious about finding your home. No hidden fees, cancel anytime.
        </p>

        {/* Billing Toggle - no duplicate labels */}
        <div className="flex justify-center pt-4">
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
            <TabsList className="h-11">
              <TabsTrigger value="monthly" className="px-6">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="px-6">
                Yearly <Badge variant="secondary" className="ml-2 text-[10px]">20% off</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Payment info above cards so it's clear before clicking any subscription button */}
      <section className="container max-w-6xl mx-auto px-4 flex justify-center">
        <div className="w-full max-w-5xl p-4 md:p-6 rounded-xl bg-muted/50 border border-border flex gap-4 items-start">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Payment Information</p>
            <p>
              <strong>Stripe card payments are launching soon.</strong> For now, choosing a paid plan sends an invoice to your email for bank transfer. Your subscription is activated within 24 hours of payment confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards - centered */}
      <section className="container max-w-6xl mx-auto px-4 flex justify-center">
        <div className={`grid grid-cols-1 ${availablePlans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 w-full max-w-5xl`}>
          {availablePlans.map((plan) => {
            const price = getPrice(plan);
            const savings = getYearlySavings(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`flex flex-col relative ${plan.popular ? 'border-primary shadow-2xl scale-105 z-10' : 'border-muted-foreground/10'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold tracking-widest rounded-full uppercase">
                    {plan.badge}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">£{price.toFixed(2)}</span>
                      {plan.id !== 'free' && (
                        <span className="text-muted-foreground">
                          /{billingCycle === 'yearly' ? 'year' : 'mo'}
                        </span>
                      )}
                    </div>
                    {savings && billingCycle === 'yearly' && (
                      <p className="text-sm text-primary font-medium mt-2">
                        Save £{savings.amount.toFixed(2)} ({savings.percentage}% off)
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <ul className="space-y-3">
                    {plan.features.included.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.features.excluded?.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground/50 line-through">
                        <X className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {plan.id === 'free' ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/auth/signup">{plan.cta}</Link>
                    </Button>
                  ) : (
                    <>
                      <Button 
                        className={`w-full py-6 ${plan.popular ? '' : ''}`}
                        onClick={() => handleSubscribe(plan.id as PlanType)}
                      >
                        {plan.cta}
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Invoice by email · Bank transfer
                      </p>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container max-w-6xl mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Feature Comparison</h2>
          <p className="text-muted-foreground">
            See exactly what's included in each plan
          </p>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Public Access</th>
                  <th className="text-center p-4 font-semibold bg-primary/5">Buyer Premium</th>
                  <th className="text-center p-4 font-semibold">Verified Agent</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((category, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-muted/10">
                      <td colSpan={4} className="p-3 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featIdx) => (
                      <tr key={featIdx} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4 text-sm">{feature.name}</td>
                        <td className="p-4 text-center">
                          {feature.free ? (
                            <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center bg-primary/5">
                          {feature.premium ? (
                            <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {feature.agent ? (
                            <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container max-w-3xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Everything you need to know about our pricing
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Can I cancel my subscription anytime?</AccordionTrigger>
            <AccordionContent>
              Yes, absolutely. You can cancel your subscription at any time from your account dashboard. Your access will continue until the end of your current billing period, and you won't be charged again.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
            <AccordionContent>
              Currently, we accept bank transfers. An invoice with payment details will be sent to your email. Stripe card payments (credit/debit cards) are launching soon and will be available for all plans.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>What's the difference between "Explicit" and "Likely" Fixed Price?</AccordionTrigger>
            <AccordionContent>
              <strong>Explicit Fixed Price</strong> properties clearly state "Fixed Price £X" or similar unambiguous language. <strong>Likely Fixed Price</strong> properties are identified by our AI as having buyer-friendly language (e.g., "Offers Over £X (Fixed Price Considered)") but require Buyer Premium to access. Both are verified through our GPT-4 classification system.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>How does the "Success Probability" feature work?</AccordionTrigger>
            <AccordionContent>
              We analyze historical sale data for each postcode. If similar homes in that area historically sell more than 10% above asking price, we flag it as "Low chance" and exclude it from results. This helps you avoid wasted viewings on properties you can't realistically secure at the listed price.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Do you offer yearly subscriptions?</AccordionTrigger>
            <AccordionContent>
              Yes. Yearly billing is available with 20% off the monthly total (12 months × monthly price). Choose the &quot;Yearly&quot; tab above to see the discounted price.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>Is there a free trial for paid plans?</AccordionTrigger>
            <AccordionContent>
              Public Access is completely free forever. For paid plans, we're currently in development and offering bank transfer invoicing. Once Stripe integration is complete, we'll introduce a 7-day free trial for Buyer Premium.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="container max-w-4xl mx-auto px-4">
        <div className="bg-primary/5 rounded-[3rem] p-12 md:p-24 text-center space-y-8 border border-primary/10">
          <h2 className="text-3xl md:text-5xl font-bold">Ready to find your home?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of Scots who are skipping the bidding wars and finding fixed-price properties with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/20" asChild>
              <Link href="/auth/signup">Start Free Today</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full" asChild>
              <Link href="/listings">Browse Listings First</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
