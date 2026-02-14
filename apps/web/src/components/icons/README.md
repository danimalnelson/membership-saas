# Icons

This project uses [geist-icons](https://www.npmjs.com/package/geist-icons) — a Geist-style icon library with zero dependencies and modern tooling.

**Browse all icons:** [vercel.com/geist/icons](https://vercel.com/geist/icons)

**Icons not in geist-icons** (e.g. pause-circle): Copy the SVG from vercel.com/geist/icons (right-click the icon → Copy), then add a component in `components/icons/` that wraps it with `size` and `color` props.

## Usage

```tsx
import { IconName } from "geist-icons";

<IconName size={16} color="#666" />
```

Icons accept `size` (number), `color` (string), and standard SVG props like `className`.

## Icons currently in use

| Icon | Used in |
|------|---------|
| Check | filter-popover, PlanModal, MembershipListing, CheckoutModal, filter checkbox |
| Cross (X) | PlanModal, CheckoutModal, drawer, settings, portal, SubscriptionActions, EditMemberInfoDialog, linear-mobile-sidebar — SVG from [vercel.com/geist/icons](https://vercel.com/geist/icons) |
| DollarSign | TransactionTable, dashboard, ActionItems |
| UserPlus | TransactionTable, ActivityFeed |
| UserX | TransactionTable |
| XCircle | TransactionTable, cancel page, EventTimeline |
| Clock | TransactionTable, admin scenarios, TimeControls |
| PauseCircle | TransactionTable (subscription paused) — SVG from [vercel.com/geist/icons](https://vercel.com/geist/icons) |
| Lifebuoy | sidebars (Help & Support) — SVG from [vercel.com/geist/icons](https://vercel.com/geist/icons) |
| Pause, Play | portal, SubscriptionActions |
| RefreshCcw | TransactionTable, admin scenarios |
| FileText | TransactionTable, EventTimeline |
| Download | TransactionTable, MembersTable |
| Plus | sidebars, plans, memberships, members tables, portal |
| ArrowLeftRight | sidebars (Activity nav) |
| Users, ChartPie, Layers | sidebars |
| Settings, Lifebuoy (Help & Support), ChevronDown, ChevronRight, ChevronLeft, LogOut | sidebars |
| Inbox, Menu | sidebars |
| ArrowLeft | plans edit, members, portal, checkout |
| ExternalLink | members page |
| CreditCard | dashboard, portal, ActivityFeed, ActionItems |
| TrendingDown, TrendingUp | dashboard |
| AlertCircle, AlertTriangle | dashboard |
| ArrowRight, Circle | GettingStarted |
| Share2, CheckCircle | ActionItems |
| Edit2 | EditMemberInfoDialog |
| Trash2 | MemberNotes, admin scenarios |
| Upload, ZoomIn, ZoomOut | settings |
| Loader | checkout |
| CheckCircle | success page, EventTimeline |
| FastForward, Calendar | TimeControls |
