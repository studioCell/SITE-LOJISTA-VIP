
import { Order, ShopSettings } from '../types';

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  // Se a data vier no formato AAAA-MM-DD (padrão de input date)
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export const printOrder = (order: Order, settings: ShopSettings, logoUrl: string, isAdmin: boolean = false) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return;

  const date = new Date(order.createdAt).toLocaleDateString();
  const time = new Date(order.createdAt).toLocaleTimeString();
  const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const htmlContent = `
    <html>
      <head>
        <title>Pedido #${order.id.slice(-6)}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
          .container { max-width: ${isAdmin ? '600px' : '400px'}; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .logo { max-width: 80px; margin-bottom: 10px; }
          .info { font-size: 12px; margin-bottom: 5px; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          .table { width: 100%; font-size: 12px; text-align: left; border-collapse: collapse; }
          .table th { border-bottom: 1px solid #000; padding: 5px 0; }
          .table td { padding: 5px 0; vertical-align: top; }
          .total { text-align: right; font-weight: bold; font-size: 14px; margin-top: 10px; }
          .footer { text-align: center; font-size: 10px; margin-top: 20px; }
          .prod-img { width: 40px; height: 40px; object-fit: cover; border: 1px solid #eee; margin-right: 8px; float: left; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; padding: 0; }
            .container { border: none; width: 100%; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : '<h2>LOJISTA VIP</h2>'}
            <p><strong>${isAdmin ? 'Relatório de Pedido (ADM)' : 'Comprovante de Pedido'}</strong></p>
            <p class="info">Pedido: #${order.id.slice(-6)}</p>
            <p class="info">Data: ${date} às ${time}</p>
          </div>

          <div class="customer-info">
            <p class="info"><strong>Cliente:</strong> ${order.userName}</p>
            <p class="info"><strong>Telefone:</strong> ${order.userPhone}</p>
            ${order.userCpf ? `<p class="info"><strong>CPF:</strong> ${order.userCpf}</p>` : ''}
            <p class="info"><strong>Cidade:</strong> ${order.userCity || 'Não informada'}</p>
          </div>

          <div class="divider"></div>

          <table class="table">
            <thead>
              <tr>
                <th width="15%">Qtd</th>
                <th>Item</th>
                <th style="text-align:right" width="20%">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.quantity}x</td>
                  <td>
                    ${isAdmin && item.image ? `<img src="${item.image}" class="prod-img" />` : ''}
                    <div>
                        ${item.name}
                        ${item.note ? `<br/><small>Obs: ${item.note}</small>` : ''}
                    </div>
                  </td>
                  <td style="text-align:right">R$ ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          <p class="info" style="text-align: right;">Subtotal: R$ ${subtotal.toFixed(2)}</p>
          ${order.discount ? `<p class="info" style="text-align: right; color: red;">Desconto: - R$ ${order.discount.toFixed(2)}</p>` : ''}
          ${order.shippingCost ? `<p class="info" style="text-align: right;">Frete: + R$ ${order.shippingCost.toFixed(2)}</p>` : ''}
          ${order.wantsInvoice ? `<p class="info" style="text-align: right;">Nota Fiscal (${order.invoiceTaxPercent || 6}%): + R$ ${(subtotal * ((order.invoiceTaxPercent || 6) / 100)).toFixed(2)}</p>` : ''}
          ${order.wantsInsurance ? `<p class="info" style="text-align: right;">Seguro: + R$ ${(order.insuranceTaxAmount || 0).toFixed(2)}</p>` : ''}
          
          <p class="total">TOTAL: R$ ${order.total.toFixed(2)}</p>

          <div class="divider"></div>

          <div class="footer">
            <p>Status Atual: ${order.status.toUpperCase().replace('_', ' ')}</p>
            ${!isAdmin ? `<p>Obrigado pela preferência!</p><p>${settings.contactNumber || ''}</p>` : ''}
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const generateQuotePDF = (order: Order, settings: ShopSettings, logoUrl: string) => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;

    const date = new Date(order.createdAt).toLocaleDateString();
    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const htmlContent = `
      <html>
        <head>
          <title>Orçamento #${order.id.slice(-6)}</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; max-width: 1000px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-area { display: flex; flex-direction: column; align-items: flex-start; }
            .logo { max-height: 80px; margin-bottom: 10px; }
            .company-name { font-size: 24px; font-weight: bold; color: #f97316; }
            .company-info { font-size: 12px; color: #666; margin-top: 5px; }
            
            .quote-title { text-align: right; }
            .quote-title h1 { font-size: 32px; color: #333; margin: 0; }
            .quote-meta { font-size: 14px; color: #666; margin-top: 5px; }

            .client-section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e7eb; }
            .client-section h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #f97316; letter-spacing: 1px; }
            .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
            .client-row { display: flex; gap: 5px; }
            .label { font-weight: bold; color: #555; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px 8px; background: #333; color: white; font-size: 12px; text-transform: uppercase; }
            td { padding: 15px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
            .prod-img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #eee; }
            .item-name { font-weight: bold; font-size: 14px; color: #111; }
            .item-desc { font-size: 12px; color: #666; margin-top: 2px; }
            .price-col { font-family: monospace; font-size: 14px; }

            .totals-section { display: flex; justify-content: flex-end; }
            .totals-box { width: 320px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; }
            .total-row.final { border-top: 2px solid #333; border-bottom: none; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; color: #f97316; }

            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
               ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
               <div class="company-name">${settings.shopName || 'Lojista Vip'}</div>
               <div class="company-info">
                  ${settings.contactNumber || ''}<br/>
                  Atendimento Personalizado
               </div>
            </div>
            <div class="quote-title">
               <h1>ORÇAMENTO</h1>
               <div class="quote-meta">
                  #${order.id.slice(-6)}<br/>
                  Data: ${date}
               </div>
            </div>
          </div>

          <div class="client-section">
             <h3>Dados do Cliente</h3>
             <div class="client-grid">
                <div class="client-row"><span class="label">Nome:</span> ${order.userName}</div>
                <div class="client-row"><span class="label">Telefone:</span> ${order.userPhone}</div>
                ${order.userCpf ? `<div class="client-row"><span class="label">CPF:</span> ${order.userCpf}</div>` : ''}
                ${order.userBirthDate ? `<div class="client-row"><span class="label">Nascimento:</span> ${formatDisplayDate(order.userBirthDate)}</div>` : ''}
                <div class="client-row"><span class="label">Cidade:</span> ${order.userCity || '-'}</div>
                <div class="client-row"><span class="label">Endereço:</span> ${order.userStreet ? `${order.userStreet}, ${order.userNumber}` : '-'}</div>
                <div class="client-row"><span class="label">Bairro:</span> ${order.userDistrict || '-'}</div>
                <div class="client-row"><span class="label">CEP:</span> ${order.userCep || '-'}</div>
             </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="10%">Foto</th>
                <th width="45%">Produto / Descrição</th>
                <th width="15%" style="text-align:center">Qtd</th>
                <th width="15%" style="text-align:right">Unitário</th>
                <th width="15%" style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.image ? `<img src="${item.image}" class="prod-img" />` : '-'}</td>
                  <td>
                    <div class="item-name">${item.name}</div>
                    ${item.note ? `<div class="item-desc">Obs: ${item.note}</div>` : ''}
                  </td>
                  <td style="text-align:center">${item.quantity}</td>
                  <td style="text-align:right" class="price-col">R$ ${item.price.toFixed(2)}</td>
                  <td style="text-align:right" class="price-col">R$ ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-section">
             <div class="totals-box">
                <div class="total-row">
                   <span>Subtotal:</span>
                   <span>R$ ${subtotal.toFixed(2)}</span>
                </div>
                ${order.discount ? `
                <div class="total-row" style="color:red">
                   <span>Desconto:</span>
                   <span>- R$ ${order.discount.toFixed(2)}</span>
                </div>` : ''}
                ${order.shippingCost ? `
                <div class="total-row">
                   <span>Frete (${order.shippingMethod || 'Padrão'}):</span>
                   <span>+ R$ ${order.shippingCost.toFixed(2)}</span>
                </div>` : ''}
                ${order.wantsInvoice ? `
                <div class="total-row">
                   <span>Nota Fiscal (${order.invoiceTaxPercent || 6}%):</span>
                   <span>+ R$ ${(subtotal * ((order.invoiceTaxPercent || 6) / 100)).toFixed(2)}</span>
                </div>` : ''}
                ${order.wantsInsurance ? `
                <div class="total-row">
                   <span>Taxa de Seguro:</span>
                   <span>+ R$ ${(order.insuranceTaxAmount || 0).toFixed(2)}</span>
                </div>` : ''}
                
                <div class="total-row final">
                   <span>TOTAL:</span>
                   <span>R$ ${order.total.toFixed(2)}</span>
                </div>
             </div>
          </div>

          <div class="footer">
             Este orçamento tem validade de 5 dias. <br/>
             Obrigado pela preferência!
          </div>

          <script>
             window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export const generateOrderSummaryPDF = (order: Order, settings: ShopSettings, logoUrl: string) => {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;

    const date = new Date(order.createdAt).toLocaleDateString();
    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const currentDate = new Date().toLocaleDateString();

    const htmlContent = `
      <html>
        <head>
          <title>Resumo Pedido #${order.id.slice(-6)}</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; max-width: 1000px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-area { display: flex; flex-direction: column; align-items: flex-start; }
            .logo { max-height: 80px; margin-bottom: 10px; }
            .company-name { font-size: 24px; font-weight: bold; color: #f97316; }
            .company-info { font-size: 12px; color: #666; margin-top: 5px; }
            
            .quote-title { text-align: right; }
            .quote-title h1 { font-size: 32px; color: #333; margin: 0; }
            .quote-meta { font-size: 14px; color: #666; margin-top: 5px; }

            .client-section { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e7eb; }
            .client-section h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #f97316; letter-spacing: 1px; }
            .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
            .client-row { display: flex; gap: 5px; }
            .label { font-weight: bold; color: #555; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px 8px; background: #333; color: white; font-size: 12px; text-transform: uppercase; }
            td { padding: 15px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
            .prod-img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #eee; }
            .item-name { font-weight: bold; font-size: 14px; color: #111; }
            .item-desc { font-size: 12px; color: #666; margin-top: 2px; }
            .price-col { font-family: monospace; font-size: 14px; }

            .totals-section { display: flex; justify-content: flex-end; position: relative; }
            .totals-box { width: 320px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #eee; }
            .total-row.final { border-top: 2px solid #333; border-bottom: none; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; color: #f97316; }

            .stamp {
                position: absolute;
                bottom: -20px;
                right: 340px;
                border: 3px solid #ef4444;
                color: #ef4444;
                font-size: 24px;
                font-weight: bold;
                text-transform: uppercase;
                padding: 10px 20px;
                transform: rotate(-15deg);
                opacity: 0.8;
                border-radius: 8px;
                letter-spacing: 2px;
                text-align: center;
            }
            .stamp-date { font-size: 12px; display: block; margin-top: 5px; font-weight: normal; }

            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
            
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
               ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
               <div class="company-name">${settings.shopName || 'Lojista Vip'}</div>
               <div class="company-info">
                  ${settings.contactNumber || ''}<br/>
                  Atendimento Personalizado
               </div>
            </div>
            <div class="quote-title">
               <h1>RESUMO DO PEDIDO</h1>
               <div class="quote-meta">
                  #${order.id.slice(-6)}<br/>
                  Data: ${date}
               </div>
            </div>
          </div>

          <div class="client-section">
             <h3>Dados do Cliente</h3>
             <div class="client-grid">
                <div class="client-row"><span class="label">Nome:</span> ${order.userName}</div>
                <div class="client-row"><span class="label">Telefone:</span> ${order.userPhone}</div>
                ${order.userCpf ? `<div class="client-row"><span class="label">CPF:</span> ${order.userCpf}</div>` : ''}
                ${order.userBirthDate ? `<div class="client-row"><span class="label">Nascimento:</span> ${formatDisplayDate(order.userBirthDate)}</div>` : ''}
                <div class="client-row"><span class="label">Cidade:</span> ${order.userCity || '-'}</div>
                <div class="client-row"><span class="label">Endereço:</span> ${order.userStreet ? `${order.userStreet}, ${order.userNumber}` : '-'}</div>
                <div class="client-row"><span class="label">Bairro:</span> ${order.userDistrict || '-'}</div>
                <div class="client-row"><span class="label">CEP:</span> ${order.userCep || '-'}</div>
             </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="10%">Foto</th>
                <th width="45%">Produto / Descrição</th>
                <th width="15%" style="text-align:center">Qtd</th>
                <th width="15%" style="text-align:right">Unitário</th>
                <th width="15%" style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.image ? `<img src="${item.image}" class="prod-img" />` : '-'}</td>
                  <td>
                    <div class="item-name">${item.name}</div>
                    ${item.note ? `<div class="item-desc">Obs: ${item.note}</div>` : ''}
                  </td>
                  <td style="text-align:center">${item.quantity}</td>
                  <td style="text-align:right" class="price-col">R$ ${item.price.toFixed(2)}</td>
                  <td style="text-align:right" class="price-col">R$ ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-section">
             <div class="stamp">
                PAGO
                <span class="stamp-date">${currentDate}</span>
             </div>
             <div class="totals-box">
                <div class="total-row">
                   <span>Subtotal:</span>
                   <span>R$ ${subtotal.toFixed(2)}</span>
                </div>
                ${order.discount ? `
                <div class="total-row" style="color:red">
                   <span>Desconto:</span>
                   <span>- R$ ${order.discount.toFixed(2)}</span>
                </div>` : ''}
                ${order.shippingCost ? `
                <div class="total-row">
                   <span>Frete (${order.shippingMethod || 'Padrão'}):</span>
                   <span>+ R$ ${order.shippingCost.toFixed(2)}</span>
                </div>` : ''}
                ${order.wantsInvoice ? `
                <div class="total-row">
                   <span>Nota Fiscal (${order.invoiceTaxPercent || 6}%):</span>
                   <span>+ R$ ${(subtotal * ((order.invoiceTaxPercent || 6) / 100)).toFixed(2)}</span>
                </div>` : ''}
                ${order.wantsInsurance ? `
                <div class="total-row">
                   <span>Taxa de Seguro:</span>
                   <span>+ R$ ${(order.insuranceTaxAmount || 0).toFixed(2)}</span>
                </div>` : ''}
                
                <div class="total-row final">
                   <span>TOTAL:</span>
                   <span>R$ ${order.total.toFixed(2)}</span>
                </div>
             </div>
          </div>

          <div class="footer">
             Obrigado pela sua compra! <br/>
             Este documento serve como resumo do pedido e comprovante.
          </div>

          <script>
             window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export const generateReceiptPDF = (order: Order, settings: ShopSettings, logoUrl: string) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const date = new Date().toLocaleDateString();
    
    const htmlContent = `
      <html>
        <head>
          <title>Recibo Pagamento #${order.id.slice(-6)}</title>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #000; border: 2px solid #333; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 10px 0; }
            .content { font-size: 16px; line-height: 1.6; }
            .value { font-weight: bold; font-size: 18px; }
            .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; color: #555; text-align: center; }
            .signature { margin-top: 50px; text-align: right; }
            .signature-line { border-top: 1px solid #000; display: inline-block; width: 250px; text-align: center; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" style="max-height:60px;" />` : `<h2>${settings.shopName}</h2>`}
            <div class="title">Recibo de Pagamento</div>
            <div>Pedido #${order.id.slice(-6)}</div>
          </div>

          <div class="content">
            <p>Recebemos de <strong>${order.userName}</strong> (CPF: ${order.userCpf || 'Não Informado'})</p>
            <p>A importância de <span class="value">R$ ${order.total.toFixed(2)}</span></p>
            <p>Referente à compra de produtos na loja <strong>${settings.shopName}</strong>.</p>
            <p>Forma de Pagamento: A Vista / PIX / Cartão</p>
            <p>Data do Pagamento: ${date}</p>
          </div>

          <div class="signature">
             <div class="signature-line">
                Assinatura do Responsável
             </div>
          </div>

          <div class="footer">
             <p><strong>INFORMAÇÕES IMPORTANTES:</strong></p>
             <p>• O pedido será conferido rigorosamente antes do envio.</p>
             <p>• Você será avisado assim que for despachado, juntamente com o código de rastreio.</p>
             <p>• Garantia de 30 dias contra defeitos de fabricação (conforme política da loja).</p>
             <p>${settings.contactNumber}</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
