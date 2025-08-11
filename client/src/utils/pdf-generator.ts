import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ContractData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  ownerName: string;
  ownerEmail: string;
  products: Array<{
    name: string;
    quantity: number;
    basePrice: number;
    totalPrice: number;
  }>;
  startDate: string;
  endDate: string;
  totalAmount: number;
  termsAndConditions: string[];
}

export function generateRentalContract(contractData: ContractData): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(13, 148, 136); // Renti-teal color
  doc.text('RENTIVERSE', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('RENTAL AGREEMENT CONTRACT', 105, 30, { align: 'center' });
  
  // Order Information
  doc.setFontSize(12);
  doc.text(`Contract Number: ${contractData.orderNumber}`, 20, 50);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
  
  // Parties Information
  doc.setFontSize(14);
  doc.text('PARTIES TO THE AGREEMENT', 20, 80);
  
  doc.setFontSize(10);
  doc.text('RENTER (Customer):', 20, 95);
  doc.text(`Name: ${contractData.customerName}`, 25, 105);
  doc.text(`Email: ${contractData.customerEmail}`, 25, 115);
  
  doc.text('OWNER (Product Provider):', 20, 130);
  doc.text(`Name: ${contractData.ownerName}`, 25, 140);
  doc.text(`Email: ${contractData.ownerEmail}`, 25, 150);
  
  // Rental Details
  doc.setFontSize(14);
  doc.text('RENTAL DETAILS', 20, 170);
  
  doc.setFontSize(10);
  doc.text(`Rental Period: ${contractData.startDate} to ${contractData.endDate}`, 20, 185);
  
  // Products Table
  const tableData = contractData.products.map(product => [
    product.name,
    product.quantity.toString(),
    `₹${product.basePrice}`,
    `₹${product.totalPrice}`
  ]);
  
  (doc as any).autoTable({
    startY: 195,
    head: [['Product Name', 'Quantity', 'Rate', 'Total']],
    body: tableData,
    foot: [['', '', 'Total Amount:', `₹${contractData.totalAmount}`]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [13, 148, 136] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' }
  });
  
  // Terms and Conditions
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(14);
  doc.text('TERMS AND CONDITIONS', 20, finalY);
  
  doc.setFontSize(8);
  let yPosition = finalY + 15;
  contractData.termsAndConditions.forEach((term, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${term}`, 170);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 5;
  });
  
  // Signatures
  yPosition += 20;
  doc.setFontSize(10);
  doc.text('SIGNATURES', 20, yPosition);
  yPosition += 15;
  
  doc.text('Renter Signature: ____________________', 20, yPosition);
  doc.text('Date: ____________', 120, yPosition);
  yPosition += 20;
  
  doc.text('Owner Signature: ____________________', 20, yPosition);
  doc.text('Date: ____________', 120, yPosition);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This contract is generated automatically by Rentiverse platform.', 105, 280, { align: 'center' });
  doc.text('For any disputes, please contact support@rentiverse.com', 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`rental-contract-${contractData.orderNumber}.pdf`);
}

export function getDefaultTermsAndConditions(): string[] {
  return [
    'The renter agrees to use the rented items responsibly and return them in the same condition as received.',
    'Any damage to the rented items during the rental period will be charged to the renter at replacement cost.',
    'The renter must return the items on or before the agreed return date. Late returns may incur additional charges.',
    'The renter is responsible for the safety and security of the rented items during the rental period.',
    'Payment must be made in full before the items are delivered or picked up.',
    'Cancellations must be made at least 24 hours before the rental start date for a full refund.',
    'The owner reserves the right to inspect the items upon return and charge for any necessary cleaning or repairs.',
    'Neither party shall be liable for any indirect, incidental, or consequential damages.',
    'This agreement shall be governed by the laws of India and any disputes shall be resolved in the courts of Mumbai.',
    'Both parties acknowledge that they have read, understood, and agree to be bound by these terms and conditions.'
  ];
}
