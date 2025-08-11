import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  duration: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  status: string;
}

export class PDFQuotationGenerator {
  private static COMPANY_NAME = "Rentiverse";
  private static COMPANY_ADDRESS = "123 Business Street, Technology Park, Mumbai, Maharashtra 400001";
  private static COMPANY_PHONE = "+91 98765 43210";
  private static COMPANY_EMAIL = "info@rentiverse.com";

  static generateQuotation(orderDetails: OrderDetails): jsPDF {
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(this.COMPANY_NAME, 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_ADDRESS, 20, 35);
    doc.text(`Phone: ${this.COMPANY_PHONE} | Email: ${this.COMPANY_EMAIL}`, 20, 42);
    
    // Quotation Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL QUOTATION', 20, 60);
    
    // Order Information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const orderInfoY = 75;
    doc.text(`Quotation #: ${orderDetails.orderNumber}`, 20, orderInfoY);
    doc.text(`Date: ${new Date(orderDetails.createdAt).toLocaleDateString()}`, 20, orderInfoY + 7);
    doc.text(`Status: ${orderDetails.status.toUpperCase()}`, 20, orderInfoY + 14);
    
    // Customer Information
    doc.text('Bill To:', 120, orderInfoY);
    doc.text(orderDetails.customerName, 120, orderInfoY + 7);
    doc.text(orderDetails.customerEmail, 120, orderInfoY + 14);
    
    // Rental Period
    doc.text(`Rental Period: ${new Date(orderDetails.startDate).toLocaleDateString()} - ${new Date(orderDetails.endDate).toLocaleDateString()}`, 20, orderInfoY + 28);
    
    // Items Table
    const tableData = orderDetails.items.map(item => [
      item.productName,
      item.quantity.toString(),
      `₹${item.price.toFixed(2)}`,
      item.duration,
      `₹${(item.quantity * item.price).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [['Product', 'Qty', 'Rate', 'Duration', 'Amount']],
      body: tableData,
      startY: orderInfoY + 40,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' }
      }
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ₹${orderDetails.total.toFixed(2)}`, 140, finalY);
    
    // Terms and Conditions
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const termsY = finalY + 20;
    doc.text('Terms & Conditions:', 20, termsY);
    doc.text('1. All rentals are subject to availability and confirmation.', 20, termsY + 7);
    doc.text('2. Security deposit may be required for high-value items.', 20, termsY + 14);
    doc.text('3. Late returns may incur additional charges.', 20, termsY + 21);
    doc.text('4. Damage or loss of rented items will be charged at replacement cost.', 20, termsY + 28);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for choosing Rentiverse!', 20, termsY + 45);
    
    return doc;
  }

  static downloadQuotation(orderDetails: OrderDetails) {
    const pdf = this.generateQuotation(orderDetails);
    pdf.save(`Quotation-${orderDetails.orderNumber}.pdf`);
  }

  static viewQuotation(orderDetails: OrderDetails) {
    const pdf = this.generateQuotation(orderDetails);
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  }
}