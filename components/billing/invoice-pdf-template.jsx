import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatNumber } from "@/lib/format";
import { toDecimal } from "@/lib/money";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    paddingBottom: 10,
    marginBottom: 15,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "heavy",
    fontFamily: "Helvetica-Bold",
    color: "#522874",
    marginBottom: 4,
  },
  headerText: {
    fontSize: 9,
    marginBottom: 2,
    color: "#555",
  },
  boldText: {
    fontFamily: "Helvetica-Bold",
    color: "#000",
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  billToContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 15,
  },
  billToLeft: {
    flex: 1,
  },
  billToRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 2,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#1f2937",
    color: "#fff",
    padding: 4,
  },
  tableColHeaderItem: {
    width: "40%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#1f2937",
    color: "#fff",
    padding: 4,
  },
  tableColHeaderSmall: {
    width: "10%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#1f2937",
    color: "#fff",
    padding: 4,
    textAlign: "center",
  },
  tableColHeaderRight: {
    width: "15%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#1f2937",
    color: "#fff",
    padding: 4,
    textAlign: "right",
  },
  tableCol: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
  },
  tableColItem: {
    width: "40%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
  },
  tableColSmall: {
    width: "10%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
    textAlign: "center",
  },
  tableColRight: {
    width: "15%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
    textAlign: "right",
  },
  tableCellHeader: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  tableCell: {
    fontSize: 9,
  },
  itemMainText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  itemSubText: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: "#000",
    paddingTop: 10,
  },
  taxBreakdown: {
    width: "45%",
  },
  totalsContainer: {
    width: "45%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    padding: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    marginTop: 4,
  },
  grandTotalText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  terms: {
    width: "60%",
    fontSize: 8,
    color: "#666",
  },
  signature: {
    width: "35%",
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#666",
    marginBottom: 4,
  },
});

export default function InvoicePDF({ invoiceData }) {
  const formattedDate = new Date(invoiceData.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const hasGst = Boolean(invoiceData.customer?.gstNumber);
  const isIgst = hasGst && !invoiceData.customer.gstNumber.startsWith("23");

  const cgstSgstAmount = isIgst ? toDecimal(0) : toDecimal(invoiceData.totalGst).div(2);
  const igstAmount = isIgst ? toDecimal(invoiceData.totalGst) : toDecimal(0);

  const roundOffAmount = Number(invoiceData.grandTotal) - (Number(invoiceData.subtotal) + Number(invoiceData.totalGst));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.companyName}>UNNATI TRADERS</Text>
            <Text style={styles.headerText}>
              <Text style={styles.boldText}>Shop: </Text>
              {invoiceData.location?.name || "Unnati Traders"}
            </Text>
            {invoiceData.location?.address && (
              <Text style={styles.headerText}>
                <Text style={styles.boldText}>Add: </Text>
                {invoiceData.location.address}
              </Text>
            )}
            <Text style={styles.headerText}>
              <Text style={styles.boldText}>Phone: </Text>
              +91 8770552396 , +91 9827620625
            </Text>
            <Text style={styles.headerText}>
              <Text style={styles.boldText}>GSTIN: </Text>
              23ASOPC2921N2Z0
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceTitle}>Tax Invoice</Text>
            <Text style={styles.headerText}>
              <Text style={styles.boldText}>Invoice No: </Text>
              {invoiceData.invoiceNumber}
            </Text>
            <Text style={styles.headerText}>
              <Text style={styles.boldText}>Date: </Text>
              {formattedDate}
            </Text>
            <Text style={{ fontSize: 7, color: "#9ca3af", marginTop: 4 }}>
              Issued under Rule 46 of CGST Rules
            </Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billToContainer}>
          <View style={styles.billToLeft}>
            <Text style={styles.sectionTitle}>Billed To:</Text>
            <Text style={styles.headerText}>
              <Text style={styles.boldText}>Customer: </Text>
              {invoiceData.customer?.name}
            </Text>
            <Text style={styles.headerText}>
              <Text style={styles.boldText}>Phone: </Text>
              {invoiceData.customer?.phone || "N/A"}
            </Text>
            {invoiceData.customer?.address && (
              <Text style={styles.headerText}>
                <Text style={styles.boldText}>Address: </Text>
                {invoiceData.customer.address}
              </Text>
            )}
            {invoiceData.customer?.gstNumber && (
              <Text style={styles.headerText}>
                <Text style={styles.boldText}>GSTIN: </Text>
                {invoiceData.customer.gstNumber}
              </Text>
            )}
          </View>
          <View style={styles.billToRight}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
              TYPE: {invoiceData.customer?.type.replace("_", " ")}
            </Text>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#522874" }}>
              PAYMENT: {invoiceData.paymentMode === "MULTIPLE" ? "SPLIT" : invoiceData.paymentMode}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeaderSmall}>
              <Text style={styles.tableCellHeader}>#</Text>
            </View>
            <View style={styles.tableColHeaderItem}>
              <Text style={styles.tableCellHeader}>Item Description</Text>
            </View>
            <View style={styles.tableColHeaderSmall}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
            <View style={styles.tableColHeaderRight}>
              <Text style={styles.tableCellHeader}>Rate</Text>
            </View>
            <View style={styles.tableColHeaderRight}>
              <Text style={styles.tableCellHeader}>Total</Text>
            </View>
          </View>

          {invoiceData.items.map((item, index) => (
            <View style={styles.tableRow} key={index} wrap={false}>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={styles.tableColItem}>
                <Text style={styles.itemMainText}>
                  {item.product?.modelName || "Unknown Item"} {item.product?.size ? `(${item.product.size})` : ""}
                </Text>
                <Text style={styles.itemSubText}>
                  HSN: {item.product?.hsnCode || "4011"} | SKU: {item.product?.sku || "N/A"}
                  {item.tyreCode ? ` | SN: ${item.tyreCode}` : ""}
                </Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={[styles.tableCell, styles.boldText]}>{item.quantity}</Text>
              </View>
              <View style={styles.tableColRight}>
                <Text style={styles.tableCell}>{`₹${formatNumber(item.unitPrice, 2)}`}</Text>
              </View>
              <View style={styles.tableColRight}>
                <Text style={[styles.tableCell, styles.boldText]}>{`₹${formatNumber(item.totalPrice, 2)}`}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer} wrap={false}>
          <View style={styles.taxBreakdown}>
            <Text style={styles.sectionTitle}>Tax Breakdown</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.headerText}>Taxable Amount:</Text>
              <Text style={[styles.headerText, styles.boldText]}>{`₹${formatNumber(invoiceData.subtotal, 2)}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.headerText}>CGST:</Text>
              <Text style={[styles.headerText, styles.boldText]}>{`₹${formatNumber(cgstSgstAmount, 2)}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.headerText}>SGST:</Text>
              <Text style={[styles.headerText, styles.boldText]}>{`₹${formatNumber(cgstSgstAmount, 2)}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.headerText}>IGST:</Text>
              <Text style={[styles.headerText, styles.boldText]}>{`₹${formatNumber(igstAmount, 2)}`}</Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 4, marginTop: 2 }]}>
              <Text style={styles.headerText}>Total Tax:</Text>
              <Text style={[styles.headerText, styles.boldText]}>{`₹${formatNumber(invoiceData.totalGst, 2)}`}</Text>
            </View>
          </View>

          <View style={styles.totalsContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.headerText}>Taxable Value:</Text>
              <Text style={[styles.headerText, styles.boldText]}>{`₹${formatNumber(invoiceData.subtotal, 2)}`}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.headerText}>Total GST:</Text>
              <Text style={[styles.headerText, styles.boldText]}>{`₹${formatNumber(invoiceData.totalGst, 2)}`}</Text>
            </View>
            {roundOffAmount > 0.001 && (
              <View style={styles.summaryRow}>
                <Text style={styles.headerText}>Round Off:</Text>
                <Text style={styles.headerText}>{`+${roundOffAmount.toFixed(2)}`}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalText}>Grand Total</Text>
              <Text style={[styles.grandTotalText, { color: "#522874" }]}>{`₹${formatNumber(invoiceData.grandTotal, 2)}`}</Text>
            </View>

            {(invoiceData.paymentMode === "CREDIT" || invoiceData.paymentMode === "MULTIPLE") && (
              <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.headerText, styles.boldText]}>Paid: {`₹${formatNumber(invoiceData.amountPaid, 2)}`}</Text>
                  <Text style={[styles.headerText, styles.boldText, { color: "#ea580c" }]}>
                    Due: {`₹${formatNumber(invoiceData.grandTotal - invoiceData.amountPaid, 2)}`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.terms}>
            <Text style={[styles.boldText, { marginBottom: 2 }]}>Terms & Conditions:</Text>
            <Text>1. Goods once sold will not be taken back without valid reason.</Text>
            <Text>2. Warranty claims are subject to Apollo Tyres official policies.</Text>
            <Text>3. All disputes subject to Bhind Jurisdiction.</Text>
            <Text style={{ marginTop: 10, fontSize: 7, color: "#9ca3af", textTransform: "uppercase" }}>
              This is a computer-generated tax invoice.
            </Text>
          </View>
          <View style={styles.signature}>
            <View style={styles.signatureLine}></View>
            <Text style={[styles.boldText, { fontSize: 9 }]}>For UNNATI TRADERS</Text>
            <Text style={{ fontSize: 8, color: "#666", marginTop: 2 }}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
