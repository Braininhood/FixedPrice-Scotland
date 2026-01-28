'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Search,
  Bell,
  Settings,
  Edit,
  Save,
  X,
  Loader2,
  TrendingUp,
  Home,
  MapPin,
  PoundSterling,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Shield,
  Users,
  Building2,
  DollarSign,
  BarChart3,
  FileText,
  Database,
  Activity,
  ArrowUp,
  LineChart,
  Lock,
  ExternalLink
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient, { checkApiHealth, getApiErrorMessage } from '@/lib/api/client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  max_budget?: number;
  postcode?: string;
  city?: string;
  region?: string;
  confidence_level?: string;
  is_active: boolean;
  last_notified_at?: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at?: string;
}

const planNames: Record<string, string> = {
  buyer_monthly: 'Buyer Premium',
  buyer_yearly: 'Buyer Premium (Yearly)',
  agent_verification: 'Verified Agent',
};

interface FeatureItemProps {
  name: string;
  hasAccess: boolean;
  icon: React.ComponentType<{ className?: string }>;
  upgradeNeeded?: boolean;
}

function FeatureItem({ name, hasAccess, icon: Icon, upgradeNeeded }: FeatureItemProps) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${hasAccess ? 'bg-muted/30' : 'bg-muted/10 opacity-60'}`}>
      {hasAccess ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className={`text-sm flex-1 ${hasAccess ? '' : 'text-muted-foreground'}`}>{name}</span>
      {upgradeNeeded && (
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
          <Link href="/pricing">Upgrade</Link>
        </Button>
      )}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
  });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [updatingRoleForId, setUpdatingRoleForId] = useState<string | null>(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/account');
      return;
    }

    if (user) {
      fetchAccountData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      setAdminUsersLoading(true);
      apiClient.get<{ users: AdminUser[] }>('/users/')
        .then((res) => setAdminUsers(res.data.users ?? []))
        .catch((error: any) => {
          const status = error.response?.status;
          const detail = error.response?.data?.detail;
          
          if (status === 403) {
            // 403 means user profile is missing or not admin in database
            toast.error('Admin Access Required', {
              description: detail || 'Your account needs admin privileges in the database. Check ONE-LAST-FIX.md',
            });
          } else {
            toast.error('Failed to load users', {
              description: detail || 'Could not fetch user list',
            });
          }
        })
        .finally(() => setAdminUsersLoading(false));
    } else {
      setAdminUsers([]);
    }
  }, [profile?.role]);

  const fetchAccountData = async () => {
    setIsLoading(true);
    setApiUnreachable(false);
    try {
      const [profileResponse, subResponse, searchesResponse] = await Promise.all([
        apiClient.get('/users/me'),
        apiClient.get('/subscriptions/me').catch(() => ({ data: { status: 'inactive' } })),
        apiClient.get('/users/saved-searches').catch(() => ({ data: { searches: [] } }))
      ]);

      setProfile(profileResponse.data);
      setEditForm({
        full_name: profileResponse.data.full_name || '',
        phone: profileResponse.data.phone || '',
      });

      if (subResponse.data && typeof subResponse.data === 'object' && subResponse.data.status && subResponse.data.status !== 'inactive') {
        setSubscription(subResponse.data as Subscription);
      } else {
        setSubscription(null);
      }

      setSavedSearches(searchesResponse.data.searches || []);
    } catch (error: unknown) {
      const err = error as { code?: string; response?: unknown };
      const isNetworkError = err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !err.response;
      if (isNetworkError) {
        const health = await checkApiHealth();
        setApiUnreachable(!health.ok);
        if (!health.ok) {
          toast.error('Backend unreachable', {
            description: 'Start the API with: cd backend && python main.py',
            action: { label: 'Retry', onClick: () => fetchAccountData() },
          });
        } else {
          toast.error('Request failed. Try again.', { action: { label: 'Retry', onClick: () => fetchAccountData() } });
        }
      } else {
        toast.error('Failed to load account data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.put('/users/me', editForm);
      setProfile(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update profile';
      toast.error('Update Error', {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    setUpdatingRoleForId(userId);
    try {
      await apiClient.patch(`/users/${userId}/role`, { role });
      setAdminUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(getApiErrorMessage(err.response?.data?.detail, 'Failed to update role'));
    } finally {
      setUpdatingRoleForId(null);
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

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      buyer: 'bg-blue-500',
      seller: 'bg-green-500',
      agent: 'bg-purple-500',
      admin: 'bg-red-500',
    };
    return (
      <Badge className={roleColors[role] || 'bg-gray-500'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const hasActiveSubscription = subscription && subscription.status === 'active';
  const isVerifiedAgent = profile?.role === 'agent' && subscription?.plan_type === 'agent_verification' && subscription?.status === 'active';
  const isAgentWithoutSubscription = profile?.role === 'agent' && (!subscription || subscription.plan_type !== 'agent_verification' || subscription.status !== 'active');
  const isVerifiedBuyer = profile?.role === 'buyer' && (subscription?.plan_type === 'buyer_monthly' || subscription?.plan_type === 'buyer_yearly') && subscription?.status === 'active';
  const isBuyerWithoutSubscription = profile?.role === 'buyer' && (!subscription || subscription.plan_type !== 'buyer_monthly' && subscription?.plan_type !== 'buyer_yearly' || subscription.status !== 'active');
  const memberSince = profile ? formatDate(profile.created_at) : 'N/A';

  return (
    <div className="container max-w-6xl mx-auto py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold">Account Dashboard</h1>
          {profile?.role === 'admin' && (
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <Shield className="h-3 w-3 mr-1" />
              Administrator
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {profile?.role === 'admin' 
            ? 'Full system access - manage users, listings, subscriptions, and all platform features'
            : 'Manage your profile, subscription, and saved searches'}
        </p>
      </div>

      {/* Backend unreachable banner */}
      {apiUnreachable && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Backend unreachable</p>
                <p className="text-sm text-muted-foreground">
                  Start the API from the project root: <code className="rounded bg-muted px-1">cd backend && python main.py</code>
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchAccountData()}>
              Retry connection
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Your personal account details</CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+44 7XXX XXXXXX"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        full_name: profile?.full_name || '',
                        phone: profile?.phone || '',
                      });
                    }}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <div className="font-medium">{profile?.email || user?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </div>
                      <div className="font-medium">{profile?.full_name || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </div>
                      <div className="font-medium">{profile?.phone || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Member Since
                      </div>
                      <div className="font-medium">{memberSince}</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-1">Account Role</div>
                    {getRoleBadge(profile?.role || 'buyer')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Status
              </CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-semibold text-lg">
                        {planNames[subscription.plan_type] || subscription.plan_type}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {subscription.status === 'active' ? (
                          subscription.cancel_at_period_end ? (
                            `Cancels on ${formatDate(subscription.current_period_end)}`
                          ) : (
                            `Renews on ${formatDate(subscription.current_period_end)}`
                          )
                        ) : subscription.status === 'pending' ? (
                          'Invoice sent to your email. Your plan will activate within 24 hours of payment confirmation.'
                        ) : (
                          `Status: ${subscription.status}`
                        )}
                      </div>
                    </div>
                    <Badge className={
                      subscription.status === 'active' ? 'bg-green-500' :
                      subscription.status === 'pending' ? 'bg-amber-500' : 'bg-gray-500'
                    }>
                      {subscription.status === 'pending' ? 'Pending' : subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href="/account/subscription">
                        {subscription.status === 'pending' ? 'View subscription status' : 'Manage Subscription'}
                      </Link>
                    </Button>
                    {subscription.status === 'active' && (
                      <Button variant="outline" className="flex-1" asChild>
                        <Link href="/pricing">
                          Upgrade Plan
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">No Active Subscription</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Unlock premium features with a subscription plan
                    </p>
                    <Button asChild>
                      <Link href="/pricing">View Plans</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin: Open professional admin panel */}
          {profile?.role === 'admin' && (
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  Admin panel
                </CardTitle>
                <CardDescription>
                  Manage users, listings, and subscriptions from one place with data tables and full CRUD.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg">
                  <Link href="/admin">
                    Open Admin Panel
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Agent: Manage listings (add/edit with photos) */}
          {profile?.role === 'agent' && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Manage listings
                </CardTitle>
                <CardDescription>
                  Add and edit property listings and upload photos from your computer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg">
                  <Link href="/admin/listings">
                    Open Listings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Agent: Features based on subscription status */}
          {profile?.role === 'agent' && (
            <Card className={isVerifiedAgent ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5' : 'border-muted'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Agent Features
                    </CardTitle>
                    <CardDescription>
                      {isVerifiedAgent 
                        ? 'Full access to all Verified Agent features'
                        : 'Upgrade to Verified Agent for premium features'}
                    </CardDescription>
                  </div>
                  {isVerifiedAgent ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified Agent
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Access */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Property Access
                  </h3>
                  <div className="space-y-2">
                    <FeatureItem 
                      name="Browse Fixed Price Listings" 
                      hasAccess={true} 
                      icon={Home}
                    />
                    <FeatureItem 
                      name="Explicit Fixed Price Only" 
                      hasAccess={true} 
                      icon={CheckCircle2}
                    />
                    <FeatureItem 
                      name="Likely Fixed Price (AI Classified)" 
                      hasAccess={isVerifiedAgent} 
                      icon={Sparkles}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Link to Original Listings" 
                      hasAccess={true} 
                      icon={ExternalLink}
                    />
                  </div>
                </div>

                {/* Intelligence & Analysis */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Intelligence & Analysis
                  </h3>
                  <div className="space-y-2">
                    <FeatureItem 
                      name="Basic Area Filters" 
                      hasAccess={true} 
                      icon={MapPin}
                    />
                    <FeatureItem 
                      name="Success Probability Scores" 
                      hasAccess={isVerifiedAgent} 
                      icon={TrendingUp}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Postcode Sale History Analysis" 
                      hasAccess={isVerifiedAgent} 
                      icon={BarChart3}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Wasted Viewing Eliminator" 
                      hasAccess={isVerifiedAgent} 
                      icon={Activity}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="AI Classification Explanations" 
                      hasAccess={isVerifiedAgent} 
                      icon={Sparkles}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                  </div>
                </div>

                {/* Saved Searches & Alerts */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Saved Searches & Alerts
                  </h3>
                  <div className="space-y-2">
                    <FeatureItem 
                      name="Save Search Criteria" 
                      hasAccess={isVerifiedAgent} 
                      icon={Search}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Email Alerts for New Matches" 
                      hasAccess={isVerifiedAgent} 
                      icon={Mail}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Unlimited Saved Searches" 
                      hasAccess={isVerifiedAgent} 
                      icon={Database}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Price Change Notifications" 
                      hasAccess={isVerifiedAgent} 
                      icon={Bell}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name='"Back to Market" Alerts' 
                      hasAccess={isVerifiedAgent} 
                      icon={Activity}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                  </div>
                </div>

                {/* Agent Features */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Agent Features
                  </h3>
                  <div className="space-y-2">
                    <FeatureItem 
                      name="Verified Badge" 
                      hasAccess={isVerifiedAgent} 
                      icon={CheckCircle2}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Boosted Listing Placement" 
                      hasAccess={isVerifiedAgent} 
                      icon={ArrowUp}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Agent Dashboard" 
                      hasAccess={isVerifiedAgent} 
                      icon={BarChart3}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Listing Analytics" 
                      hasAccess={isVerifiedAgent} 
                      icon={LineChart}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                    <FeatureItem 
                      name="Market Insights" 
                      hasAccess={isVerifiedAgent} 
                      icon={TrendingUp}
                      upgradeNeeded={!isVerifiedAgent}
                    />
                  </div>
                </div>

                {isVerifiedAgent ? (
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin/listings">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Dashboard & Analytics
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <Button className="w-full" asChild>
                      <Link href="/pricing">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Upgrade to Verified Agent
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Unlock all premium features with Verified Agent subscription
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Buyer: Premium Features */}
          {profile?.role === 'buyer' && (
            <Card className={isVerifiedBuyer ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5' : 'border-muted'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Buyer Features
                    </CardTitle>
                    <CardDescription>
                      {isVerifiedBuyer 
                        ? 'Full access to all Premium Buyer features'
                        : 'Upgrade to Premium Buyer for advanced features'}
                    </CardDescription>
                  </div>
                  {isVerifiedBuyer ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Premium Buyer
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Free Account
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Access */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Property Access
                  </h3>
                  <div className="space-y-2">
                    <FeatureItem 
                      name="Browse Fixed Price Listings" 
                      hasAccess={true} 
                      icon={Home}
                    />
                    <FeatureItem 
                      name="Explicit Fixed Price Only" 
                      hasAccess={true} 
                      icon={CheckCircle2}
                    />
                    <FeatureItem 
                      name="Likely Fixed Price (AI Classified)" 
                      hasAccess={isVerifiedBuyer} 
                      icon={Sparkles}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                    <FeatureItem 
                      name="Link to Original Listings" 
                      hasAccess={true} 
                      icon={ExternalLink}
                    />
                  </div>
                </div>

                {/* Intelligence & Analysis */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Intelligence & Analysis
                  </h3>
                  <div className="space-y-2">
                    <FeatureItem 
                      name="Basic Area Filters" 
                      hasAccess={true} 
                      icon={MapPin}
                    />
                    <FeatureItem 
                      name="Success Probability Scores" 
                      hasAccess={isVerifiedBuyer} 
                      icon={TrendingUp}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                    <FeatureItem 
                      name="Postcode Sale History Analysis" 
                      hasAccess={isVerifiedBuyer} 
                      icon={BarChart3}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                    <FeatureItem 
                      name="Wasted Viewing Eliminator" 
                      hasAccess={isVerifiedBuyer} 
                      icon={Activity}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                    <FeatureItem 
                      name="AI Classification Explanations" 
                      hasAccess={isVerifiedBuyer} 
                      icon={Sparkles}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                  </div>
                </div>

                {/* Saved Searches & Alerts */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Saved Searches & Alerts
                  </h3>
                  <div className="space-y-2">
                    <FeatureItem 
                      name="Save Search Criteria" 
                      hasAccess={isVerifiedBuyer} 
                      icon={Search}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                    <FeatureItem 
                      name="Email Alerts for New Matches" 
                      hasAccess={isVerifiedBuyer} 
                      icon={Mail}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                    <FeatureItem 
                      name="Unlimited Saved Searches" 
                      hasAccess={isVerifiedBuyer} 
                      icon={Database}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                    <FeatureItem 
                      name="Price Change Notifications" 
                      hasAccess={isVerifiedBuyer} 
                      icon={Bell}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                    <FeatureItem 
                      name='"Back to Market" Alerts' 
                      hasAccess={isVerifiedBuyer} 
                      icon={Activity}
                      upgradeNeeded={!isVerifiedBuyer}
                    />
                  </div>
                </div>

                {isVerifiedBuyer ? (
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/listings">
                        <Search className="h-4 w-4 mr-2" />
                        Browse Premium Listings
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t">
                    <Button className="w-full" asChild>
                      <Link href="/pricing">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Upgrade to Premium Buyer
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Unlock all premium features with Buyer Premium subscription
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin: User management (quick access; full management in /admin) */}
          {profile?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  User management
                </CardTitle>
                <CardDescription>Change user roles here or use the Admin Panel for full management.</CardDescription>
              </CardHeader>
              <CardContent>
                {adminUsersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">No Users Found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Either no users exist yet, or there was an error loading them. Check the browser console for details.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>{u.full_name || '—'}</TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={u.role}
                              onValueChange={(value) => handleSetRole(u.id, value)}
                              disabled={updatingRoleForId === u.id}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="buyer">Buyer</SelectItem>
                              </SelectContent>
                            </Select>
                            {updatingRoleForId === u.id && (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Saved Searches */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Saved Searches
                  </CardTitle>
                  <CardDescription>
                    {hasActiveSubscription 
                      ? 'Your saved property searches with email alerts'
                      : 'Subscribe to save searches and get email alerts'}
                  </CardDescription>
                </div>
                {hasActiveSubscription && (
                  <Button size="sm" asChild>
                    <Link href="/account/saved-searches">
                      <Plus className="h-4 w-4 mr-2" />
                      New Search
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hasActiveSubscription ? (
                savedSearches.length > 0 ? (
                  <div className="space-y-3">
                    {savedSearches.slice(0, 3).map((search) => (
                      <div key={search.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {search.name}
                            {search.is_active ? (
                              <Badge variant="secondary" className="text-xs">
                                <Bell className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Paused</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-3">
                            {search.max_budget && (
                              <span className="flex items-center gap-1">
                                <PoundSterling className="h-3 w-3" />
                                Up to £{search.max_budget.toLocaleString()}
                              </span>
                            )}
                            {search.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {search.city}
                              </span>
                            )}
                            {search.postcode && (
                              <span className="flex items-center gap-1">
                                <Home className="h-3 w-3" />
                                {search.postcode}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/listings?${new URLSearchParams({
                            ...(search.max_budget && { max_budget: search.max_budget.toString() }),
                            ...(search.postcode && { postcode: search.postcode }),
                            ...(search.city && { city: search.city }),
                          }).toString()}`}>
                            <Search className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    {savedSearches.length > 3 && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/account/saved-searches">
                          View All ({savedSearches.length} searches)
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">No Saved Searches Yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Save your property search criteria to get instant email alerts when new matches are found.
                      </p>
                      <Button asChild>
                        <Link href="/listings">Start Searching</Link>
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center space-y-4">
                  <Sparkles className="h-12 w-12 mx-auto text-primary opacity-50" />
                  <div>
                    <h3 className="font-semibold mb-2">Unlock Saved Searches</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Subscribe to Buyer Premium to save unlimited searches and receive instant email alerts for new properties.
                    </p>
                    <Button asChild>
                      <Link href="/pricing">Upgrade Now</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.role === 'admin' ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Total Users
                    </div>
                    <div className="font-semibold">{adminUsers.length}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Admin Accounts
                    </div>
                    <div className="font-semibold">
                      {adminUsers.filter(u => u.role === 'admin').length}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Verified Agents
                    </div>
                    <div className="font-semibold">
                      {adminUsers.filter(u => u.role === 'agent').length}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </div>
                    <div className="font-semibold text-sm">
                      {new Date(profile?.created_at || '').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Search className="h-4 w-4" />
                      Saved Searches
                    </div>
                    <div className="font-semibold">
                      {hasActiveSubscription ? savedSearches.length : '—'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bell className="h-4 w-4" />
                      Active Alerts
                    </div>
                    <div className="font-semibold">
                      {hasActiveSubscription 
                        ? savedSearches.filter(s => s.is_active).length 
                        : '—'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </div>
                    <div className="font-semibold text-sm">
                      {new Date(profile?.created_at || '').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/listings">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Properties
                </Link>
              </Button>
              
              {profile?.role === 'admin' && (
                <>
                  <Button variant="outline" className="w-full justify-start border-primary/50" asChild>
                    <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
                      <Activity className="mr-2 h-4 w-4 text-primary" />
                      API Docs
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-primary/50" asChild>
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <Database className="mr-2 h-4 w-4 text-primary" />
                      Database
                    </a>
                  </Button>
                </>
              )}
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/account/subscription">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Link>
              </Button>
              {hasActiveSubscription && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/account/saved-searches">
                    <Bell className="mr-2 h-4 w-4" />
                    Saved Searches
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/pricing">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {hasActiveSubscription ? 'Upgrade Plan' : 'View Plans'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/account/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
