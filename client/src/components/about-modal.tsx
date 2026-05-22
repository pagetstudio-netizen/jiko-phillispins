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
              <img src={buildingImg} alt="Noviqra Ai" className="w-full h-full object-cover" />
            </div>
            About Noviqra Ai
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Noviqra Ai is a leading AI-powered industrial automation company, present in over 7 countries with an installed capacity exceeding 11,000 engineers worldwide.
          </p>
          <p>
            A recognized leader in intelligent automation, Noviqra Ai is committed to providing innovative and future-ready robotic solutions for sustainable industrial growth.
          </p>
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-foreground">Our advantages:</h4>
            <ul className="space-y-1">
              <li>- Automatic daily earnings</li>
              <li>- AI-powered industrial investments</li>
              <li>- Attractive referral system</li>
              <li>- Customer support available</li>
            </ul>
          </div>
          <p className="text-xs">
            Version 1.0.0 - All rights reserved
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
