import { Link } from '@tanstack/react-router'
import { ArrowLeft, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface BatchResultsNotFoundProps {
  batchId: string
  errorMessage?: string
}

export function BatchResultsNotFound({ batchId, errorMessage }: BatchResultsNotFoundProps) {
  return (
    <Card className="p-12 text-center border-destructive/30 bg-destructive/5 space-y-4">
      <XCircle className="size-10 text-destructive mx-auto" />
      <div>
        <h2 className="text-lg font-bold text-foreground">Lote não encontrado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {errorMessage || `Não foi possível carregar os detalhes do lote #${batchId}.`}
        </p>
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
