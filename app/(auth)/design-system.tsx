import React, { useEffect, useMemo, useState } from 'react';
import { Animated, ScrollView, View, Text, SafeAreaView, Pressable, Switch, Modal } from 'react-native';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Input from '../../src/components/ui/Input';
import { Search, User, Package } from 'lucide-react-native';
import { Stack } from 'expo-router';

export default function DesignSystemScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: true, title: 'Design System Showcase' }} />
      <ScrollView className="flex-1 p-6">
        
        {/* Colors & Theming */}
        <Section title="Colors & Theming">
          <View className="flex-row flex-wrap gap-4">
            <ColorBlock color="bg-primary" label="Primary (Customer/Staff)" />
            <ColorBlock color="bg-success" label="Success" />
            <ColorBlock color="bg-warning" label="Warning" />
            <ColorBlock color="bg-danger" label="Danger" />
          </View>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <Text className="text-3xl font-outfit-bold text-slate-900 mb-2">Outfit Bold (Heading)</Text>
          <Text className="text-xl font-outfit text-slate-700 mb-4">Outfit Regular (Sub-heading)</Text>
          <Text className="text-base font-inter-bold text-slate-900">Inter Bold (Action/Small Label)</Text>
          <Text className="text-base font-inter-medium text-slate-700">Inter Medium (Body Strong)</Text>
          <Text className="text-base font-inter text-slate-600">Inter Regular (Body Copy)</Text>
        </Section>

        {/* Buttons */}
        <Section title="Buttons (with Haptics)">
          <View className="gap-y-4">
            <Button label="Primary Solid" variant="solid" />
            <Button label="Primary Outline" variant="outline" />
            <Button label="Ghost Button" variant="ghost" />
            <Button label="Loading State" loading />
            <Button label="Staff Mode Press" hapticVariant="medium" className="bg-blue-600" />
          </View>
        </Section>

        {/* Badges */}
        <Section title="Badges (Status Tags)">
          <View className="flex-row flex-wrap gap-2">
            <Badge label="Pending" variant="neutral" />
            <Badge label="Picking" variant="warning" />
            <Badge label="Assigned" variant="info" />
            <Badge label="Delivered" variant="success" />
            <Badge label="Cancelled" variant="danger" />
          </View>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <Card className="mb-4">
            <View className="flex-row items-center">
              <Package size={24} color="#22C55E" />
              <View className="ml-3 flex-1">
                <Text className="font-outfit-bold text-lg">Premium Grocery Pack</Text>
                <Text className="text-slate-500">Fresh organic vegetables delivered daily.</Text>
              </View>
              <Badge label="New" variant="success" />
            </View>
          </Card>
          <Card variant="outline">
            <Text className="font-inter-medium italic text-slate-500 text-center">Outline style card for secondary info.</Text>
          </Card>
        </Section>

        {/* Inputs */}
        <Section title="Inputs & Search">
          <Input 
            label="Full Name" 
            placeholder="Enter your name" 
            icon={<User size={20} color="#94A3B8" />} 
          />
          <Input 
            label="Search Products" 
            placeholder="Apple, Milk, Bread..." 
            icon={<Search size={20} color="#94A3B8" />} 
          />
          <Input 
            label="Email Address" 
            value="invalid-email" 
            error="Please enter a valid email address" 
          />
        </Section>

        <Section title="P0 Release Readiness Dashboard">
          <P0ReleaseReadinessDashboard />
        </Section>

        <Section title="Architecture Map (G1)">
          <ArchitectureMap />
        </Section>

        <Section title="Optimistic Sync Visualizer">
          <OptimisticSyncVisualizer />
        </Section>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <Text className="text-xs font-inter-bold text-slate-400 uppercase tracking-widest mb-4">
        {title}
      </Text>
      {children}
    </View>
  );
}

function ColorBlock({ color, label }: { color: string, label: string }) {
  return (
    <View className="items-center w-32">
      <View className={`w-full h-16 rounded-xl ${color} shadow-sm mb-2`} />
      <Text className="text-xs text-center text-slate-600 font-inter-medium">{label}</Text>
    </View>
  );
}

type P0GateId =
  | 'api_state_ready'
  | 'staff_p0'
  | 'customer_p0'
  | 'lint_green'
  | 'regression_pass'
  | 'release_ready';

type P0Gate = {
  id: P0GateId;
  title: string;
  critical: boolean;
  summary: string;
};

const P0_GATES: P0Gate[] = [
  { id: 'api_state_ready', title: 'API/State Production Ready', critical: true, summary: 'React Query + optimistic + error/401/403 behavior' },
  { id: 'staff_p0', title: 'Staff P0 Completion (A0–A4)', critical: true, summary: 'Fulfillment: dashboard → picking → packing → complete' },
  { id: 'customer_p0', title: 'Customer P0 Completion (B0–B3)', critical: true, summary: 'Products + cart + checkout + orders' },
  { id: 'lint_green', title: 'Lint & Typecheck Green', critical: true, summary: 'CI quality gates always pass' },
  { id: 'regression_pass', title: 'Regression P0 Pass', critical: true, summary: 'Manual scripted E0/E1/E2 pass' },
  { id: 'release_ready', title: 'Release Ready', critical: true, summary: 'Env + EAS build + staged rollout + rollback rules' },
];

type P0ChecklistItemId =
  | 'a0_client'
  | 'a1_dashboard'
  | 'a2_detail'
  | 'a3_picking'
  | 'a4_packing'
  | 'b0_nav'
  | 'b1_products'
  | 'b2_cart_server'
  | 'b3_checkout_orders'
  | 'q_lint'
  | 'q_regression'
  | 'q_release';

type P0ChecklistItem = {
  id: P0ChecklistItemId;
  title: string;
  group: 'API/State' | 'Staff' | 'Customer' | 'Gates';
};

const P0_CHECKLIST: P0ChecklistItem[] = [
  { id: 'a0_client', title: 'A0: API client + error handling + refresh', group: 'API/State' },
  { id: 'a1_dashboard', title: 'A1: Staff dashboard filter/sort/SLA + refetch', group: 'Staff' },
  { id: 'a2_detail', title: 'A2: Staff order detail guards + retry + disable actions', group: 'Staff' },
  { id: 'a3_picking', title: 'A3: Picking scan-to-unlock + item progress sync', group: 'Staff' },
  { id: 'a4_packing', title: 'A4: Packing upload proof + update status + navigation', group: 'Staff' },
  { id: 'b0_nav', title: 'B0: Customer tabs + route guard (role)', group: 'Customer' },
  { id: 'b1_products', title: 'B1: Products list/search/detail from backend', group: 'Customer' },
  { id: 'b2_cart_server', title: 'B2: Cart server state (GET/POST/PATCH/DELETE /me/cart)', group: 'Customer' },
  { id: 'b3_checkout_orders', title: 'B3: Checkout + orders list/detail from backend', group: 'Customer' },
  { id: 'q_lint', title: 'Gates: lint + typecheck always green', group: 'Gates' },
  { id: 'q_regression', title: 'Gates: regression P0 pass (scripted)', group: 'Gates' },
  { id: 'q_release', title: 'Gates: EAS build + rollout + rollback ready', group: 'Gates' },
];

function P0ReleaseReadinessDashboard() {
  const [gateState, setGateState] = useState<Record<P0GateId, boolean>>(() => {
    const initial: Partial<Record<P0GateId, boolean>> = {};
    P0_GATES.forEach((g) => {
      initial[g.id] = false;
    });
    return initial as Record<P0GateId, boolean>;
  });

  const [checkState, setCheckState] = useState<Record<P0ChecklistItemId, boolean>>(() => {
    const initial: Partial<Record<P0ChecklistItemId, boolean>> = {};
    P0_CHECKLIST.forEach((c) => {
      initial[c.id] = false;
    });
    return initial as Record<P0ChecklistItemId, boolean>;
  });

  const totals = useMemo(() => {
    const total = P0_GATES.length;
    const completed = P0_GATES.filter((g) => gateState[g.id]).length;
    const criticalTotal = P0_GATES.filter((g) => g.critical).length;
    const criticalCompleted = P0_GATES.filter((g) => g.critical && gateState[g.id]).length;
    const progress = total === 0 ? 0 : completed / total;
    const allCriticalDone = criticalCompleted === criticalTotal;
    const allDone = completed === total;
    return { total, completed, progress, criticalTotal, criticalCompleted, allCriticalDone, allDone };
  }, [gateState]);

  const goLive = useMemo(() => {
    if (totals.allDone) return { label: 'Ready for MVP Production', color: '#16A34A', tone: 'green' as const };
    if (totals.allCriticalDone) return { label: 'Pending final checks', color: '#F59E0B', tone: 'yellow' as const };
    return { label: 'Not Ready', color: '#DC2626', tone: 'red' as const };
  }, [totals.allCriticalDone, totals.allDone]);

  const [progressAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: totals.progress,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, totals.progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const progressPercent = Math.round(totals.progress * 100);

  return (
    <View className="gap-y-4">
      <Card className="p-4 border border-slate-100">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-outfit-bold text-slate-900">P0 Readiness</Text>
            <Text className="text-xs font-inter text-slate-500 mt-1">
              Theo P0 scope: Staff A0–A4 + Customer B0–B3 + functional gates. Toggle để đánh dấu hoàn tất/phê duyệt.
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-2xl font-outfit-bold text-slate-900">{progressPercent}%</Text>
            <Text className="text-[10px] font-inter-bold text-slate-400 uppercase tracking-widest">
              {totals.completed}/{totals.total}
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <View className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <Animated.View
              style={{
                width: progressWidth,
                height: '100%',
                backgroundColor: totals.allCriticalDone ? '#16A34A' : '#2563EB',
              }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-xs font-inter text-slate-500">Go-Live</Text>
            <View className="flex-row items-center">
              <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: goLive.color, marginRight: 6 }} />
              <Text style={{ color: goLive.color }} className="text-xs font-inter-bold">
                {goLive.label}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Card className="p-4 border border-slate-100">
        <Text className="text-sm font-inter-bold text-slate-800">Major Gates</Text>
        <View className="mt-3 gap-y-3">
          {P0_GATES.map((g) => (
            <P0GateToggleRow
              key={g.id}
              gate={g}
              value={gateState[g.id]}
              onChange={(next) => setGateState((s) => ({ ...s, [g.id]: next }))}
            />
          ))}
        </View>
      </Card>

      <Card className="p-4 border border-slate-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-inter-bold text-slate-800">Checklist</Text>
          <Pressable
            onPress={() => {
              const nextAll = Object.values(checkState).some((v) => !v);
              const next: Partial<Record<P0ChecklistItemId, boolean>> = {};
              P0_CHECKLIST.forEach((c) => {
                next[c.id] = nextAll;
              });
              setCheckState(next as Record<P0ChecklistItemId, boolean>);
            }}
            className="px-3 py-2 rounded-xl bg-slate-100"
          >
            <Text className="text-xs font-inter-bold text-slate-700">
              {Object.values(checkState).every((v) => v) ? 'Reset' : 'Mark all'}
            </Text>
          </Pressable>
        </View>

        <View className="mt-3 gap-y-2">
          {P0_CHECKLIST.map((c) => (
            <P0ChecklistRow
              key={c.id}
              item={c}
              checked={checkState[c.id]}
              onToggle={() => setCheckState((s) => ({ ...s, [c.id]: !s[c.id] }))}
            />
          ))}
        </View>
      </Card>
    </View>
  );
}

function P0GateToggleRow({ gate, value, onChange }: { gate: P0Gate; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-sm font-inter-bold text-slate-800">{gate.title}</Text>
        <Text className="text-xs font-inter text-slate-500 mt-0.5">{gate.summary}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
        thumbColor={value ? '#16A34A' : '#FFFFFF'}
      />
    </View>
  );
}

function P0ChecklistRow({ item, checked, onToggle }: { item: P0ChecklistItem; checked: boolean; onToggle: () => void }) {
  const badge =
    item.group === 'API/State'
      ? { label: 'API/STATE', variant: 'neutral' as const }
      : item.group === 'Staff'
        ? { label: 'STAFF', variant: 'info' as const }
        : item.group === 'Customer'
          ? { label: 'CUSTOMER', variant: 'warning' as const }
          : { label: 'GATES', variant: 'success' as const };

  return (
    <Pressable
      onPress={onToggle}
      className={`flex-row items-start rounded-xl border px-3 py-2 ${checked ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}
      hitSlop={6}
    >
      <View
        className={`mt-0.5 w-5 h-5 rounded-md border items-center justify-center ${checked ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}
      >
        {checked ? <Text className="text-white text-xs font-inter-bold">✓</Text> : null}
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm font-inter-bold ${checked ? 'text-green-800 line-through' : 'text-slate-800'}`}>{item.title}</Text>
          <Badge label={badge.label} variant={badge.variant} />
        </View>
      </View>
    </Pressable>
  );
}

type ArchitectureNodeId =
  | 'customer_ui'
  | 'staff_ui'
  | 'auth_store'
  | 'cart_store'
  | 'order_store'
  | 'api_client'
  | 'real_backend';

type ArchitectureNode = {
  id: ArchitectureNodeId;
  title: string;
  subtitle: string;
  tone: 'ui' | 'store' | 'api' | 'backend';
};

type ArchitectureEdgeId =
  | 'customer_ui_to_cart_store'
  | 'customer_ui_to_order_store'
  | 'staff_ui_to_auth_store'
  | 'staff_ui_to_order_store'
  | 'auth_store_to_api_client'
  | 'api_client_to_real_backend';

type ArchitectureEdge = {
  id: ArchitectureEdgeId;
  from: ArchitectureNodeId;
  to: ArchitectureNodeId;
  label: string;
  detailsTitle: string;
  details: Array<{ k: string; v: string }>;
};

const ARCH_NODES: ArchitectureNode[] = [
  { id: 'customer_ui', title: 'Customer UI', subtitle: 'Screens + components', tone: 'ui' },
  { id: 'staff_ui', title: 'Staff UI', subtitle: 'Screens + components', tone: 'ui' },
  { id: 'auth_store', title: 'authStore', subtitle: 'Zustand: auth state', tone: 'store' },
  { id: 'cart_store', title: 'cartStore', subtitle: 'Zustand: cart state', tone: 'store' },
  { id: 'order_store', title: 'orderStore', subtitle: 'Zustand: orders state', tone: 'store' },
  { id: 'api_client', title: 'apiClient (Axios)', subtitle: 'Interceptors: token/unwrap/refresh', tone: 'api' },
  { id: 'real_backend', title: 'Real Backend', subtitle: 'Staging/Production APIs', tone: 'backend' },
];

const ARCH_EDGES: ArchitectureEdge[] = [
  {
    id: 'customer_ui_to_cart_store',
    from: 'customer_ui',
    to: 'cart_store',
    label: 'Cart actions',
    detailsTitle: 'Cart UI → cartStore',
    details: [
      { k: 'Action', v: 'Adds/removes item' },
      { k: 'Payload', v: '{ variantId, quantity }' },
      { k: 'State', v: 'items[], subtotal/total derived' },
    ],
  },
  {
    id: 'customer_ui_to_order_store',
    from: 'customer_ui',
    to: 'order_store',
    label: 'Checkout / orders',
    detailsTitle: 'Customer UI → orderStore',
    details: [
      { k: 'Action', v: 'Creates order / loads history' },
      { k: 'Payload', v: '{ addressId, paymentMethod, note? }' },
      { k: 'Result', v: 'order list + detail state' },
    ],
  },
  {
    id: 'staff_ui_to_auth_store',
    from: 'staff_ui',
    to: 'auth_store',
    label: 'Auth context',
    detailsTitle: 'Staff UI → authStore',
    details: [
      { k: 'Reads', v: 'user.role, token' },
      { k: 'Behavior', v: 'Role guard + UI theming' },
      { k: 'Edge', v: 'Logout on 401 mapped by client' },
    ],
  },
  {
    id: 'staff_ui_to_order_store',
    from: 'staff_ui',
    to: 'order_store',
    label: 'Fulfillment flow',
    detailsTitle: 'Staff UI → orderStore',
    details: [
      { k: 'Reads', v: 'assignment list/detail (query/store)' },
      { k: 'Writes', v: 'status updates, item progress' },
      { k: 'UX', v: 'loading/error/retry states' },
    ],
  },
  {
    id: 'auth_store_to_api_client',
    from: 'auth_store',
    to: 'api_client',
    label: 'JWT',
    detailsTitle: 'authStore → apiClient (Axios)',
    details: [
      { k: 'JWT', v: 'Authorization: Bearer <token>' },
      { k: 'Refresh', v: '401 triggers refresh queue (if enabled)' },
    ],
  },
  {
    id: 'api_client_to_real_backend',
    from: 'api_client',
    to: 'real_backend',
    label: 'HTTP request',
    detailsTitle: 'apiClient → Real Backend',
    details: [
      { k: 'Transport', v: 'HTTPS (recommended)' },
      { k: 'Unwrap', v: 'ApiResponse.data if wrapped' },
      { k: 'Errors', v: '401 logout, 403 forbidden, 5xx retry/backoff' },
    ],
  },
];

function ArchitectureMap() {
  const [selectedEdge, setSelectedEdge] = useState<ArchitectureEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);

  const backendStatus = { title: 'Live Mode', subtitle: 'Traffic → Real Backend', color: '#2563EB' };

  const nodeById = useMemo(() => {
    const map = new Map<ArchitectureNodeId, ArchitectureNode>();
    ARCH_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const renderNode = (id: ArchitectureNodeId) => {
    const n = nodeById.get(id);
    if (!n) return null;

    const toneClass =
      n.tone === 'ui'
        ? 'bg-blue-50 border-blue-200'
        : n.tone === 'store'
          ? 'bg-purple-50 border-purple-200'
          : n.tone === 'api'
            ? 'bg-slate-50 border-slate-200'
            : 'bg-emerald-50 border-emerald-200';

    const activeClass = n.id === 'real_backend' ? 'border-2' : '';

    return (
      <Pressable
        key={n.id}
        onPress={() => setSelectedNode(n)}
        className={`rounded-2xl border p-3 ${toneClass} ${activeClass}`}
        hitSlop={8}
      >
        <Text className="text-sm font-inter-bold text-slate-900">{n.title}</Text>
        <Text className="text-xs font-inter text-slate-600 mt-1">{n.subtitle}</Text>
      </Pressable>
    );
  };

  return (
    <View className="gap-y-4">
      <Card className="p-4 border border-slate-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-inter-bold text-slate-800">Data Flow & State Management</Text>
            <Text className="text-xs font-inter text-slate-500 mt-1">
              Chạm vào node hoặc connection để xem payload và hành vi.
            </Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center">
              <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: backendStatus.color, marginRight: 6 }} />
              <Text className="text-xs font-inter-bold text-slate-800">{backendStatus.title}</Text>
            </View>
            <Text className="text-[10px] font-inter text-slate-500 mt-1">{backendStatus.subtitle}</Text>
          </View>
        </View>

      </Card>

      <Card className="p-4 border border-slate-100">
        <Text className="text-sm font-inter-bold text-slate-800">Nodes</Text>
        <View className="mt-3 gap-y-3">
          <View className="flex-row gap-x-3">
            <View className="flex-1 gap-y-3">
              {renderNode('customer_ui')}
              {renderNode('staff_ui')}
            </View>
            <View className="flex-1 gap-y-3">
              {renderNode('auth_store')}
              {renderNode('cart_store')}
              {renderNode('order_store')}
            </View>
          </View>
          <View className="gap-y-3">
            {renderNode('api_client')}
            <View className="flex-row gap-x-3">
              <View className="flex-1">{renderNode('real_backend')}</View>
            </View>
          </View>
        </View>
      </Card>

      <Card className="p-4 border border-slate-100">
        <Text className="text-sm font-inter-bold text-slate-800">Connections</Text>
        <Text className="text-xs font-inter text-slate-500 mt-1">
          (UI representation dạng flow list; “click line” = click vào item connection)
        </Text>
        <View className="mt-3 gap-y-2">
          {ARCH_EDGES.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => setSelectedEdge(e)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              hitSlop={6}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-inter-bold text-slate-800">
                  {nodeById.get(e.from)?.title} → {nodeById.get(e.to)?.title}
                </Text>
                <Text className="text-[10px] font-inter-bold text-slate-500 uppercase tracking-widest">
                  {e.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Card>

      <Modal
        visible={selectedEdge !== null || selectedNode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedEdge(null);
          setSelectedNode(null);
        }}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => {
            setSelectedEdge(null);
            setSelectedNode(null);
          }}
        >
          <Pressable className="p-4" onPress={() => null}>
            <Card className="p-4 border border-slate-100">
              {selectedEdge ? (
                <View className="gap-y-3">
                  <Text className="text-lg font-outfit-bold text-slate-900">{selectedEdge.detailsTitle}</Text>
                  <View className="gap-y-2">
                    {selectedEdge.details.map((row) => (
                      <View key={row.k} className="flex-row justify-between">
                        <Text className="text-xs font-inter-bold text-slate-700">{row.k}</Text>
                        <Text className="text-xs font-inter text-slate-600">{row.v}</Text>
                      </View>
                    ))}
                  </View>
                  <Button
                    label="Đóng"
                    variant="outline"
                    onPress={() => setSelectedEdge(null)}
                  />
                </View>
              ) : null}

              {selectedNode ? (
                <View className="gap-y-3">
                  <Text className="text-lg font-outfit-bold text-slate-900">{selectedNode.title}</Text>
                  <Text className="text-sm font-inter text-slate-600">{selectedNode.subtitle}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    <Badge
                      label={selectedNode.tone.toUpperCase()}
                      variant={
                        selectedNode.tone === 'ui'
                          ? 'info'
                          : selectedNode.tone === 'store'
                            ? 'warning'
                            : selectedNode.tone === 'api'
                              ? 'neutral'
                              : 'success'
                      }
                    />
                    {selectedNode.id === 'real_backend' ? (
                      <Badge label="ACTIVE" variant="success" />
                    ) : null}
                  </View>
                  <Button
                    label="Đóng"
                    variant="outline"
                    onPress={() => setSelectedNode(null)}
                  />
                </View>
              ) : null}
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function OptimisticSyncVisualizer() {
  const [outcome, setOutcome] = useState<'success' | 'error'>('success');
  const [serverQty, setServerQty] = useState(1);
  const [clientQty, setClientQty] = useState(1);
  const [phase, setPhase] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Nhấn + để tăng số lượng (optimistic update).');
  const [anim] = useState(() => new Animated.Value(0));

  const resetAnim = () => {
    anim.stopAnimation();
    anim.setValue(0);
  };

  const runToServer = () =>
    new Promise<void>((resolve) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: false,
      }).start(() => resolve());
    });

  const runRollback = () =>
    new Promise<void>((resolve) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start(() => resolve());
    });

  const pipeWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const statusColor =
    phase === 'success' ? '#16A34A' : phase === 'error' ? '#DC2626' : phase === 'syncing' ? '#2563EB' : '#94A3B8';

  const handlePlus = async () => {
    if (phase === 'syncing') return;
    const nextClient = clientQty + 1;
    setClientQty(nextClient);
    setPhase('syncing');
    setMessage('1) Client cập nhật ngay (optimistic). 2) Gửi request ngầm lên server...');
    resetAnim();

    await runToServer();

    if (outcome === 'success') {
      setServerQty(nextClient);
      setPhase('success');
      setMessage('Server xác nhận thành công. Client và Server đã đồng bộ.');
      return;
    }

    setPhase('error');
    setMessage('Server từ chối (hết hàng / lỗi mạng). Rollback về giá trị server...');
    await runRollback();
    setClientQty(serverQty);
  };

  return (
    <View className="gap-y-4">
      <Card className="p-4 border border-slate-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-inter-bold text-slate-800">Outcome</Text>
            <Text className="text-xs font-inter text-slate-500 mt-1">Chọn kết quả server để mô phỏng sync success vs rollback.</Text>
          </View>
          <View className="flex-row items-center gap-x-2">
            <Pressable
              onPress={() => setOutcome('success')}
              className={`px-3 py-2 rounded-xl border ${outcome === 'success' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}
              hitSlop={6}
            >
              <Text className={`text-xs font-inter-bold ${outcome === 'success' ? 'text-green-800' : 'text-slate-700'}`}>Server Success</Text>
            </Pressable>
            <Pressable
              onPress={() => setOutcome('error')}
              className={`px-3 py-2 rounded-xl border ${outcome === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}
              hitSlop={6}
            >
              <Text className={`text-xs font-inter-bold ${outcome === 'error' ? 'text-red-800' : 'text-slate-700'}`}>Server Error</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <View className="flex-row gap-x-3">
        <Card className="flex-1 p-4 border border-slate-100">
          <Text className="text-xs font-inter-bold text-slate-400 uppercase">Client App</Text>
          <View className="mt-3 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-inter text-slate-500">Cart item</Text>
              <Text className="text-xl font-outfit-bold text-slate-900 mt-1">Qty: {clientQty}</Text>
            </View>
            <Pressable
              onPress={handlePlus}
              className={`w-12 h-12 rounded-2xl items-center justify-center ${phase === 'syncing' ? 'bg-slate-200' : 'bg-primary'}`}
              hitSlop={10}
            >
              <Text className="text-white text-2xl font-outfit-bold">+</Text>
            </Pressable>
          </View>
          <Text className="text-xs font-inter text-slate-500 mt-3">Optimistic UI update: qty tăng ngay.</Text>
        </Card>

        <Card className="flex-1 p-4 border border-slate-100">
          <Text className="text-xs font-inter-bold text-slate-400 uppercase">Server Database</Text>
          <View className="mt-3">
            <Text className="text-sm font-inter text-slate-500">Stored quantity</Text>
            <Text className="text-xl font-outfit-bold text-slate-900 mt-1">Qty: {serverQty}</Text>
          </View>
          <Text className="text-xs font-inter text-slate-500 mt-3">Chỉ đổi khi server xác nhận.</Text>
        </Card>
      </View>

      <Card className="p-4 border border-slate-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-inter-bold text-slate-800">Sync Pipeline</Text>
          <View className="flex-row items-center">
            <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: statusColor, marginRight: 6 }} />
            <Text className="text-xs font-inter-bold text-slate-700">
              {phase === 'idle' ? 'Idle' : phase === 'syncing' ? 'Syncing...' : phase === 'success' ? 'Success' : 'Rollback'}
            </Text>
          </View>
        </View>
        <View className="mt-3">
          <View className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <Animated.View style={{ width: pipeWidth, height: '100%', backgroundColor: statusColor }} />
          </View>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs font-inter text-slate-500">Client</Text>
            <Text className="text-xs font-inter text-slate-500">Server</Text>
          </View>
        </View>
        <Text className="text-xs font-inter text-slate-600 mt-3">{message}</Text>
        <View className="mt-3 flex-row gap-x-2">
          <Pressable
            onPress={() => {
              setClientQty(serverQty);
              setPhase('idle');
              setMessage('Nhấn + để tăng số lượng (optimistic update).');
              resetAnim();
            }}
            className="px-3 py-2 rounded-xl bg-slate-100"
          >
            <Text className="text-xs font-inter-bold text-slate-700">Reset</Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}
