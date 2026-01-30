'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  CheckCircle2,
  TrendingUp,
  Target,
  ArrowRight,
  MapPin,
  Zap,
  ShieldCheck,
  Filter,
  Info
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

export default function Home() {
  const [location, setLocation] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [confidence, setConfidence] = useState<string[]>(['Explicit', 'Likely']);

  const toggleConfidence = (value: string) => {
    setConfidence((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    );
  };

  // Map homepage confidence to listings page param: explicit | explicit_and_likely | all
  const confidenceParam = useMemo(() => {
    if (confidence.length === 0) return 'all';
    if (confidence.length === 2) return 'explicit_and_likely';
    return confidence.includes('Explicit') ? 'explicit' : 'explicit_and_likely';
  }, [confidence]);

  // Build /listings URL with current filter values (same params as listings page uses)
  const listingsUrl = useMemo(() => {
    const params = new URLSearchParams();
    const loc = location.trim();
    if (loc) params.set('city', loc);
    if (maxBudget.trim()) params.set('max_budget', maxBudget.trim());
    if (confidenceParam && confidenceParam !== 'all') params.set('confidence', confidenceParam);
    const q = params.toString();
    return q ? `/listings?${q}` : '/listings';
  }, [location, maxBudget, confidenceParam]);

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
            <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary bg-primary/5">
              The #1 Discovery Tool for Fixed Price Homes
            </Badge>
            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Tired of <span className="text-destructive/80 italic">"Offers Over"</span>? <br />
              Find Your Home for a <span className="text-primary">Fixed Price</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Portal filters show you properties you <strong>can't</strong> afford. <br className="hidden md:block" />
              FixedPrice Scotland shows you the ones you <strong>actually can</strong> buy.
            </p>
            
            {/* Advanced Filter Hero Search */}
            <div className="w-full max-w-3xl bg-background rounded-2xl shadow-xl border p-2 flex flex-col md:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Edinburgh, G12, Aberdeen..."
                  className="pl-10 h-12 border-none focus-visible:ring-0 text-base"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-label="Location"
                />
              </div>
              <div className="h-8 w-px bg-border hidden md:block" />
              <div className="relative flex-1 w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">£</span>
                <Input
                  type="number"
                  placeholder="Max Budget"
                  className="pl-7 h-12 border-none focus-visible:ring-0 text-base"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  aria-label="Max Budget"
                />
              </div>
              <div className="h-8 w-px bg-border hidden md:block" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-12 px-4 gap-2 text-muted-foreground font-normal hover:bg-muted">
                    <Filter className="h-4 w-4" />
                    <span>Confidence</span>
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                      {confidence.length}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Classification Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem 
                    checked={confidence.includes("Explicit")}
                    onCheckedChange={() => toggleConfidence("Explicit")}
                  >
                    Explicitly Fixed Price
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={confidence.includes("Likely")}
                    onCheckedChange={() => toggleConfidence("Likely")}
                  >
                    Likely Fixed Price
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <div className="p-2 text-[10px] text-muted-foreground flex gap-1 items-start leading-tight">
                    <Info className="h-3 w-3 shrink-0" />
                    <span>We use AI to analyze descriptions and identify hidden fixed prices.</span>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="lg" className="h-12 px-8 w-full md:w-auto shadow-lg shadow-primary/20" asChild>
                <Link href={listingsUrl}>Show Properties</Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm text-muted-foreground font-medium pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No Blind Bidding
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Verified Asking Prices
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Links to Original Source
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-[150px]" />
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="container max-w-5xl mx-auto px-4">
        <div className="bg-muted/30 rounded-3xl p-8 md:p-12 border border-primary/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold leading-tight">The "Show me properties I can actually buy" tool.</h2>
              <p className="text-muted-foreground leading-relaxed">
                In Scotland, "Offers Over" prices are opaque. Buyers routinely view homes they can't realistically afford because they don't know the final sale behavior in that area.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium">We act as a classification layer on top of existing listings.</p>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium">We do not compete with portals; we filter them for you.</p>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Every listing links back to ESPC, Rightmove, or Zoopla.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-primary/10 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Classification Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Trust is built through confidence, not claims. We label properties as <strong>Explicit</strong> (Fixed Price £X) or <strong>Likely</strong> (Seller willing to consider) using GPT-4 analysis.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/10 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Wasted Viewing Eliminator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We analyze postcode sale history. If homes in your area historically sell &gt;10% over ask, we warn you before you book that viewing.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - centered card */}
      <section className="container max-w-5xl mx-auto px-4 py-12">
        <Card className="border-primary/20 bg-card overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-5xl font-bold">The Clever, Modern Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                How we find the properties that major portals bury deep in their search results.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">1</div>
                <h3 className="text-xl font-bold">Ingest & Analyze</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We pull metadata from across ESPC, Rightmove, and Agent sites. Our AI reads descriptions to find hidden &quot;Fixed Price&quot; gems.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">2</div>
                <h3 className="text-xl font-bold">Success Probability</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We compare asking prices with historical sale behavior in that specific postcode to give you a High, Medium, or Low chance of success.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">3</div>
                <h3 className="text-xl font-bold">Direct Access</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Found your home? We provide the direct link to the listing agent. No middleman, just transparent, data-driven property discovery.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pricing Section */}
      <section className="container max-w-5xl mx-auto px-4 py-12">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Serious about buying? Unlock advanced postcode stats and instant email alerts.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <Card className="flex flex-col border-muted-foreground/10">
            <CardHeader>
              <CardTitle>Public Access</CardTitle>
              <CardDescription>Free property browsing</CardDescription>
              <div className="text-4xl font-bold mt-4">£0</div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Browse Fixed Price listings
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Basic area filters
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground/40 italic">
                  Advanced success probability
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground/40 italic">
                  Saved searches & email alerts
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Monthly Plan */}
          <Card className="flex flex-col border-primary relative shadow-2xl scale-105 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold tracking-widest rounded-full uppercase">
              Serious Buyers
            </div>
            <CardHeader>
              <CardTitle>Buyer Premium</CardTitle>
              <CardDescription>Master the Scottish market</CardDescription>
              <div className="text-4xl font-bold mt-4">£9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Full access to <strong>Likely Fixed Price</strong> AI classifications
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Detailed Postcode Success probabilities
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Unlimited saved searches & instant alerts
                </li>
                <li className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Be the first to see "Back to Market" homes
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full py-6" asChild>
                <Link href="/auth/signup">Subscribe Now</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Agent Plan */}
          <Card className="flex flex-col border-muted-foreground/10">
            <CardHeader>
              <CardTitle>Verified Agent</CardTitle>
              <CardDescription>Increase your listing exposure</CardDescription>
              <div className="text-4xl font-bold mt-4">£29.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Verified Badge on all listings
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Boosted placement in search results
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Agent dashboard & leads analytics
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Direct branding on listing cards
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/auth/signup">Register as Agent</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="mt-12 p-4 rounded-xl bg-muted/50 border border-border flex gap-3 items-center justify-center max-w-2xl mx-auto">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong>Development Note:</strong> Stripe card payments are launching soon. Currently, selecting a plan will generate an invoice for bank transfer sent to your registered email.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container max-w-4xl mx-auto px-4">
        <div className="bg-primary/5 rounded-[3rem] p-12 md:p-24 text-center space-y-8 border border-primary/10">
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight">Stop Bidding. <br className="md:hidden" /> Start Buying.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The data exists. The fixed prices exist. We just put them in one place for you. Create your free account today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/20" asChild>
              <Link href="/auth/signup">Join FixedPrice Scotland</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full" asChild>
              <Link href="/listings">Explore Active Listings</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
