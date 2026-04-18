const express = require('express');
const db = require('../config/db');
const { requireLogin } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const router = express.Router();

router.use(requireLogin);

// Helper function to generate a professional email receipt
function generateEmailHTML(orderId, shipping, items, subtotal, tax, total, method) {
  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #e9ecef;">
      <td style="padding: 12px 10px; color: #333;">${item.title}</td>
      <td style="padding: 12px 10px; text-align: center; color: #555;">${item.quantity}</td>
      <td style="padding: 12px 10px; text-align: right; color: #333;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #2c3e50; color: #ffffff; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">BookMart</h1>
        <p style="margin: 8px 0 0; font-size: 16px; opacity: 0.9;">Order Confirmation</p>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Thank you for your order, ${shipping.name}!</h2>
        <p style="color: #555; line-height: 1.5;">Your order <strong>#${orderId}</strong> (Paid via ${method}) has been successfully placed. Here is your receipt:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 15px;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
              <th style="padding: 12px 10px; text-align: left; color: #495057;">Item</th>
              <th style="padding: 12px 10px; text-align: center; color: #495057;">Qty</th>
              <th style="padding: 12px 10px; text-align: right; color: #495057;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr><td colspan="2" style="padding: 12px 10px; text-align: right; color: #555;">Subtotal:</td><td style="padding: 12px 10px; text-align: right; color: #333;">$${subtotal.toFixed(2)}</td></tr>
            <tr><td colspan="2" style="padding: 12px 10px; text-align: right; color: #555;">Tax (8%):</td><td style="padding: 12px 10px; text-align: right; color: #333;">$${tax.toFixed(2)}</td></tr>
            <tr style="background-color: #f8f9fa;"><td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold; color: #2c3e50; font-size: 16px;">Total:</td><td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #2c3e50; font-size: 16px;">$${total.toFixed(2)}</td></tr>
          </tfoot>
        </table>
        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #2c3e50;">
          <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">Shipping Destination</h3>
          <p style="margin: 0; color: #555; line-height: 1.6;"><strong>${shipping.name}</strong><br>${shipping.address}<br>${shipping.city}, ${shipping.state || ''} ${shipping.zip}<br>${shipping.country}</p>
        </div>
      </div>
    </div>
  `;
}

// Helper function to generate a PDF receipt buffer
function generatePDFReceipt(orderId, shipping, items, subtotal, tax, total, method) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Colors & Fonts
    const colorDark = '#2c3e50';
    const colorGray = '#555555';
    const colorLightGray = '#e0e0e0';

    // Header
    doc.fillColor(colorDark).fontSize(28)
       .font('Helvetica-Bold').text('BookMart', { align: 'center' });
    doc.fillColor(colorGray).font('Helvetica').fontSize(12).text('INVOICE / RECEIPT', { align: 'center' }).moveDown(2);
    
    // Top Section (Order Info & Shipping)
    const topY = doc.y;
    
    doc.font('Helvetica-Bold').fontSize(12).fillColor(colorDark).text('Order Details:', 50, topY);
    doc.font('Helvetica').fontSize(10).fillColor(colorGray)
       .text(`Order Number: #${orderId}`, 50, topY + 15)
       .text(`Date: ${new Date().toLocaleDateString()}`, 50, topY + 30)
       .text(`Payment Method: ${method}`, 50, topY + 45);

    doc.font('Helvetica-Bold').fontSize(12).fillColor(colorDark).text('Billed To:', 300, topY);
    doc.font('Helvetica').fontSize(10).fillColor(colorGray)
       .text(shipping.name, 300, topY + 15)
       .text(shipping.address, 300, topY + 30)
       .text(`${shipping.city}, ${shipping.state || ''} ${shipping.zip}`, 300, topY + 45)
       .text(shipping.country, 300, topY + 60);

    // Table Header
    let y = topY + 100;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(colorDark);
    doc.text('Item Description', 50, y);
    doc.text('Price', 350, y, { width: 70, align: 'right' });
    doc.text('Qty', 420, y, { width: 40, align: 'center' });
    doc.text('Total', 460, y, { width: 85, align: 'right' });

    // Table Header Line
    doc.moveTo(50, y + 15).lineTo(545, y + 15).lineWidth(1).strokeColor(colorLightGray).stroke();
    
    y += 25;
    doc.font('Helvetica').fillColor(colorGray);

    items.forEach(item => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      const textHeight = doc.heightOfString(item.title, { width: 280 });
      
      doc.text(item.title, 50, y, { width: 280 });
      doc.text(`$${Number(item.price).toFixed(2)}`, 350, y, { width: 70, align: 'right' });
      doc.text(item.quantity.toString(), 420, y, { width: 40, align: 'center' });
      doc.text(`$${lineTotal}`, 460, y, { width: 85, align: 'right' });
      
      y += textHeight + 10; 
    });
    
    // Bottom Line & Totals
    doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor(colorLightGray).stroke();
    y += 15;

    doc.font('Helvetica').fontSize(10).fillColor(colorGray);
    doc.text('Subtotal:', 350, y, { width: 110, align: 'right' });
    doc.text(`$${subtotal.toFixed(2)}`, 460, y, { width: 85, align: 'right' });
    y += 15;

    doc.text('Tax (8%):', 350, y, { width: 110, align: 'right' });
    doc.text(`$${tax.toFixed(2)}`, 460, y, { width: 85, align: 'right' });
    y += 15;

    doc.font('Helvetica-Bold').fontSize(12).fillColor(colorDark);
    doc.text('Total:', 350, y, { width: 110, align: 'right' });
    doc.text(`$${total.toFixed(2)}`, 460, y, { width: 85, align: 'right' });

    // Footer message
    doc.moveDown(4);
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(colorGray)
       .text('Thank you for shopping with BookMart!', 50, doc.y, { align: 'center', width: 495 });

    doc.end();
  });
}

// Helper function to handle sending the email and generating the PDF asynchronously
function sendConfirmationEmail(orderId, shipping, items, subtotal, tax, total, method) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  
  // Run in background so it doesn't slow down the checkout API response
  (async () => {
    try {
      const pdfBuffer = await generatePDFReceipt(orderId, shipping, items, subtotal, tax, total, method);
      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
      
      await transporter.sendMail({
        from: `"BookMart" <${process.env.EMAIL_USER}>`,
        to: shipping.email,
        subject: `Order Confirmation - #${orderId}`,
        html: generateEmailHTML(orderId, shipping, items, subtotal, tax, total, method),
        attachments: [{ filename: `BookMart-Receipt-${orderId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
      });
    } catch (err) { console.error('Failed to send email with PDF:', err); }
  })();
}

router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
    res.json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/', async (req, res) => {
  const { method, shipping, paymentRef } = req.body;
  const userId = req.session.userId;
  try {
    const [items] = await db.query(`
      SELECT c.product_id, c.quantity, p.price, p.title 
      FROM cart_items c JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?`, [userId]);
    
    if (items.length === 0) return res.status(400).json({ success: false, message: 'Cart empty.' });

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const status = method === 'COD' ? 'pending' : 'paid';

    const [orderResult] = await db.query(`
      INSERT INTO orders (user_id, subtotal, tax, total, status, shipping_name, shipping_email, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, subtotal, tax, total, status, shipping.name, shipping.email, shipping.address, shipping.city, shipping.state || null, shipping.zip, shipping.country]);
    
    const newOrderId = orderResult.insertId;

    for (let item of items) {
      await db.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [newOrderId, item.product_id, item.quantity, item.price]);
      await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    // Send confirmation email with PDF
    sendConfirmationEmail(newOrderId, shipping, items, subtotal, tax, total, method);

    res.json({ success: true, orderId: newOrderId });
  } catch (err) { 
    console.error('\n❌ DB Error in POST /orders:', err);
    res.status(500).json({ success: false, message: 'Order failed: ' + err.message }); 
  }
});

router.post('/create-paypal-order', async (req, res) => {
  res.json({ success: true, orderID: 'DEV-MOCK-' + Date.now() });
});

router.post('/capture-paypal-order', async (req, res) => {
  const { orderID, shipping } = req.body;
  const userId = req.session.userId;
  try {
    const [items] = await db.query(`
      SELECT c.product_id, c.quantity, p.price, p.title 
      FROM cart_items c JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?`, [userId]);
    
    if (items.length === 0) return res.status(400).json({ success: false, message: 'Cart empty.' });

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const [orderResult] = await db.query(`
      INSERT INTO orders (user_id, subtotal, tax, total, status, shipping_name, shipping_email, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, paypal_order_id)
      VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, subtotal, tax, total, shipping.name, shipping.email, shipping.address, shipping.city, shipping.state || null, shipping.zip, shipping.country, orderID]);
    
    const newOrderId = orderResult.insertId;

    for (let item of items) {
      await db.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [newOrderId, item.product_id, item.quantity, item.price]);
      await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    // Send confirmation email with PDF
    sendConfirmationEmail(newOrderId, shipping, items, subtotal, tax, total, 'PayPal');

    res.json({ success: true, orderId: newOrderId });
  } catch (err) { 
    console.error('\n❌ DB Error in /capture-paypal-order:', err);
    res.status(500).json({ success: false, message: 'Capture failed: ' + err.message }); 
  }
});

module.exports = router;