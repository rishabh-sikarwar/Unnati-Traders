import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ArrowLeft,
  Store,
  Smartphone,
  QrCode,
  ShieldCheck,
  Receipt,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import OrderLivePoller from "@/components/store/OrderLivePoller";
import CustomerPaymentAction from "@/components/store/CustomerPaymentAction";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Order #${id.slice(0, 8)} | Unnati Traders`,
  };
}

export default async function OrderDetailPage({ params }) {
  const { id } = await params;

  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  if (!dbUser) {
    redirect("/api/auth/sync");
  }

  const order = await prisma.dealerOrder.findUnique({
    where: { id },
    include: {
      location: true,
      user: true,
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      invoice: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Authorization check: Order owner, ADMIN, or assigned Shopkeeper
  const isOwner = order.userId === clerkUser.id;
  const isAdmin = dbUser.role === "ADMIN";
  const isShopkeeper = dbUser.role === "SHOPKEEPER" && dbUser.locationId === order.locationId;

  if (!isOwner && !isAdmin && !isShopkeeper) {
    redirect("/dashboard");
  }

  const shop = order.location;
  const invoice = order.invoice;

  // UPI configuration with safe defaults
  const shopUpiId = shop?.upiId || "9425126868@okbizaxis";
  const shopName = shop?.name || "Unnati Traders";
  const grandTotal = invoice ? Number(invoice.grandTotal) : 0;
  const upiLink = `upi://pay?pa=${shopUpiId}&pn=${encodeURIComponent(shopName)}&am=${grandTotal}&cu=INR`;
  // Prioritize Cloudinary uploaded QR code from shop settings, fallback to dynamic QR generation
  const dynamicQrLink = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  const qrUrl =
    shop?.upiQrUrl && typeof shop.upiQrUrl === "string" && shop.upiQrUrl.trim() !== ""
      ? shop.upiQrUrl.trim()
      : dynamicQrLink;

  // Status Stepper helpers
  const isPending = order.status === "PENDING";
  const isPaymentSubmitted = order.status === "PAYMENT_SUBMITTED";
  const isBilled =
    (order.status === "BILLED" ||
      order.status === "PAYMENT_SUBMITTED" ||
      order.status === "COMPLETED") &&
    order.status !== "CANCELLED";
  const isCompleted = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-28 md:pt-32 px-4 md:px-8">
      {/* Background Live Poller for automatic status sync */}
      <OrderLivePoller orderId={order.id} currentStatus={order.status} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#522874] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-xs text-gray-500 font-mono">
            Booking ID: {order.id}
          </span>
        </div>

        {/* Order Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {order.orderNumber}
              </h1>
              {order.status === "PENDING" && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                  <Clock className="w-3 h-3 mr-1 inline" /> Pending Bill
                </Badge>
              )}
              {order.status === "BILLED" && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  <Receipt className="w-3 h-3 mr-1 inline" /> Bill Ready • Awaiting Payment
                </Badge>
              )}
              {order.status === "PAYMENT_SUBMITTED" && (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 animate-pulse">
                  <Clock className="w-3 h-3 mr-1 inline" /> Payment Claimed • Verification Pending
                </Badge>
              )}
              {order.status === "COMPLETED" && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Fulfilled
                </Badge>
              )}
              {order.status === "CANCELLED" && (
                <Badge className="bg-red-100 text-red-800 border-red-300">
                  <AlertCircle className="w-3 h-3 mr-1 inline" /> Cancelled
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Placed on {format(new Date(order.createdAt), "dd MMMM yyyy, hh:mm a")} • Branch:{" "}
              <span className="font-semibold text-gray-800">{shop?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/store">
              <Button variant="outline" size="sm" className="border-gray-200">
                Browse Catalogue
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Status Stepper */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
            Fulfillment Progress
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-900 mt-2">Booking Placed</p>
              <p className="text-[11px] text-gray-400">Stock reserved</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  isBilled
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                    : "bg-amber-400 text-white shadow-md shadow-amber-200"
                }`}
              >
                {isBilled ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <p className="text-xs font-bold text-gray-900 mt-2">Shopkeeper Billing</p>
              <p className="text-[11px] text-gray-400">
                {isBilled ? "Invoice Generated" : "Awaiting review"}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  isCompleted
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                    : isPaymentSubmitted
                    ? "bg-amber-500 text-white shadow-md shadow-amber-200 animate-pulse"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isPaymentSubmitted ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  3
                )}
              </div>
              <p className="text-xs font-bold text-gray-900 mt-2">
                {isCompleted
                  ? "Order Complete"
                  : isPaymentSubmitted
                  ? "Payment Verification & Dispatch"
                  : "Payment & Dispatch"}
              </p>
              <p className="text-[11px] text-gray-400">
                {isCompleted
                  ? "Payment Received"
                  : isPaymentSubmitted
                  ? "Awaiting shopkeeper approval"
                  : "Awaiting payment"}
              </p>
            </div>
          </div>
        </div>

        {/* PENDING STATE NOTIFICATION */}
        {isPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 text-base">
                  Booking Under Review
                </h3>
                <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                  Wait for the shopkeeper to confirm stock and generate your final bill.
                  Special B2B wholesale rates will be applied on the final GST invoice.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-800 gap-2">
              <span>Fulfilling Shop: <strong>{shop?.name}</strong></span>
              <span>Need urgent confirmation? Contact shop at <strong>+91 94251 26868</strong></span>
            </div>
          </div>
        )}

        {/* CANCELLED STATE NOTIFICATION */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 text-base">
                  Booking Cancelled
                </h3>
                <p className="text-sm text-red-800 mt-1 leading-relaxed">
                  This wholesale booking was cancelled because the associated tax invoice was deleted or cancelled by the shop administrator.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-red-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-red-800 gap-2">
              <span>Fulfilling Shop: <strong>{shop?.name}</strong></span>
              <span>Contact branch at <strong>+91 94251 26868</strong></span>
            </div>
          </div>
        )}

        {/* BILLED / COMPLETED STATE: INVOICE & UPI PAYMENT CARD */}
        {isBilled && invoice && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Invoice Breakdown (3 cols) */}
            <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    Official Tax Invoice
                  </span>
                  <h3 className="text-lg font-black text-gray-900 mt-1">
                    {invoice.invoiceNumber}
                  </h3>
                </div>
                <Link
                  href={`/billing/receipt/${invoice.id}`}
                  target="_blank"
                  className="inline-block"
                >
                  <Button size="sm" className="bg-[#522874] hover:bg-[#432060] text-white flex items-center gap-1.5 shadow-sm">
                    <Printer className="w-3.5 h-3.5" />
                    Print Receipt
                  </Button>
                </Link>
              </div>

              {/* Finalized Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                      <th className="py-2">Item</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Rate</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 font-medium text-gray-800">
                          <div>{it.product?.modelName || "Tyre"}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {it.product?.size} • {it.product?.brand}
                          </div>
                        </td>
                        <td className="py-2.5 text-center font-bold text-gray-700">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 text-right font-medium text-gray-600">
                          ₹{Number(it.unitPrice).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 text-right font-bold text-gray-900">
                          ₹{Number(it.totalPrice).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation breakdown */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold text-gray-800">
                    ₹{Number(invoice.subtotal).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST (28%):</span>
                  <span className="font-semibold text-gray-800">
                    ₹{Number(invoice.totalGst).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>Grand Total:</span>
                  <span className="text-[#522874]">
                    ₹{Number(invoice.grandTotal).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* UPI QR Code Payment Card OR Completed State Confirmation (2 cols) */}
            {isCompleted ? (
              <div className="md:col-span-2 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-6 rounded-2xl shadow-sm border border-emerald-200 flex flex-col justify-between text-center space-y-4">
                <div className="my-auto space-y-3 py-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-sm mx-auto">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Payment Verified
                  </div>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900">
                      Payment Received
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 max-w-[220px] mx-auto">
                      Shopkeeper has verified your payment. Your tyres are ready for pickup or dispatch.
                    </p>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-emerald-100 text-xs">
                  <p className="text-gray-500 font-medium">Fulfilling Location</p>
                  <p className="font-bold text-gray-900">{shopName}</p>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 bg-gradient-to-br from-purple-50 via-white to-purple-100/50 p-6 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-between text-center space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#522874] bg-white px-3 py-1 rounded-full shadow-sm mb-3">
                    <QrCode className="w-3.5 h-3.5" />
                    Instant UPI Payment
                  </div>
                  <h4 className="text-base font-extrabold text-gray-900">
                    Scan to Pay Shopkeeper
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Scan QR from another phone, or tap the button below if on mobile.
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Scan using GPay, PhonePe, Paytm, or BHIM
                  </p>
                </div>

                {/* QR Image */}
                <div className="bg-white p-3 rounded-2xl shadow-md border border-purple-100 inline-block mx-auto max-w-[200px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`UPI QR code for ${shopName}`}
                    className="w-44 h-44 object-contain mx-auto rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-purple-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">UPI ID / VPA</p>
                    <p className="text-xs font-bold text-gray-800 font-mono">{shopUpiId}</p>
                  </div>

                  {/* 1-Tap Mobile UPI Link (Visible only on mobile devices) */}
                  <div className="md:hidden block w-full mt-3">
                    <Button asChild className="w-full bg-[#522874] hover:bg-[#432060] text-white py-2.5 font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
                      <a href={upiLink}>
                        <Smartphone className="w-4 h-4"/>
                        Pay ₹{grandTotal.toLocaleString("en-IN")} via UPI App
                      </a>
                    </Button>
                  </div>

                  {/* Customer Payment Confirmation & UTR Submission Action */}
                  <div className="pt-2 border-t border-purple-100/80">
                    <CustomerPaymentAction
                      orderId={order.id}
                      status={order.status}
                      paymentReference={order.paymentReference || ""}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Requested Items (for PENDING or reference) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#522874]" />
            Requested Stock Items
          </h3>

          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-bold text-gray-900">{item.product?.modelName}</p>
                  <p className="text-xs text-gray-500">
                    Size: {item.product?.size} • Brand: {item.product?.brand}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-[#522874] text-base">
                    {item.quantity} Units
                  </span>
                </div>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Customer Note / Remarks</p>
              <p className="text-xs text-gray-700 mt-1 italic">&ldquo;{order.notes}&rdquo;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
