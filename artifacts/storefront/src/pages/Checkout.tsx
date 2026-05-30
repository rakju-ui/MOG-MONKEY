import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, MapPin, ClipboardList, ChevronRight, Lock, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetCart,
  useCreateOrder,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/cart-session";

const STEPS = [
  { id: 1, label: "Shipping", icon: MapPin },
  { id: 2, label: "Payment", icon: CreditCard },
  { id: 3, label: "Review", icon: ClipboardList },
];

const shippingSchema = z.object({
  email: z.string().email("Valid email required"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  line1: z.string().min(1, "Required"),
  line2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(2, "Required"),
  postalCode: z.string().min(4, "Required"),
  country: z.string().min(2, "Required").default("US"),
});

const paymentSchema = z.object({
  cardNumber: z.string().min(16, "Enter a valid card number"),
  expiry: z.string().min(5, "MM/YY required"),
  cvv: z.string().min(3, "CVV required"),
  nameOnCard: z.string().min(1, "Required"),
});

type ShippingData = z.infer<typeof shippingSchema>;
type PaymentData = z.infer<typeof paymentSchema>;

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {title && <h2 className="text-base font-semibold text-foreground mb-5">{title}</h2>}
      {children}
    </div>
  );
}

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [shippingData, setShippingData] = useState<ShippingData | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const sessionId = getCartSessionId();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );
  const createOrder = useCreateOrder();

  const shippingForm = useForm<ShippingData>({ resolver: zodResolver(shippingSchema), defaultValues: { country: "US" } });
  const paymentForm = useForm<PaymentData>({ resolver: zodResolver(paymentSchema) });

  const subtotal = cart?.subtotal ?? 0;
  const shippingCost = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const onShippingSubmit = (data: ShippingData) => { setShippingData(data); setStep(2); };
  const onPaymentSubmit = (_data: PaymentData) => { setStep(3); };

  const placeOrder = () => {
    if (!shippingData) return;
    createOrder.mutate(
      {
        data: {
          sessionId,
          customerEmail: shippingData.email,
          shippingAddress: {
            line1: shippingData.line1,
            line2: shippingData.line2,
            city: shippingData.city,
            state: shippingData.state,
            postalCode: shippingData.postalCode,
            country: shippingData.country,
          },
        },
      },
      {
        onSuccess: (order) => {
          setOrderId(order.id);
          setStep(4);
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        },
        onError: () => toast.error("Failed to place order"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <Skeleton className="h-10 w-64 mx-auto mb-10 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-96 rounded-2xl" /></div>
          <div><Skeleton className="h-56 rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Order placed!</h1>
          <p className="text-muted-foreground mb-1 text-sm">Order #{orderId}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Thanks for your order. We'll send you a confirmation email with tracking details shortly.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation(`/orders/${orderId}`)}>View Order</Button>
            <Button variant="outline" onClick={() => setLocation("/products")}>Continue Shopping</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-2.5 ${step >= s.id ? "text-foreground" : "text-muted-foreground"} ${step > s.id ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  step > s.id ? "bg-primary border-primary text-primary-foreground" :
                  step === s.id ? "border-foreground text-foreground bg-background" :
                  "border-border text-muted-foreground bg-background"
                }`}>
                  {step > s.id ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : s.id}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 md:w-16 mx-3 transition-colors ${step > s.id ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <SectionCard title="Shipping Information">
                <Form {...shippingForm}>
                  <form onSubmit={shippingForm.handleSubmit(onShippingSubmit)} className="space-y-4">
                    <FormField control={shippingForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="you@example.com" className="h-10" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={shippingForm.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl><Input {...field} className="h-10" data-testid="input-first-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={shippingForm.control} name="lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl><Input {...field} className="h-10" data-testid="input-last-name" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={shippingForm.control} name="line1" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street address</FormLabel>
                        <FormControl><Input {...field} placeholder="123 Main St" className="h-10" data-testid="input-address" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={shippingForm.control} name="line2" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartment, suite, etc. <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                        <FormControl><Input {...field} className="h-10" /></FormControl>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={shippingForm.control} name="city" render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl><Input {...field} className="h-10" data-testid="input-city" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={shippingForm.control} name="state" render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl><Input {...field} placeholder="CA" className="h-10" data-testid="input-state" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={shippingForm.control} name="postalCode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP code</FormLabel>
                          <FormControl><Input {...field} className="h-10" data-testid="input-zip" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full h-11 gap-2 mt-2" data-testid="button-continue-to-payment">
                      Continue to Payment <ChevronRight className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </SectionCard>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <SectionCard title="Payment Details">
                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-3 mb-5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    This is a demo store — no real payment is processed. Your card details are not stored.
                  </p>
                </div>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                    <FormField control={paymentForm.control} name="nameOnCard" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name on card</FormLabel>
                        <FormControl><Input {...field} placeholder="John Smith" className="h-10" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={paymentForm.control} name="cardNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="4242 4242 4242 4242"
                            maxLength={19}
                            className="h-10 font-mono tracking-wider"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={paymentForm.control} name="expiry" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry date</FormLabel>
                          <FormControl><Input {...field} placeholder="MM / YY" maxLength={5} className="h-10" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={paymentForm.control} name="cvv" render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl><Input {...field} placeholder="•••" maxLength={4} className="h-10" type="password" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button variant="outline" type="button" onClick={() => setStep(1)} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                      </Button>
                      <Button type="submit" className="flex-1 h-11 gap-2">
                        Review Order <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </SectionCard>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <SectionCard title="Order Items">
                  <div className="space-y-4">
                    {cart?.items.map((item, i) => (
                      <div key={item.id}>
                        <div className="flex gap-3 items-center">
                          <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                            {item.productImage && (
                              <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                            {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        {i < (cart?.items.length ?? 0) - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {shippingData && (
                  <SectionCard title="Shipping to">
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p className="font-medium text-foreground">{shippingData.firstName} {shippingData.lastName}</p>
                      <p>{shippingData.email}</p>
                      <p className="mt-2">{shippingData.line1}{shippingData.line2 ? `, ${shippingData.line2}` : ""}</p>
                      <p>{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="mt-3 text-xs text-primary hover:underline">
                      Edit shipping
                    </button>
                  </SectionCard>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    className="flex-1 h-11 gap-2"
                    onClick={placeOrder}
                    disabled={createOrder.isPending}
                    data-testid="button-place-order"
                  >
                    {createOrder.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Placing Order...
                      </span>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Place Order · ${total.toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
              <h3 className="text-sm font-semibold text-foreground mb-4">Order Summary</h3>

              {cart && cart.items.length > 0 && (
                <div className="space-y-3 mb-4">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.productImage && (
                          <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="flex-1 text-xs text-muted-foreground truncate">{item.productName}</p>
                      <p className="text-xs font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="mb-4" />

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? <span className="text-emerald-600 font-medium">Free</span> : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-foreground text-base pt-0.5">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Secured by 256-bit SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
