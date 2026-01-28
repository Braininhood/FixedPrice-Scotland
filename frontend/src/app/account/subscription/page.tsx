'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  X, 
  Info, 
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';

interface Subscription {
  id: string;
  plan_type: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'pending';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  description?: string;
  created_at: string;
}

const planNames: Record<string, string> = {
  buyer_monthly: 'Buyer Premium (Monthly)',
  buyer_yearly: 'Buyer Premium (Yearly)',
  agent_verification: 'Verified Agent',
};

const planPrices: Record<string, number> = {
  buyer_monthly: 9.99,
  buyer_yearly: 99.99,
  agent_verification: 29.99,
};

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelImmediately, setCancelImmediately] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/account/subscription');
      return;
    }

    if (user) {
      fetchSubscriptionData();
    }
  }, [user, authLoading, router]);

  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const [subResponse, paymentsResponse] = await Promise.all([
        apiClient.get('/subscriptions/me'),
        apiClient.get('/subscriptions/payments').catch(() => ({ data: { payments: [] } }))
      ]);

      if (subResponse.data && typeof subResponse.data === 'object' && subResponse.data.status && subResponse.data.status !== 'inactive') {
        setSubscription(subResponse.data as Subscription);
      } else {
        setSubscription(null);
      }

      setPayments(paymentsResponse.data.payments || []);
    } catch (error: any) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      await apiClient.post('/subscriptions/cancel', null, {
        params: { cancel_immediately: cancelImmediately }
      });

      toast.success('Subscription canceled', {
        description: cancelImmediately 
          ? 'Your subscription has been canceled immediately.' 
          : 'Your subscription will remain active until the end of the current billing period.',
      });

      setCancelDialogOpen(false);
      await fetchSubscriptionData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to cancel subscription';
      toast.error('Cancel Error', {
        description: errorMessage,
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="secondary">Canceling at period end</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Canceled</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'trialing':
        return <Badge variant="secondary">Trial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </div>
              {subscription && (
                <Button variant="outline" size="sm" onClick={fetchSubscriptionData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Plan</div>
                    <div className="text-lg font-semibold">
                      {planNames[subscription.plan_type] || subscription.plan_type}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      £{planPrices[subscription.plan_type]?.toFixed(2) || '0.00'} / 
                      {subscription.plan_type.includes('yearly') ? 'year' : 'month'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <div className="mb-2">
                      {getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
                    </div>
                  </div>
                </div>

                {subscription.status === 'pending' && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
                    <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Invoice sent</p>
                      <p>Your subscription will activate within 24 hours of payment confirmation. Check your email for bank transfer details.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Current Period
                    </div>
                    <div className="text-sm">
                      {subscription.current_period_start && subscription.current_period_end
                        ? `${formatDate(subscription.current_period_start)} - ${formatDate(subscription.current_period_end)}`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Requested</div>
                    <div className="text-sm">
                      {formatDate(subscription.created_at)}
                    </div>
                  </div>
                </div>

                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                  <div className="pt-4 border-t">
                    <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel Subscription
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Subscription</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel your subscription?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="cancel-end"
                              name="cancel-type"
                              checked={!cancelImmediately}
                              onChange={() => setCancelImmediately(false)}
                              className="h-4 w-4"
                            />
                            <label htmlFor="cancel-end" className="text-sm font-medium cursor-pointer">
                              Cancel at period end (Recommended)
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">
                            Your subscription will remain active until {formatDate(subscription.current_period_end)}. 
                            You'll continue to have access to all features until then.
                          </p>

                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="cancel-now"
                              name="cancel-type"
                              checked={cancelImmediately}
                              onChange={() => setCancelImmediately(true)}
                              className="h-4 w-4"
                            />
                            <label htmlFor="cancel-now" className="text-sm font-medium cursor-pointer">
                              Cancel immediately
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">
                            Your subscription will be canceled immediately. You'll lose access to premium features right away.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Keep Subscription
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleCancel}
                            disabled={isCanceling}
                          >
                            {isCanceling ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Canceling...
                              </>
                            ) : (
                              'Confirm Cancellation'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {subscription.cancel_at_period_end && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex gap-3 items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                        Subscription will cancel on {formatDate(subscription.current_period_end)}
                      </p>
                      <p className="text-yellow-800 dark:text-yellow-200">
                        Your subscription is set to cancel at the end of the current billing period. 
                        You'll continue to have access until then.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Info className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You're currently on the free plan. Upgrade to unlock premium features.
                  </p>
                  <Button asChild>
                    <Link href="/pricing">View Plans</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>How you pay for your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <div className="font-semibold">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">
                        Payments are processed via bank transfer
                      </div>
                    </div>
                    <Badge>Active</Badge>
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
                    <p className="font-semibold text-foreground mb-1">Note:</p>
                    <p>
                      Card payments are launching soon. Currently, all subscriptions are managed via bank transfer. 
                      When Stripe integration is complete, you'll be able to update your payment method here.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No payment method on file. Add a payment method when you subscribe to a plan.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View all your past transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell>
                          {payment.description || 'Subscription payment'}
                        </TableCell>
                        <TableCell>
                          £{payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.payment_method === 'bank_transfer' ? (
                              <>
                                <Building2 className="h-3 w-3 mr-1" />
                                Bank Transfer
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-3 w-3 mr-1" />
                                Card
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payment history found.</p>
                {!subscription && (
                  <p className="mt-2">
                    <Link href="/pricing" className="text-primary hover:underline">
                      Subscribe to a plan
                    </Link> to see your payment history here.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
