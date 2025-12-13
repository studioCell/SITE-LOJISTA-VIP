import React, { useRef } from 'react';
import { Order, OrderStatus, ShopSettings } from '../types';
import { Button } from './Button';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  settings: ShopSettings | null;
  logo: string;
  isAdmin?: boolean;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  orcamento: 'Orçamento',
  realizado: 'Pedido Finalizado',
  pagamento_pendente: 'Aguard. Pagamento',
  preparacao: 'Em Preparação',
  transporte: 'Em Trânsito',
  entregue: 'Entregue',
  devolucao: 'Devolução',
  cancelado: 'Cancelado'
};

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ 
    order, 
    isOpen, 
    onClose, 
    settings, 
    logo,
    isAdmin = false
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    if (!isOpen || !order) return null;

    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const date = new Date(order.createdAt).toLocaleDateString();
    const time = new Date(order.createdAt).toLocaleTimeString();

    // Shipping info text
    const shippingText = order.shippingCost ? `R$ ${order.shippingCost.toFixed(2)}` : 'Grátis/Não Inf.';
    const methodText = order.shippingMethod || 'Padrão';
    
    // Fees
    let fees = 0;
    let feesHtml = '';
    if (order.wantsInvoice) {
        const val = subtotal * 0.06;
        fees += val;
        feesHtml += `<p class="info" style="text-align: right;">Nota Fiscal (6%): + R$ ${val.toFixed(2)}</p>`;
    }
    if (order.wantsInsurance) {
        const val = subtotal * 0.03;
        fees += val;
        feesHtml += `<p class="info" style="text-align: right;">Seguro (3%): + R$ ${val.toFixed(2)}</p>`;
    }

    const htmlContent = `
    <html>
      <head>
        <title>Pedido #${order.id.slice(-6)}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
          .container { width: 100%; max-width: 400px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; box-sizing: border-box; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .logo { max-width: 80px; margin-bottom: 10px; }
          .info { font-size: 12px; margin-bottom: 5px; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          .table { width: 100%; font-size: 12px; text-align: left; border-collapse: collapse; }
          .table th { border-bottom: 1px solid #000; padding: 5px 0; }
          .table td { padding: 5px 0; vertical-align: top; }
          .total { text-align: right; font-weight: bold; font-size: 14px; margin-top: 10px; }
          .footer { text-align: center; font-size: 10px; margin-top: 20px; }
          .prod-img { width: 30px; height: 30px; object-fit: cover; border: 1px solid #eee; margin-right: 5px; float: left; }
          @media print {
            body { margin: 0; padding: 0; }
            .container { border: none; width: 100%; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${logo ? `<img src="${logo}" class="logo" />` : '<h2>LOJISTA VIP</h2>'}
            <p><strong>${isAdmin ? 'Relatório de Pedido' : 'Comprovante de Pedido'}</strong></p>
            <p class="info">Pedido: #${order.id.slice(-6)}</p>
            <p class="info">Data: ${date} às ${time}</p>
          </div>

          <div class="customer-info">
            <p class="info"><strong>Cliente:</strong> ${order.userName}</p>
            <p class="info"><strong>Telefone:</strong> ${order.userPhone}</p>
            <p class="info"><strong>Endereço:</strong> ${order.userStreet ? `${order.userStreet}, ${order.userNumber}` : (order.userCity || 'N/A')}</p>
            ${order.userDistrict ? `<p class="info"><strong>Bairro:</strong> ${order.userDistrict}</p>` : ''}
          </div>

          <div class="divider"></div>

          <table class="table">
            <thead>
              <tr>
                <th width="15%">Qtd</th>
                <th>Item</th>
                <th style="text-align:right" width="25%">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.quantity}x</td>
                  <td>
                    ${item.image ? `<img src="${item.image}" class="prod-img" />` : ''}
                    <div>
                        ${item.name}
                        <br/>
                        <span style="font-size:10px; color:#555;">(Un. R$ ${item.price.toFixed(2)})</span>
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
          <p class="info" style="text-align: right;">Frete (${methodText}): + ${shippingText}</p>
          ${feesHtml}
          <p class="total">TOTAL: R$ ${order.total.toFixed(2)}</p>

          <div class="divider"></div>

          <div class="footer">
            <p>Status Atual: ${STATUS_LABELS[order.status] ? STATUS_LABELS[order.status].toUpperCase() : order.status.toUpperCase()}</p>
            <p>Obrigado pela preferência!</p>
            <p>${settings?.contactNumber || ''}</p>
          </div>
        </div>
      </body>
    </html>
    `;

    const handlePrint = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.print();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
             <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center p-4 border-b border-gray-100">
                     <h3 className="font-bold text-gray-800">Visualizar Impressão</h3>
                     <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                     </button>
                 </div>
                 
                 <div className="flex-grow bg-gray-50 p-4 overflow-hidden">
                     <iframe 
                        ref={iframeRef}
                        className="w-full h-full bg-white shadow-sm border border-gray-200"
                        srcDoc={htmlContent}
                        title="Print Preview"
                     />
                 </div>

                 <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                     <Button variant="outline" onClick={onClose}>Cancelar</Button>
                     <Button onClick={handlePrint} className="!bg-zinc-800 hover:!bg-zinc-900 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                         </svg>
                         Imprimir
                     </Button>
                 </div>
             </div>
        </div>
    );
};