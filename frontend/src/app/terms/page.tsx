'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <CardDescription>Last updated: January 25, 2026</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using FixedPrice Scotland ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              FixedPrice Scotland is a property listing platform that helps users identify fixed-price properties in Scotland using AI-powered classification. We aggregate listings from various sources and provide analysis tools to help buyers make informed decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activity under your account</li>
                <li>Not share your account with others</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Subscription Plans</h2>
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                We offer various subscription plans with different features and pricing:
              </p>
              <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                <li>Free access includes basic listing browsing</li>
                <li>Paid subscriptions provide advanced filters, analytics, and alerts</li>
                <li>Subscriptions auto-renew unless canceled</li>
                <li>Cancellations take effect at the end of the current billing period</li>
                <li>Refunds are provided in accordance with our refund policy</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
              <li>Use the Platform for any illegal purpose</li>
              <li>Scrape, copy, or reproduce listing data without permission</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Platform's operation</li>
              <li>Impersonate others or provide false information</li>
              <li>Use automated tools (bots, scrapers) without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data and Classifications</h2>
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                <strong>Important Disclaimers:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                <li>Property classifications and success probabilities are indicative only</li>
                <li>AI classifications may not be 100% accurate</li>
                <li>Historical data may not predict future outcomes</li>
                <li>Always perform your own due diligence before making any property decisions</li>
                <li>We are not responsible for decisions made based on our analysis</li>
                <li>Listings are aggregated from third-party sources and may contain errors</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, features, and functionality on the Platform (excluding third-party listings) are owned by FixedPrice Scotland and protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Links and Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Platform contains links to third-party websites and displays listings from external sources. We are not responsible for the content, accuracy, or practices of third-party sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, FixedPrice Scotland shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or opportunities arising from your use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Warranty Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Platform is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. Upon termination, your right to use the Platform will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of Scotland and the United Kingdom. Any disputes shall be resolved in the courts of Scotland.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Email:</strong> legal@fixedpricescotland.com<br />
              <strong>Address:</strong> FixedPrice Scotland Ltd, Edinburgh, Scotland
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
