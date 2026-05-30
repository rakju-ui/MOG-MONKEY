import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, MapPin, ClipboardList, ChevronRight } from "lucide-react";
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

  const shippingCost = (cart?.subtotal ?? 0) >= 50 ? 0 : 9.99;
  const tax = (cart?.subtotal ?? 0) * 0.08;
  const total = (cart?.subtotal ?? 0) + shippingCost + tax;

  const onShippingSubmit = (data: ShippingData) => {
    setShippingData(data);
    setStep(2);
  };

  const onPaymentSubmit = (_data: PaymentData) => {
    setStep(3);
  };

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
          toast.success("Order placed successfully!");
        },
        onError: () => toast.error("Failed to place order"),
      }
    );
  };

  if (isLoading) return <div className="container mx-auto px-4 py-16"><Skeleton className="h-96" /></div>;

  if (step === 4) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Order confirmed!</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Order #{orderId} has been placed. We'll send you a confirmation email shortly.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setLocation(`/orders/${orderId}`)}>View Order</Button>
          <Button variant="outline" onClick={() => setLocation("/products")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Steps */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 ${step >= s.id ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${step > s.id ? "bg-primary border-primary text-primary-foreground" : step === s.id ? "border-primary text-primary" : "border-border"}`}>
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-8 md:w-16 mx-2 ${step > s.id ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-6">Shipping Information</h2>
                <Form {...shippingForm}>
                  <form onSubmit={shippingForm.handleSubmit(onShippingSubmit)} className="space-y-4">
                    <FormField control={shippingForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input {...field} type="email" placeholder="you@example.com" data-testid="input-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={shippingForm.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} data-testid="input-first-name" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={shippingForm.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} data-testid="input-last-name" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={shippingForm.control} name="line1" render={({ field }) => (
                      <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} placeholder="123 Main St" data-testid="input-address" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={shippingForm.control} name="line2" render={({ field }) => (
                      <FormItem><FormLabel>Apartment, suite, etc. (optional)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={shippingForm.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} data-testid="input-city" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={shippingForm.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} placeholder="CA" data-testid="input-state" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={shippingForm.control} name="postalCode" render={({ field }) => (
                        <FormItem><FormLabel>ZIP</FormLabel><FormControl><Input {...field} data-testid="input-zip" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="w-full gap-2 mt-2" data-testid="button-continue-to-payment">
                      Continue to Payment <ChevronRight className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-6">Payment Details</h2>
                <div className="bg-muted/40 rounded-xl p-4 mb-6 text-sm text-muted-foreground">
                  This is a demo store. No real payment is processed.
                </div>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                    <FormField control={paymentForm.control} name="nameOnCard" render={({ field }) => (
                      <FormItem><FormLabel>Name on Card</FormLabel><FormControl><Input {...field} placeholder="John Smith" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={paymentForm.control} name="cardNumber" render={({ field }) => (
                      <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input {...field} placeholder="4242 4242 4242 4242" maxLength={19} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={paymentForm.control} name="expiry" render={({ field }) => (
                        <FormItem><FormLabel>Expiry</FormLabel><FormControl><Input {...field} placeholder="MM/YY" maxLength={5} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={paymentForm.control} name="cvv" render={({ field }) => (
                        <FormItem><FormLabel>CVV</FormLabel><FormControl><Input {...field} placeholder="123" maxLength={4} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button variant="outline" type="button" onClick={() => setStep(1)}>Back</Button>
                      <Button type="submit" className="flex-1 gap-2">
                        Review Order <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-6">Review Your Order</h2>
                <div className="space-y-3 mb-6">
                  {cart?.items.map(item => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.productImage && <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                {shippingData && (
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 mb-6">
                    <p className="font-medium text-foreground mb-1">Shipping to:</p>
                    <p>{shippingData.firstName} {shippingData.lastName}</p>
                    <p>{shippingData.line1}{shippingData.line2 ? `, ${shippingData.line2}` : ""}</p>
                    <p>{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button className="flex-1 gap-2" onClick={placeOrder} disabled={createOrder.isPending} data-testid="button-place-order">
                    {createOrder.isPending ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>${cart?.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span><span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span><span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-foreground text-base">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
