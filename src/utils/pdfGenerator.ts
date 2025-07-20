import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { QuoteData, CostBreakdown } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function generatePDFQuote(data: QuoteData, costs: CostBreakdown, includeVat: boolean): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Colors
  const primaryBlue = '#1e3a8a';
  const tealColor = '#0d9488';
  const lightGray = '#f3f4f6';
  const darkGray = '#374151';
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 5) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && i > 0) {
        doc.text(line.trim(), x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    doc.text(line.trim(), x, currentY);
    return currentY + lineHeight;
  };

  // Header with company branding
  doc.setFillColor(30, 58, 138); // Primary blue
  doc.rect(0, 0, pageWidth, 55, 'F');
  
  // Load and add company logo
  try {
    const logoImg = new Image();
    logoImg.src = '/Untitled design (34).png';
    
    // Wait for image to load
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
      // Fallback if image doesn't load
      setTimeout(resolve, 1000);
    });
    
    // Add logo if loaded successfully
    if (logoImg.complete && logoImg.naturalHeight !== 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = logoImg.width;
      canvas.height = logoImg.height;
      ctx?.drawImage(logoImg, 0, 0);
      const logoDataUrl = canvas.toDataURL('image/png');
      doc.addImage(logoDataUrl, 'PNG', 15, 12, 30, 30);
    } else {
      // Fallback: Create a simple circular logo placeholder
      doc.setFillColor(255, 255, 255);
      doc.circle(30, 27, 15, 'F');
      doc.setFillColor(30, 58, 138);
      doc.circle(30, 27, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('IL', 26, 30);
    }
  } catch (error) {
    // Fallback: Create a simple circular logo placeholder
    doc.setFillColor(255, 255, 255);
    doc.circle(30, 27, 15, 'F');
    doc.setFillColor(30, 58, 138);
    doc.circle(30, 27, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('IL', 26, 30);
  }
  
  // Company name and title - Better formatting
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INSPIRE E-COMMERCE', 55, 20);
  doc.text('SOLUTIONS INC.', 55, 30);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Fulfillment & Warehousing Quote', 55, 42);
  
  // Quote details in header
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 65, 20);
  doc.text(`Quote #: IL-${Date.now().toString().slice(-6)}`, pageWidth - 65, 30);

  let yPosition = 75;

  // Title section
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE QUOTE SUMMARY', 20, yPosition);
  yPosition += 20;

  // Warehousing section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 255, 255); // Cyan/Turquoise
  doc.text('WAREHOUSING REQUIREMENTS', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  const warehousingData = [
    ['Storage Type', 'Volume (CBM)', 'Duration', 'Total Cost'],
  ];

  if (data.warehousing.ambientStorage.enabled) {
    warehousingData.push([
      'Ambient Storage',
      data.warehousing.ambientStorage.averageVolume.toString(),
      `${data.warehousing.expectedMonths} months`,
      formatCurrency(costs.ambientStorage)
    ]);
  }

  if (data.warehousing.tempControlledStorage.enabled) {
    warehousingData.push([
      'Temperature-Controlled',
      data.warehousing.tempControlledStorage.averageVolume.toString(),
      `${data.warehousing.expectedMonths} months`,
      formatCurrency(costs.tempControlledStorage)
    ]);
  }

  doc.autoTable({
    startY: yPosition,
    head: [warehousingData[0]],
    body: warehousingData.slice(1),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: { 
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: [55, 65, 81],
      valign: 'middle'
    },
    alternateRowStyles: { 
      fillColor: [243, 244, 246] 
    },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Fulfillment section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 255, 255);
  doc.text('FULFILLMENT SERVICES', 20, yPosition);
  yPosition += 10;

  const fulfillmentData = [
    ['Service', 'Volume', 'Details'],
    [
      'Monthly Orders',
      data.fulfillment.monthlyOrders.toString(),
      'Pick, pack, and ship services'
    ],
    [
      'Average Items per Order',
      data.fulfillment.averageItemsPerOrder.toString(),
      `Additional items: ${formatCurrency(costs.additionalItems)}/month`
    ],
    [
      'Parcel Distribution',
      `Small: ${data.fulfillment.parcelSizeDistribution.small}%`,
      `Medium: ${data.fulfillment.parcelSizeDistribution.medium}%, Large: ${data.fulfillment.parcelSizeDistribution.large}%, Bulky: ${data.fulfillment.parcelSizeDistribution.bulky}%`
    ]
  ];

  doc.autoTable({
    startY: yPosition,
    head: [fulfillmentData[0]],
    body: fulfillmentData.slice(1),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: { 
      fillColor: [0, 255, 255],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: [55, 65, 81],
      valign: 'middle'
    },
    alternateRowStyles: { 
      fillColor: [243, 244, 246] 
    },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 50, halign: 'left' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Shipping section (if enabled)
  if (data.shipping?.enabled && costs.shipping > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 255, 255);
    doc.text('SHIPPING SERVICES (J&T EXPRESS)', 20, yPosition);
    yPosition += 10;

    const shippingData = [
      ['Service', 'Volume', 'Monthly Cost'],
      [
        'Direct-to-Consumer Shipping',
        `${data.shipping.monthlyOrders} orders/month`,
        formatCurrency(costs.shipping)
      ],
      [
        'Weight Distribution',
        `≤1kg: ${data.shipping.weightDistribution.upTo1kg}%, ≤2kg: ${data.shipping.weightDistribution.upTo2kg}%`,
        `≤3kg: ${data.shipping.weightDistribution.upTo3kg}%, ≤5kg: ${data.shipping.weightDistribution.upTo5kg}%, ≤7kg: ${data.shipping.weightDistribution.upTo7kg}%`
      ],
      [
        'Location Distribution',
        `Metro Manila: ${data.shipping.locationDistribution.metroManila}%`,
        `Outside Metro Manila: ${data.shipping.locationDistribution.outsideMetroManila}%`
      ]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [shippingData[0]],
      body: shippingData.slice(1),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: { 
        fillColor: [239, 68, 68],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [55, 65, 81],
        valign: 'middle'
      },
      alternateRowStyles: { 
        fillColor: [243, 244, 246] 
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Calculate monthly and total costs
  const months = data.warehousing.expectedMonths;
  const monthlyCosts = {
    storage: (costs.ambientStorage + costs.tempControlledStorage) / months,
    fulfillment: costs.fulfillment,
    additionalItems: costs.additionalItems,
    shipping: costs.shipping,
    subtotal: 0,
    vat: 0,
    total: 0
  };
  
  monthlyCosts.subtotal = monthlyCosts.storage + monthlyCosts.fulfillment + monthlyCosts.additionalItems + monthlyCosts.shipping;
  monthlyCosts.vat = monthlyCosts.subtotal * (includeVat ? 0.12 : 0);
  monthlyCosts.total = monthlyCosts.subtotal + monthlyCosts.vat;

  const totalCosts = {
    storage: costs.ambientStorage + costs.tempControlledStorage,
    fulfillment: costs.fulfillment * months,
    additionalItems: costs.additionalItems * months,
    shipping: costs.shipping * months,
    subtotal: 0,
    vat: 0,
    total: 0
  };
  
  totalCosts.subtotal = totalCosts.storage + totalCosts.fulfillment + totalCosts.additionalItems + totalCosts.shipping;
  totalCosts.vat = totalCosts.subtotal * (includeVat ? 0.12 : 0);
  totalCosts.total = totalCosts.subtotal + totalCosts.vat;

  // Cost breakdown section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('COST BREAKDOWN', 20, yPosition);
  yPosition += 10;

  const costData = [
    ['Cost Component', 'Monthly Cost', `Total Cost (${months} months)`],
    ['Storage (All Types)', formatCurrency(monthlyCosts.storage), formatCurrency(totalCosts.storage)],
    ['Fulfillment Services', formatCurrency(monthlyCosts.fulfillment), formatCurrency(totalCosts.fulfillment)],
  ];

  if (costs.additionalItems > 0) {
    costData.push(['Additional Items', formatCurrency(monthlyCosts.additionalItems), formatCurrency(totalCosts.additionalItems)]);
  }

  if (costs.shipping > 0) {
    costData.push(['Shipping (J&T Express)', formatCurrency(monthlyCosts.shipping), formatCurrency(totalCosts.shipping)]);
  }

  doc.autoTable({
    startY: yPosition,
    head: [costData[0]],
    body: costData.slice(1),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: { 
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: [55, 65, 81],
      valign: 'middle'
    },
    alternateRowStyles: { 
      fillColor: [243, 244, 246] 
    },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Total cost summary with visual emphasis
  doc.setFillColor(243, 244, 246);
  doc.rect(20, yPosition - 5, pageWidth - 40, 50, 'F');
  
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Monthly totals
  doc.text('Monthly Subtotal:', 25, yPosition + 5);
  doc.text(formatCurrency(monthlyCosts.subtotal), pageWidth - 80, yPosition + 5);
  
  doc.text(`Monthly VAT (12%) ${includeVat ? '- Included' : '- Excluded'}:`, 25, yPosition + 15);
  doc.text(formatCurrency(monthlyCosts.vat), pageWidth - 80, yPosition + 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 255, 255);
  doc.text('MONTHLY TOTAL:', 25, yPosition + 25);
  doc.text(formatCurrency(monthlyCosts.total), pageWidth - 80, yPosition + 25);

  // Total for entire duration
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text(`Total Subtotal (${months} months):`, 25, yPosition + 35);
  doc.text(formatCurrency(totalCosts.subtotal), pageWidth - 80, yPosition + 35);

  // Grand total with emphasis
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`GRAND TOTAL (${months} MONTHS):`, 25, yPosition + 45);
  doc.text(formatCurrency(totalCosts.total), pageWidth - 80, yPosition + 45);

  yPosition += 70;

  // Included services section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94); // Green
  doc.text('INCLUDED FREE SERVICES', 20, yPosition);
  yPosition += 10;

  const includedServices = [
    '✓ Unloading, Quality Checking, Receiving & Putaway',
    '✓ Kitting (Bundling) and Preparation Work',
    '✓ Fusion Platform Access - Complete Business Management Suite',
    '  • Order Management System (OMS)',
    '  • Warehouse Management System (WMS)',
    '  • Enterprise Resource Planning (ERP)',
    '  • Real-time inventory tracking & analytics',
    '  • Multi-channel integration & automation'
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  includedServices.forEach((service, index) => {
    doc.text(service, 25, yPosition + (index * 6));
  });

  yPosition += (includedServices.length * 6) + 15;

  // Important notes
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68); // Red
  doc.text('IMPORTANT NOTES:', 20, yPosition);
  yPosition += 8;

  const notes = [
    '• Prices are estimates only and may vary based on actual requirements',
    '• All amounts are in Philippine Pesos (₱)',
    `• VAT is ${includeVat ? 'included' : 'excluded'} in calculations`,
    '• Quote valid for 30 days from generation date',
    '• Final pricing subject to service level agreement terms',
    '• Fusion Platform access included (₱50,000+ annual value)',
    '• Storage costs: One-time for entire duration',
    '• Fulfillment costs: Monthly recurring charges'
  ];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  notes.forEach((note, index) => {
    doc.text(note, 25, yPosition + (index * 5));
  });

  // Footer with company contact information
  const footerY = pageHeight - 45;
  doc.setFillColor(30, 58, 138);
  doc.rect(0, footerY - 5, pageWidth, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INSPIRE E-COMMERCE SOLUTIONS INC.', 20, footerY + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Left side - Find Us Here
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Find Us Here', 20, footerY + 20);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Warehouse 5, C Teknik Industrial,', 20, footerY + 27);
  doc.text('143 P. Gregorio Street, Valenzuela,', 20, footerY + 33);
  doc.text('1442 Metro Manila', 20, footerY + 39);

  // Right side - Get In Touch
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Get In Touch', pageWidth - 80, footerY + 20);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('0977 041 2690', pageWidth - 80, footerY + 27);
  doc.text('support@inspiresolutions.asia', pageWidth - 80, footerY + 33);

  // Center - Professional tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Professional Fulfillment & Warehousing Solutions', pageWidth/2 - 55, footerY + 39);

  // Save the PDF
  const fileName = `Inspire_E-Commerce_Solutions_Quote_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}