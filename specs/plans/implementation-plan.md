# Technical Implementation Plan: Multi-Step Checkout Payment Flow

**Date**: 2026-06-08

**Feature**: 001-payment-checkout-flow

**Version**: 1.0.0

---

## Executive Summary

This technical plan details the implementation of a multi-step checkout payment flow in React + TypeScript using React Hook Form, Zod validation, Zustand state management, TailwindCSS, and shadcn/ui components. The design prioritizes accessibility (WCAG 2.1 AA), responsive design (mobile-first), form state preservation, and comprehensive error handling.

**Key Implementation Approach**:
- Multi-step form with persistent state via Zustand store
- Zod schema for comprehensive validation (client + server)
- React Hook Form for efficient form management
- Step-based navigation with data preservation
- Async payment processing with idempotency
- Full accessibility and responsive design

---

## Architecture Overview

### 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Checkout Flow Container (App or Routing Layer)                  │
│                                                                  │
│ ┌──────────── Checkout Store (Zustand) ─────────────┐          │
│ │ • Checkout session state (step, form data)         │          │
│ │ • Order state (success/failure)                    │          │
│ │ • Loading & error states                           │          │
│ │ • Cart data                                        │          │
│ └────────────────────────────────────────────────────┘          │
│                                                                  │
│ ┌─────────────── Multi-Step Form ──────────────────┐           │
│ │ Step 1: Checkout Summary                          │           │
│ │ Step 2: Personal Information Form                 │           │
│ │ Step 3: Address Form (Billing + Shipping)         │           │
│ │ Step 4: Payment Details Form                      │           │
│ │ Step 5: Review & Confirmation                     │           │
│ │ Step 6: Success/Failure State                     │           │
│ └────────────────────────────────────────────────────┘          │
│                                                                  │
│ ┌─────────── API Layer ──────────────────────────────┐          │
│ │ • submitCheckout(formData, idempotencyKey)        │          │
│ │ • validateAddress(address)                        │          │
│ │ • tokenizePayment(cardData) via Stripe/Square     │          │
│ │ • getCountries/States (for selects)               │          │
│ └────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 2. State Management Strategy

**Zustand Store (`stores/checkoutStore.ts`)**:
```typescript
interface CheckoutSession {
  // Step tracking
  currentStep: 1 | 2 | 3 | 4 | 5 | 6; // Summary → Personal → Address → Payment → Review → Success
  
  // Form sections (preserved across steps)
  personalInfo: PersonalInfoData | null;
  billingAddress: AddressData | null;
  shippingAddress: AddressData | null;
  paymentMethod: PaymentMethodData | null;
  
  // UI state
  isLoadingSubmit: boolean;
  submitError: string | null;
  
  // Order state (after submission)
  orderId: string | null;
  orderStatus: 'idle' | 'processing' | 'success' | 'failed';
  
  // Cart data (for summary display)
  cartItems: CartItem[];
  cartTotal: number;
}
```

**Actions**:
- `goToStep(step)` — Navigate to specific step
- `updatePersonalInfo(data)` — Update personal info section
- `updateBillingAddress(data)` — Update billing address
- `updateShippingAddress(data)` — Update shipping address
- `updatePaymentMethod(data)` — Update payment method
- `setShippingAddressSameAsBilling(bool)` — Toggle shipping address
- `submitCheckout()` — Process payment submission
- `resetCheckout()` — Clear checkout state (for new order)
- `setError(error)` — Set error message
- `clearError()` — Clear error message

---

## Project Structure

### 2.1 File Organization

```
src/
├── components/
│   ├── checkout/
│   │   ├── CheckoutContainer.tsx              # Main checkout wrapper
│   │   ├── CheckoutSummary.tsx                # Step 1: Cart summary
│   │   ├── PersonalInfoForm.tsx               # Step 2: Name, email, phone
│   │   ├── AddressForm.tsx                    # Step 3: Billing/shipping address
│   │   ├── PaymentForm.tsx                    # Step 4: Card details
│   │   ├── ReviewOrder.tsx                    # Step 5: Final review
│   │   ├── CheckoutSuccess.tsx                # Step 6a: Success state
│   │   ├── CheckoutError.tsx                  # Step 6b: Failure state
│   │   ├── FormError.tsx                      # Reusable inline error display
│   │   └── StepNavigation.tsx                 # Form step controls (Next/Back/Submit)
│   ├── ui/
│   │   ├── button.tsx                         # shadcn/ui button
│   │   ├── input.tsx                          # shadcn/ui input
│   │   ├── select.tsx                         # shadcn/ui select
│   │   ├── form.tsx                           # shadcn/ui form wrapper
│   │   ├── label.tsx                          # shadcn/ui label
│   │   ├── card.tsx                           # shadcn/ui card
│   │   └── spinner.tsx                        # Loading spinner (new)
│   └── ...existing components
│
├── hooks/
│   ├── useCheckout.ts                         # Hook to access checkout store
│   ├── useValidationErrors.ts                 # Hook to manage field errors
│   └── useFormStepNavigation.ts               # Hook to handle step transitions
│
├── lib/
│   ├── utils.ts                               # Existing utilities
│   ├── validation.ts                          # Zod schemas (NEW)
│   └── api-client.ts                          # API client wrapper (NEW)
│
├── stores/
│   └── checkoutStore.ts                       # Zustand checkout store (NEW)
│
├── types/
│   ├── checkout.ts                            # Checkout-related types (NEW)
│   └── index.ts                               # Type exports
│
├── services/
│   ├── payment.ts                             # Payment API calls (NEW)
│   ├── address.ts                             # Address validation/autocomplete (NEW)
│   └── order.ts                               # Order submission (NEW)
│
├── constants/
│   └── checkout.ts                            # Validation messages, step info (NEW)
│
└── App.tsx                                    # Update to route to checkout
```

---

## Type Definitions

### 3.1 Core Types (`types/checkout.ts`)

```typescript
// Personal Information
export interface PersonalInfoData {
  fullName: string;
  email: string;
  phoneNumber: string;
}

// Address Information
export interface AddressData {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Payment Method
export interface PaymentMethodData {
  cardholderName: string;
  cardNumber: string;      // Masked or tokenized (never stored)
  expiryDate: string;      // MM/YY format
  cvv: string;             // Never stored server-side
  cardType?: 'visa' | 'mastercard' | 'amex' | 'discover';
}

// Cart Item
export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;  // in cents
  image?: string;
}

// Order (API response)
export interface Order {
  orderId: string;
  personalInfo: PersonalInfoData;
  billingAddress: AddressData;
  shippingAddress: AddressData;
  paymentMethod: Omit<PaymentMethodData, 'cardNumber' | 'cvv'> & { last4Digits: string };
  items: CartItem[];
  orderTotal: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: ISO8601DateTime;
}

// Checkout Session (Store)
export interface CheckoutSession {
  currentStep: CheckoutStep;
  personalInfo: PersonalInfoData | null;
  billingAddress: AddressData | null;
  shippingAddress: AddressData | null;
  useShippingAsBilling: boolean;
  paymentMethod: PaymentMethodData | null;
  isLoadingSubmit: boolean;
  submitError: string | null;
  orderId: string | null;
  orderStatus: 'idle' | 'processing' | 'success' | 'failed';
  cartItems: CartItem[];
  cartTotal: number;  // in cents
  sessionId: string;  // For idempotency
}

export type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6;

// Form field error
export interface FieldError {
  field: keyof PersonalInfoData | keyof AddressData | keyof PaymentMethodData;
  message: string;
}

// API Response
export interface CheckoutResponse {
  success: boolean;
  order?: Order;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;  // Field-level errors
  };
}
```

---

## Validation Strategy (Zod Schemas)

### 4.1 Validation Schemas (`lib/validation.ts`)

```typescript
import { z } from 'zod';

// Personal Info Schema
export const PersonalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  phoneNumber: z
    .string()
    .regex(/^\d{10,15}$/, 'Phone number must be 10-15 digits')
    .transform(val => val.replace(/\D/g, ''))  // Strip non-digits
});

// Address Schema
export const AddressSchema = z.object({
  streetAddress: z
    .string()
    .min(5, 'Street address must be at least 5 characters')
    .max(100, 'Street address must be less than 100 characters'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'City name can only contain letters, spaces, hyphens, and apostrophes'),
  state: z
    .string()
    .min(2, 'State/province is required')
    .max(3, 'State code must be 2-3 characters'),
  postalCode: z
    .string()
    .min(3, 'Postal code is required')
    .max(20, 'Postal code must be less than 20 characters'),
  country: z
    .string()
    .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
});

// Payment Method Schema (Client-side validation only)
export const PaymentMethodSchema = z.object({
  cardholderName: z
    .string()
    .min(2, 'Cardholder name must be at least 2 characters')
    .max(100, 'Cardholder name must be less than 100 characters'),
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, 'Card number must be 13-19 digits')
    .refine(luhnCheck, 'Invalid card number'),  // Luhn algorithm
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Expiry date must be in MM/YY format')
    .refine(isValidExpiryDate, 'Card has expired or invalid expiry date'),
  cvv: z
    .string()
    .regex(/^\d{3,4}$/, 'CVV must be 3-4 digits')
});

// Full Checkout Schema (all steps combined)
export const CheckoutSchema = z.object({
  personalInfo: PersonalInfoSchema,
  billingAddress: AddressSchema,
  shippingAddress: AddressSchema,
  paymentMethod: PaymentMethodSchema,
});

// Helper validation functions
function luhnCheck(cardNumber: string): boolean {
  // Luhn algorithm implementation
  let sum = 0;
  let isEven = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

function isValidExpiryDate(expiryDate: string): boolean {
  const [month, year] = expiryDate.split('/').map(Number);
  const now = new Date();
  const expiry = new Date(2000 + year, month - 1);
  return expiry > now && year <= 40; // Not in past, not more than 20 years in future (2000+20)
}

// Type inference from Zod schema
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Checkout = z.infer<typeof CheckoutSchema>;
```

---

## Form State Management (React Hook Form)

### 5.1 Form Hook Integration

**Each step will use React Hook Form with its corresponding Zod schema:**

```typescript
// In PersonalInfoForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonalInfoSchema } from '@/lib/validation';

export function PersonalInfoForm() {
  const { personalInfo } = useCheckout();
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: personalInfo || {},
    mode: 'onBlur',  // Validate on blur for UX
  });

  const onSubmit = async (data) => {
    const isValid = await trigger();
    if (isValid) {
      updatePersonalInfo(data);
      goToStep(3);  // Move to address step
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Full Name */}
      <div className="mb-4">
        <label htmlFor="fullName" className="block text-sm font-medium">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('fullName')}
          id="fullName"
          className={errors.fullName ? 'border-red-500' : ''}
          aria-invalid={errors.fullName ? 'true' : 'false'}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
        />
        {errors.fullName && (
          <p id="fullName-error" className="mt-1 text-sm text-red-500">
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email & Phone fields similar to above */}
      {/* ... */}

      <button type="submit">Continue</button>
    </form>
  );
}
```

---

## API Integration Strategy

### 6.1 API Client (`lib/api-client.ts`)

```typescript
interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.headers, ...headers },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.message || 'Request failed');
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request('GET', endpoint, undefined, headers);
  }

  post<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request('POST', endpoint, data, headers);
  }
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Instantiate API client
export const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
});
```

### 6.2 Payment Service (`services/payment.ts`)

```typescript
export async function submitCheckout(
  checkoutData: Checkout,
  idempotencyKey: string
): Promise<CheckoutResponse> {
  try {
    const response = await apiClient.post<CheckoutResponse>(
      '/orders/submit',
      {
        personalInfo: checkoutData.personalInfo,
        billingAddress: checkoutData.billingAddress,
        shippingAddress: checkoutData.shippingAddress,
        paymentMethod: {
          // NEVER send raw card data to your server
          // Instead, tokenize via Stripe/Square client-side first
          // Only send token here
          token: checkoutData.paymentMethod.token,
          cardholderName: checkoutData.paymentMethod.cardholderName,
        },
        items: checkoutData.items,
      },
      {
        'Idempotency-Key': idempotencyKey,  // Prevent duplicate orders
      }
    );

    return response;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PAYMENT_FAILED',
        message: error instanceof ApiError
          ? error.message
          : 'An unexpected error occurred during payment processing',
      },
    };
  }
}

export async function validateAddress(address: Address): Promise<boolean> {
  try {
    const response = await apiClient.post<{ valid: boolean }>(
      '/addresses/validate',
      address
    );
    return response.valid;
  } catch (error) {
    console.error('Address validation error:', error);
    return false;  // Fail open; allow user to proceed
  }
}

export async function getCountries(): Promise<Array<{ code: string; name: string }>> {
  try {
    return await apiClient.get('/geo/countries');
  } catch (error) {
    console.error('Failed to load countries:', error);
    return [];
  }
}

export async function getStates(countryCode: string): Promise<Array<{ code: string; name: string }>> {
  try {
    return await apiClient.get(`/geo/states/${countryCode}`);
  } catch (error) {
    console.error('Failed to load states:', error);
    return [];
  }
}
```

---

## Zustand Store Implementation

### 7.1 Checkout Store (`stores/checkoutStore.ts`)

```typescript
import { create } from 'zustand';
import { CheckoutSession, PersonalInfoData, AddressData, PaymentMethodData } from '@/types/checkout';
import { submitCheckout } from '@/services/payment';

interface CheckoutState extends CheckoutSession {
  // Actions
  goToStep: (step: CheckoutStep) => void;
  updatePersonalInfo: (data: PersonalInfoData) => void;
  updateBillingAddress: (data: AddressData) => void;
  updateShippingAddress: (data: AddressData) => void;
  setUseShippingAsBilling: (use: boolean) => void;
  updatePaymentMethod: (data: PaymentMethodData) => void;
  submitOrder: () => Promise<void>;
  resetCheckout: () => void;
  setError: (error: string | null) => void;
}

const initialState: Omit<CheckoutState, keyof Record<string, Function>> = {
  currentStep: 1,
  personalInfo: null,
  billingAddress: null,
  shippingAddress: null,
  useShippingAsBilling: true,
  paymentMethod: null,
  isLoadingSubmit: false,
  submitError: null,
  orderId: null,
  orderStatus: 'idle',
  cartItems: [],
  cartTotal: 0,
  sessionId: generateSessionId(),  // Unique ID for idempotency
};

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  ...initialState,

  goToStep: (step) => set({ currentStep: step }),

  updatePersonalInfo: (data) => set({ personalInfo: data }),

  updateBillingAddress: (data) => set({ billingAddress: data }),

  updateShippingAddress: (data) => set({ shippingAddress: data }),

  setUseShippingAsBilling: (use) => set({ useShippingAsBilling: use }),

  updatePaymentMethod: (data) => set({ paymentMethod: data }),

  submitOrder: async () => {
    const state = get();

    if (!state.personalInfo || !state.billingAddress || !state.paymentMethod) {
      set({ submitError: 'Please complete all required fields' });
      return;
    }

    set({ isLoadingSubmit: true, submitError: null });

    try {
      const response = await submitCheckout(
        {
          personalInfo: state.personalInfo,
          billingAddress: state.billingAddress,
          shippingAddress: state.useShippingAsBilling ? state.billingAddress : state.shippingAddress!,
          paymentMethod: state.paymentMethod,
          items: state.cartItems,
        },
        state.sessionId
      );

      if (response.success && response.order) {
        set({
          orderId: response.order.orderId,
          orderStatus: 'success',
          currentStep: 6,
          isLoadingSubmit: false,
        });
      } else {
        set({
          orderStatus: 'failed',
          submitError: response.error?.message || 'Payment processing failed',
          isLoadingSubmit: false,
        });
      }
    } catch (error) {
      set({
        orderStatus: 'failed',
        submitError: 'An unexpected error occurred. Please try again.',
        isLoadingSubmit: false,
      });
      console.error('Checkout error:', error);
    }
  },

  resetCheckout: () => set({ ...initialState, sessionId: generateSessionId() }),

  setError: (error) => set({ submitError: error }),
}));

// Custom hook for convenient access
export function useCheckout() {
  return useCheckoutStore();
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

---

## Component Implementation Strategy

### 8.1 Component Hierarchy

```
CheckoutContainer (Route/Page)
├── CheckoutSummary (Step 1)
│   ├── CartItem[] (display only)
│   └── StepNavigation (Next button)
│
├── PersonalInfoForm (Step 2)
│   ├── TextInput (Full Name)
│   ├── EmailInput (Email)
│   ├── TelInput (Phone)
│   ├── FormError[] (inline errors)
│   └── StepNavigation (Back/Next)
│
├── AddressForm (Step 3)
│   ├── TextInput (Street Address)
│   ├── TextInput (City)
│   ├── Select (State)
│   ├── TextInput (Postal Code)
│   ├── Select (Country)
│   ├── Checkbox (Use as Shipping) [Show Shipping Fields if unchecked]
│   ├── [Conditional] AddressForm (Shipping Address)
│   ├── FormError[] (inline errors)
│   └── StepNavigation (Back/Next)
│
├── PaymentForm (Step 4)
│   ├── TextInput (Cardholder Name)
│   ├── CardNumberInput (Card Number - masked)
│   ├── ExpiryInput (MM/YY)
│   ├── CVVInput (3-4 digits)
│   ├── FormError[] (inline errors)
│   └── StepNavigation (Back/Submit)
│
├── ReviewOrder (Step 5)
│   ├── Section (Personal Info - editable link)
│   ├── Section (Billing Address - editable link)
│   ├── Section (Shipping Address - editable link)
│   ├── Section (Payment Method - masked card)
│   ├── Section (Order Total)
│   └── StepNavigation (Back/Place Order)
│
└── [Conditional]
    ├── CheckoutSuccess (Step 6a) - Order Confirmation
    │   ├── ConfirmationNumber
    │   ├── OrderSummary
    │   ├── NextSteps Message
    │   └── Button (View Order / Continue Shopping)
    │
    └── CheckoutError (Step 6b)
        ├── ErrorMessage
        ├── RetryButton
        └── SupportLink
```

### 8.2 Accessibility Implementation

**ARIA Attributes**:
```typescript
// In PersonalInfoForm
<div role="region" aria-label="Personal Information">
  <h2 id="personal-info-title">Personal Information</h2>
  <form aria-labelledby="personal-info-title">
    <input
      aria-invalid={!!errors.fullName}
      aria-describedby="fullName-error"
    />
  </form>
</div>

// Error announcements
<div aria-live="polite" aria-atomic="true" role="alert">
  {errors.fullName && <span id="fullName-error">{errors.fullName.message}</span>}
</div>
```

**Keyboard Navigation**:
- Focus flows: Form inputs → Errors → Buttons (Tab order)
- Enter key submits form
- Escape key cancels (optional)
- Back/Next buttons accessible via Tab + Enter

**Screen Reader Compatibility**:
- All label `htmlFor` attributes connected to input `id`
- Error messages linked via `aria-describedby`
- Form sections wrapped in `role="region"` with `aria-label`
- Loading states announced via `aria-live="polite"`

---

## Error Handling Strategy

### 9.1 Error Categories

| Error Type | User Message | Recovery |
|-----------|--------------|----------|
| Validation Error | "Please enter a valid email address" | Show inline error; allow edit |
| Network Timeout | "Payment processing timed out. Please try again." | Retry button |
| Card Declined | "Your card was declined. Please check your details or try another card." | Try different card |
| 3D Secure | "Your card requires verification. Please try another payment method." | Try different card |
| Server Error | "We encountered an error. Please try again or contact support." | Retry with exponential backoff |
| Duplicate Order | "Order already submitted. Redirecting to order details..." | Show existing order (idempotency) |

### 9.2 Error Handling Pattern

```typescript
// Services/payment.ts
export async function submitCheckout(
  checkoutData: Checkout,
  idempotencyKey: string
): Promise<CheckoutResponse> {
  try {
    const response = await apiClient.post<CheckoutResponse>(...);
    
    if (!response.ok) {
      const errorData = response.json();
      
      // Map server error codes to user messages
      const userMessage = ERROR_MESSAGES[errorData.code] || 'Payment failed';
      
      return {
        success: false,
        error: {
          code: errorData.code,
          message: userMessage,
          details: errorData.details,  // Field-level errors
        },
      };
    }

    return response;
  } catch (error) {
    if (error instanceof TimeoutError) {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Payment processing timed out. Please try again.',
        },
      };
    }
    
    // Log to monitoring (Sentry, etc.)
    logError(error);
    
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'An unexpected error occurred.',
      },
    };
  }
}
```

---

## Performance Optimization

### 10.1 Strategies

1. **Form State Optimization**:
   - Use `useCallback` for form handlers to prevent re-renders
   - Memoize step components with `React.memo` if needed
   - Use Zustand selectors to avoid full store re-renders

2. **Image Optimization**:
   - Use `<picture>` or `srcSet` for responsive images in cart summary
   - Lazy-load images below the fold

3. **Code Splitting**:
   - Each step could be dynamically imported if bundle size is concern
   - Payment form (with card handling) should be in main bundle

4. **Network Optimization**:
   - Batch country/state API calls on component mount
   - Cache geo data in localStorage (TTL: 1 week)
   - Use POST for payment (not GET) for idempotency header support

5. **CSS Optimization**:
   - Use Tailwind purging to remove unused classes
   - Minimize CSS-in-JS

---

## Testing Strategy

### 11.1 Test Coverage Plan

**Unit Tests** (`*.test.ts(x)`):
- Zod validation schemas (valid/invalid inputs)
- Luhn algorithm (valid/invalid card numbers)
- Store actions (state transitions)
- Utility functions (formatting, masking)

**Integration Tests**:
- Form submission flow (all steps)
- Error handling and retry
- Accessibility compliance (keyboard nav, screen reader)
- Responsive behavior (different viewport sizes)

**E2E Tests** (optional for MVP):
- Complete checkout flow (user journey)
- Payment processing (mocked API)
- Error recovery (declined card, timeout)

**Test Tools**:
- Jest + React Testing Library (unit/integration)
- Cypress or Playwright (E2E)
- Axe or WAVE (accessibility audit)

### 11.2 Example Test

```typescript
// PersonalInfoForm.test.tsx
import { render, screen, userEvent } from '@testing-library/react';
import { PersonalInfoForm } from './PersonalInfoForm';

describe('PersonalInfoForm', () => {
  it('should display validation error for invalid email', async () => {
    render(<PersonalInfoForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.tab();  // Blur event triggers validation
    
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('should accept valid data and proceed to next step', async () => {
    const { store } = render(<PersonalInfoForm />);
    
    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/phone/i), '1234567890');
    
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    
    expect(store.getState().currentStep).toBe(3);
  });
});
```

---

## Required Dependencies

### 12.1 New Packages (if not already installed)

```json
{
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.4",
  "@hookform/resolvers": "^3.3.4",
  "zustand": "^4.4.1",
  "stripe": "^13.8.0",            // Only if using Stripe (client-side tokenization)
  "clsx": "^2.0.0",              // For conditional classNames (likely already installed)
  "axios": "^1.6.0"              // Optional: if using for API calls (fetch also works)
}
```

---

## Phase Implementation Breakdown

### Phase 1: Foundation (Week 1)
- [ ] Set up folder structure
- [ ] Create types and constants
- [ ] Implement Zustand store
- [ ] Create validation schemas (Zod)
- [ ] Set up API client

### Phase 2: Core Components (Week 2)
- [ ] CheckoutContainer wrapper
- [ ] PersonalInfoForm (Step 2)
- [ ] AddressForm (Step 3)
- [ ] Implement form state management

### Phase 3: Payment & Review (Week 2-3)
- [ ] PaymentForm (Step 4)
- [ ] ReviewOrder (Step 5)
- [ ] Integrate payment tokenization (Stripe/Square)

### Phase 4: Success/Error States (Week 3)
- [ ] CheckoutSuccess component
- [ ] CheckoutError component
- [ ] Error handling & retry logic

### Phase 5: Accessibility & Polish (Week 3-4)
- [ ] ARIA attributes & keyboard navigation
- [ ] Screen reader testing
- [ ] Responsive design review
- [ ] Performance optimization

### Phase 6: Testing & QA (Week 4)
- [ ] Unit tests (validation, store)
- [ ] Integration tests (form flow)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing

---

## Risks & Mitigation

### Risk 1: Payment Data Security (PCI DSS Compliance)
**Risk**: Collecting raw card data on client-side violates PCI DSS
**Mitigation**:
- Use Stripe/Square Secure Token API; never transmit raw card number to your server
- Store only last 4 digits and token
- CVV is never stored
- Server-side validation is authoritative (never trust client)

### Risk 2: Duplicate Order Submission
**Risk**: User clicks submit twice or clicks back/forward rapidly
**Mitigation**:
- Disable submit button during processing
- Implement idempotency key (unique per session)
- Server rejects duplicate requests within 5-minute window
- Show loading spinner during processing

### Risk 3: Form Data Loss on Refresh
**Risk**: User closes browser or refreshes page, loses all form data
**Mitigation**:
- Persist store state to sessionStorage (cleared on close)
- Restore state on page load
- Notify user of data loss if session expires (>30 min)

### Risk 4: Mobile Network Failures
**Risk**: Payment submission fails on slow/unreliable network
**Mitigation**:
- Implement exponential backoff retry (max 3 attempts)
- Show clear error messages with retry button
- Timeout after 30 seconds
- Log failed attempts server-side for debugging

### Risk 5: International Address Validation
**Risk**: Address validation fails for non-US formats (UK postcodes, etc.)
**Mitigation**:
- Use country-specific validation rules (configured per country)
- Provide address autocomplete (Google Maps API)
- Allow manual override if validation fails
- Server-side validation is authoritative

### Risk 6: Accessibility Compliance
**Risk**: Form is not accessible to keyboard/screen reader users
**Mitigation**:
- Run axe/WAVE audit before launch
- Test with NVDA screen reader
- Manual keyboard navigation testing
- Label all form fields correctly
- Use semantic HTML (no divs as buttons)

### Risk 7: Performance on Low-End Devices
**Risk**: Checkout is slow on mobile (< 3G) or old devices
**Mitigation**:
- Bundle size: <200KB gzipped for checkout path
- Lazy-load country/state data after form renders
- Optimize images (WebP, srcSet)
- Use CSS utilities (Tailwind) instead of custom CSS-in-JS
- Profile with Lighthouse; optimize images and unused dependencies

---

## Technical Debt & Future Improvements

### v1 Scope (Current)
- Single currency (USD)
- Guest checkout (no saved payment methods)
- Basic address validation

### Deferred to v2+
- Multi-currency support
- Saved payment methods (for returning customers)
- 3D Secure authentication (payment gateway handles)
- Express checkout (Apple Pay, Google Pay)
- Promo code / coupon code handling
- Gift card support
- Order tracking page

---

## Deployment Checklist

- [ ] Environment variables configured (.env.local)
- [ ] HTTPS enabled (required for payment forms)
- [ ] CORS configured for API endpoints
- [ ] CDN/caching strategy for static assets
- [ ] Error monitoring (Sentry/LogRocket)
- [ ] Analytics tracking (GA, mixpanel)
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Rate limiting on payment endpoints
- [ ] Loading state/skeleton components for network lag
- [ ] Graceful degradation if JavaScript disabled

---

## Success Criteria

✅ Checkout completes in <3 minutes  
✅ Form validation errors appear <500ms (inline)  
✅ Payment processes <15 seconds  
✅ Responsive on mobile (375px), tablet (768px), desktop (1920px)  
✅ WCAG 2.1 AA compliance verified  
✅ Form state preserved across refresh  
✅ No duplicate orders submitted  
✅ Error messages are actionable & user-friendly  
✅ 90% of valid submissions succeed on first attempt  
✅ <3 failed tests on launch (regression-free)

