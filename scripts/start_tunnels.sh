#!/usr/bin/env bash
# Gerenciamento dos Túneis Cloudflare para ViralForge & Postiz
# Carrega variáveis locais de .env se existir
if [ -f .env ]; then
  export $(grep -E '^[A-Za-z_]+=' .env | xargs)
fi

DOMAIN="${CLOUDFLARE_DOMAIN:-yourdomain.com}"
ACTION=${1:-status}

case "$ACTION" in
  start)
    echo "Iniciando serviço Cloudflare Tunnel..."
    systemctl --user start cloudflared.service
    ;;
  stop)
    echo "Parando serviço Cloudflare Tunnel..."
    systemctl --user stop cloudflared.service
    ;;
  restart)
    echo "Reiniciando serviço Cloudflare Tunnel..."
    systemctl --user restart cloudflared.service
    ;;
  status)
    ;;
  *)
    echo "Uso: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

echo ""
echo "============================================================"
echo "🎯 STATUS DO CLOUDFLARE TUNNEL (${DOMAIN})"
echo "============================================================"
systemctl --user status cloudflared.service --no-pager | head -n 8
echo "------------------------------------------------------------"
echo "🔗 Postiz (Porta 4007):      https://postiz.${DOMAIN}"
echo "🔗 API Backend (Porta 8000):   https://api.${DOMAIN}"
echo "🔗 Dashboard (Porta 5176):     https://studio.${DOMAIN}"
echo "============================================================"
echo "Comandos úteis:"
echo "  $0 restart   # Reiniciar túnel"
echo "  $0 stop      # Parar túnel"
echo "  $0 start     # Iniciar túnel"
