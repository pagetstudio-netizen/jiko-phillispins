import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import buildingImg from "@assets/file_000000008ed8720a9a149bc45896943c_1779479835731.png";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
              <img src={buildingImg} alt="EIFFAGE" className="w-full h-full object-cover" />
            </div>
            À propos d'EIFFAGE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            EIFFAGE est une entreprise leader dans l'automatisation industrielle propulsée par l'IA, présente dans plus de 10 pays avec une capacité installée dépassant 11 000 ingénieurs dans le monde.
          </p>
          <p>
            Leader reconnu dans l'automatisation intelligente, EIFFAGE s'engage à fournir des solutions robotiques innovantes et tournées vers l'avenir pour une croissance industrielle durable.
          </p>
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-foreground">Nos avantages :</h4>
            <ul className="space-y-1">
              <li>- Revenus quotidiens automatiques</li>
              <li>- Investissements industriels propulsés par l'IA</li>
              <li>- Système de parrainage attractif</li>
              <li>- Support client disponible</li>
            </ul>
          </div>
          <p className="text-xs">
            Version 1.0.0 - Tous droits réservés
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
