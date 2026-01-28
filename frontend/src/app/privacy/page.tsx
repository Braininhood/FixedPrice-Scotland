'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <CardDescription>Last updated: January 25, 2026</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              FixedPrice Scotland ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">Personal Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li>Name and email address</li>
                  <li>Account credentials</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Property search preferences and saved searches</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Usage Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We automatically collect information about your interaction with our platform, including:
                </p>
                <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent</li>
                  <li>Search queries and filters used</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use your information to:
            </p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
              <li>Provide and maintain our services</li>
              <li>Process your transactions and subscriptions</li>
              <li>Send you property alerts based on your saved searches</li>
              <li>Improve our platform and develop new features</li>
              <li>Communicate with you about updates, offers, and support</li>
              <li>Detect and prevent fraud and abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform (e.g., Supabase for authentication, Stripe for payments)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your information, including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside ml-4 text-muted-foreground space-y-1">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience. You can control cookies through your browser settings, but some features may not function properly if you disable them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for users under 18 years of age. We do not knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Email:</strong> privacy@fixedpricescotland.com<br />
              <strong>Address:</strong> FixedPrice Scotland Ltd, Edinburgh, Scotland
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
