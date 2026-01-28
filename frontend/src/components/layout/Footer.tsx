import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 w-full">
      <div className="w-full max-w-[100vw] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-10 sm:py-12 md:py-16 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 place-items-start">
          <div className="space-y-4 w-full max-w-sm">
            <h3 className="text-lg font-bold text-primary">FixedPrice Scotland</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The clever, modern solution for Scottish real estate. Transparency, fixed prices, and data-driven success.
            </p>
          </div>
          <div className="w-full">
            <h4 className="font-semibold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/listings" className="text-muted-foreground hover:text-primary transition-colors">Browse Listings</Link></li>
              <li><Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing Plans</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link></li>
            </ul>
          </div>
          <div className="w-full">
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/listings" className="text-muted-foreground hover:text-primary transition-colors">Listings</Link></li>
              <li><Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div className="w-full">
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/about#disclaimer" className="text-muted-foreground hover:text-primary transition-colors">Disclaimers</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 sm:mt-12 pt-8 border-t flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4 text-center sm:text-left">
          <p className="text-xs text-muted-foreground order-2 sm:order-1">
            © 2026 FixedPrice Scotland. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground max-w-xl order-1 sm:order-2">
            Disclaimer: Property classifications and success probabilities are indicative and based on historical data. Always perform your own due diligence.
          </p>
        </div>
      </div>
    </footer>
  );
}
