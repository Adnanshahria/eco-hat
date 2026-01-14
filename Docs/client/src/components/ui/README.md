# UI Components Documentation

This directory contains **55 shadcn/ui components** that provide the design system for the Eco-Haat application. These are pre-built, customizable components based on Radix UI primitives.

## Overview

All components follow the shadcn/ui pattern:
- Built on [Radix UI](https://radix-ui.com) primitives
- Styled with Tailwind CSS
- Use the `cn()` utility for class merging
- Fully accessible (WCAG compliant)
- Type-safe with TypeScript

## Component Categories

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| Card | `card.tsx` | Container with header, content, footer sections |
| Separator | `separator.tsx` | Horizontal/vertical divider |
| Scroll Area | `scroll-area.tsx` | Custom scrollbar container |
| Resizable | `resizable.tsx` | Resizable panel layout |
| Aspect Ratio | `aspect-ratio.tsx` | Fixed aspect ratio container |

### Form Components

| Component | File | Description |
|-----------|------|-------------|
| Input | `input.tsx` | Text input field |
| Textarea | `textarea.tsx` | Multi-line text input |
| Select | `select.tsx` | Dropdown selection |
| Checkbox | `checkbox.tsx` | Checkbox input |
| Radio Group | `radio-group.tsx` | Radio button group |
| Switch | `switch.tsx` | Toggle switch |
| Slider | `slider.tsx` | Range slider |
| Calendar | `calendar.tsx` | Date picker calendar |
| Input OTP | `input-otp.tsx` | One-time password input |
| Form | `form.tsx` | Form validation wrapper |
| Field | `field.tsx` | Form field container |
| Label | `label.tsx` | Form label |
| Input Group | `input-group.tsx` | Input with addons |

### Button Components

| Component | File | Description |
|-----------|------|-------------|
| Button | `button.tsx` | Primary button component |
| Button Group | `button-group.tsx` | Grouped buttons |
| Toggle | `toggle.tsx` | Toggle button |
| Toggle Group | `toggle-group.tsx` | Exclusive toggle set |

### Navigation Components

| Component | File | Description |
|-----------|------|-------------|
| Tabs | `tabs.tsx` | Tab navigation |
| Navigation Menu | `navigation-menu.tsx` | Site navigation |
| Menubar | `menubar.tsx` | Application menu bar |
| Breadcrumb | `breadcrumb.tsx` | Path breadcrumbs |
| Pagination | `pagination.tsx` | Page navigation |
| Sidebar | `sidebar.tsx` | Application sidebar |
| Command | `command.tsx` | Command palette |

### Overlay Components

| Component | File | Description |
|-----------|------|-------------|
| Dialog | `dialog.tsx` | Modal dialog |
| Sheet | `sheet.tsx` | Slide-out panel |
| Drawer | `drawer.tsx` | Bottom drawer |
| Dropdown Menu | `dropdown-menu.tsx` | Dropdown actions |
| Context Menu | `context-menu.tsx` | Right-click menu |
| Popover | `popover.tsx` | Floating content |
| Tooltip | `tooltip.tsx` | Hover tooltip |
| Hover Card | `hover-card.tsx` | Rich hover preview |
| Alert Dialog | `alert-dialog.tsx` | Confirmation dialog |

### Feedback Components

| Component | File | Description |
|-----------|------|-------------|
| Alert | `alert.tsx` | Inline alert message |
| Toast | `toast.tsx` | Toast notification |
| Toaster | `toaster.tsx` | Toast container |
| Sonner | `sonner.tsx` | Alternative toast |
| Progress | `progress.tsx` | Progress bar |
| Skeleton | `skeleton.tsx` | Loading placeholder |
| Spinner | `spinner.tsx` | Loading spinner |
| Empty | `empty.tsx` | Empty state display |

### Data Display

| Component | File | Description |
|-----------|------|-------------|
| Table | `table.tsx` | Data table |
| Avatar | `avatar.tsx` | User avatar |
| Badge | `badge.tsx` | Status badge |
| Carousel | `carousel.tsx` | Image carousel |
| Chart | `chart.tsx` | Data visualization |
| Accordion | `accordion.tsx` | Collapsible sections |
| Collapsible | `collapsible.tsx` | Single collapsible |
| Item | `item.tsx` | List item |
| Kbd | `kbd.tsx` | Keyboard shortcut |

## Usage Pattern

All components follow a consistent usage pattern:

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <h2>Login</h2>
      </CardHeader>
      <CardContent>
        <Input placeholder="Email" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

## Variant System

Most components support variants via the `variant` prop:

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>
```

Common variant patterns:
- `default` - Primary styling
- `outline` - Border only
- `ghost` - Transparent background
- `destructive` - Error/danger styling

## Size System

Components often support size variants:

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

## Styling Approach

### Class Merging

All components accept a `className` prop for customization:

```tsx
<Button className="w-full mt-4">
  Full Width
</Button>
```

### CSS Variables

Components use CSS variables for theming:

```css
/* In index.css */
:root {
  --primary: 142.1 76.2% 36.3%;
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  /* ... */
}
```

## Accessibility

All components include proper:
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support

## Dependencies

| Package | Purpose |
|---------|---------|
| `@radix-ui/*` | UI primitives |
| `class-variance-authority` | Variant management |
| `tailwind-merge` | Class deduplication |
| `lucide-react` | Icons |
| `framer-motion` | Animations (some components) |

## Customization

To customize a component:

1. Copy the component file
2. Modify the styles or behavior
3. Update imports to use your version

Or extend with className:

```tsx
<Button className="bg-gradient-to-r from-purple-500 to-pink-500">
  Custom Gradient
</Button>
```

## Notes

> [!TIP]
> These components are designed to be copied and modified. They're not a library—they're starting points.

> [!NOTE]
> The `sidebar.tsx` component is the largest (22KB) and includes a complete sidebar system with navigation, collapse, and mobile support.

> [!IMPORTANT]
> Always import from `@/components/ui/...` to use the project's configured components.
