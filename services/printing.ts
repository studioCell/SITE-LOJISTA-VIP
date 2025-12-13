import { Order, ShopSettings } from '../types';

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
            <p class="info"><strong>Cidade:</strong> ${settings.contactNumber ? '' : 'Não informada'}</p>
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
          <p class="info" style="text-align: right;">Desconto: - R$ ${(order.discount || 0).toFixed(2)}</p>
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