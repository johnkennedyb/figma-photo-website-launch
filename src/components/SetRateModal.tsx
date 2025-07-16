import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (usdRate: number | null, ngnRate: number | null) => void;
  isSubmitting: boolean;
  initialUsd?: number;
  initialNgn?: number;
}

const SetRateModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, isSubmitting, initialUsd, initialNgn }) => {
  const [usdRate, setUsdRate] = useState<string>(initialUsd?.toString() || '');
  const [ngnRate, setNgnRate] = useState<string>(initialNgn?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = usdRate.trim() ? parseFloat(usdRate) : null;
    const ngn = ngnRate.trim() ? parseFloat(ngnRate) : null;
    if (usd == null && ngn == null) return;
    onSubmit(usd, ngn);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Session Rates</DialogTitle>
          <DialogDescription>Enter counselor session rates in USD and/or NGN.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usdRate" className="text-right">USD Rate</Label>
              <Input
                id="usdRate"
                type="number"
                value={usdRate}
                onChange={e => setUsdRate(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 50"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ngnRate" className="text-right">NGN Rate</Label>
              <Input
                id="ngnRate"
                type="number"
                value={ngnRate}
                onChange={e => setNgnRate(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 25000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SetRateModal;
