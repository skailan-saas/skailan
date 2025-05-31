
"use client";

import type { Quote } from "@/app/(app)/crm/quotes/page"; // Adjust path if needed
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Logo } from "@/components/icons/logo"; 

interface QuotePreviewProps {
  quote: Quote | null;
}

export function QuotePreview({ quote }: QuotePreviewProps) {
  if (!quote) {
    return <div className="p-10 text-center text-muted-foreground">No quote data to display.</div>;
  }

  // Placeholder tax rate
  const TAX_RATE = 0.07; // 7%
  const subtotal = quote.totalAmount / (1 + TAX_RATE); // Approximation if totalAmount includes tax
  const taxAmount = subtotal * TAX_RATE;
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="quote-print-area bg-background p-6 sm:p-8 md:p-10 max-w-4xl mx-auto print:shadow-none print:border-none">
      <Card className="shadow-none border-none print:shadow-none print:border-none">
        <CardHeader className="px-0 print:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <Logo />
              <p className="text-xs text-muted-foreground mt-1">
                Your Company Name Inc.<br />
                123 Main Street, Anytown, USA 12345<br />
                (555) 123-4567 | sales@yourcompany.com
              </p>
            </div>
            <div className="text-left sm:text-right">
              <h1 className="text-3xl font-bold text-primary">QUOTE</h1>
              <p className="text-sm"><strong>Quote #:</strong> {quote.quoteNumber}</p>
              <p className="text-sm"><strong>Date Created:</strong> {quote.dateCreated}</p>
              {quote.expiryDate && <p className="text-sm"><strong>Valid Until:</strong> {quote.expiryDate}</p>}
            </div>
          </div>
        </CardHeader>

        <Separator className="my-6" />

        <CardContent className="px-0 print:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-1 text-foreground">Bill To:</h3>
              <p className="text-sm text-muted-foreground">{quote.opportunityName}</p> {/* Changed from leadName */}
              {/* Placeholder for more client details if available via Opportunity */}
            </div>
          </div>

          <h3 className="font-semibold mb-2 text-lg text-foreground">Items:</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] print:w-auto">#</TableHead>
                <TableHead>Product / Service</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.lineItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {quote.lineItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    No items in this quote.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({ (TAX_RATE * 100).toFixed(0) }%):</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-lg">
                <span className="text-foreground">Grand Total:</span>
                <span className="text-primary">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </CardContent>

        <Separator className="my-6" />

        <CardFooter className="px-0 print:px-0 flex-col items-start gap-2">
          <div>
            <h4 className="font-semibold text-sm mb-1 text-foreground">Notes / Terms & Conditions:</h4>
            <p className="text-xs text-muted-foreground">
              - Payment is due within 30 days of quote acceptance.
              <br />
              - Prices are valid for 30 days from the date of this quote.
              <br />
              - Please contact us if you have any questions regarding this quote.
            </p>
          </div>
          <p className="text-center text-xs text-muted-foreground w-full mt-8">
            Thank you for your business!
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}


    