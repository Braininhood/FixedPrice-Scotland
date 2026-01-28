'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Target,
  ShieldCheck,
  Sparkles,
  MapPin,
  Heart,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-col gap-16">
        {/* Hero */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            About FixedPrice Scotland
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We help Scottish home buyers find properties they can actually afford—
            by focusing on Fixed Price and genuinely achievable listings.
          </p>
        </section>

        {/* Mission */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Our Mission
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Most portals are built around &quot;Offers Over&quot; and bidding wars. We believe
            buyers deserve clarity: which homes are marketed at a fixed price, and
            which areas and listings are most likely to sell at or near that price.
            FixedPrice Scotland uses AI to classify listings and local data to give
            you an honest view of your chances—so you can spend time on homes you
            can actually secure.
          </p>
        </section>

        {/* How it works */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            How It Works
          </h2>
          <ul className="grid gap-4 sm:grid-cols-1">
            {[
              'We aggregate fixed price and clearly priced listings from trusted sources across Scotland.',
              'AI classifies each listing (Explicit Fixed Price, Likely Fixed Price, or Competitive) so you know what you’re looking at.',
              'Subscribers get postcode-level success probabilities and email alerts when new fixed price homes match their search.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Values */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            What We Stand For
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Transparency
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                We never hide behind &quot;Offers Over&quot; ambiguity. You see the asking
                price and we tell you how likely it is that a property will sell at
                or near that price in your area.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Scotland-Focused
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Our data and postcode stats are built for Scottish markets—from
                Edinburgh and Glasgow to Aberdeen, Dundee, and beyond.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Disclaimer */}
        <section id="disclaimer" className="space-y-4 pt-8 border-t">
          <h2 className="text-xl font-semibold">Disclaimer</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            FixedPrice Scotland aggregates and classifies property listings from third-party sources for information only.
            We do not guarantee accuracy of pricing or availability. Always verify details with the listing agent or portal
            before making any decision. We are not responsible for content on external sites we link to.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center pt-4">
          <p className="text-muted-foreground mb-6">
            Ready to find your fixed price home?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href="/listings">
                Browse listings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
