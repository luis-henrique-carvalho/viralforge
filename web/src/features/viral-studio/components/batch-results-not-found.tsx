import { Link } from '@tanstack/react-router'
import { ArrowLeft, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export interface BatchResultsNotFoundProps {
  batchId: string
  errorMessage?: string
}

export function BatchResultsNotFound({ batchId, errorMessage }: BatchResultsNotFoundProps) {
  return (
    <Card className="p-12 text-center border-destructive/30 bg-destructive/5 space-y-4">
      <XCircle className="size-10 text-destructive mx-auto" />
      <div>
        <Typography variant="h3">Lote não encontrado</Typography>
        <Typography
          variant="muted"
          className="mt-1"
        >
          {errorMessage || `Não foi possível carregar os detalhes do lote #${batchId}.`}
        </Typography>
      </div>
      <Button
        asChild
        variant="outline"
      >
        <Link to="/viral-studio">
          <ArrowLeft className="size-4 mr-2" />
          Voltar aos Lotes
        </Link>
      </Button>
    </Card>
  )
}
