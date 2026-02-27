import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';
import { CheckCircle, XCircle, Flag, AlertTriangle } from 'lucide-react';

interface DecisionPanelProps {
  claimNumber: string;
  onDecision: (decision: 'approve' | 'deny' | 'flag', notes: string) => void;
  className?: string;
}

export function DecisionPanel({ claimNumber, onDecision, className }: DecisionPanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'deny' | 'flag' | null>(null);
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');

  const handleAction = (decision: 'approve' | 'deny' | 'flag') => {
    setPendingDecision(decision);
    setShowConfirm(true);
  };

  const confirmDecision = () => {
    if (!notes.trim()) {
      setNotesError('Please provide a reason for your decision.');
      return;
    }
    if (pendingDecision) {
      onDecision(pendingDecision, notes);
    }
    setShowConfirm(false);
    setNotes('');
    setNotesError('');
    setPendingDecision(null);
  };

  const decisionConfig = {
    approve: {
      title: 'Approve Claim',
      icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
      description: `Are you sure you want to approve claim ${claimNumber}?`,
      confirmVariant: 'primary' as const,
    },
    deny: {
      title: 'Deny Claim',
      icon: <XCircle className="h-5 w-5 text-red-400" />,
      description: `Are you sure you want to deny claim ${claimNumber}?`,
      confirmVariant: 'danger' as const,
    },
    flag: {
      title: 'Flag for Review',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
      description: `Are you sure you want to flag claim ${claimNumber} for further review?`,
      confirmVariant: 'primary' as const,
    },
  };

  const config = pendingDecision ? decisionConfig[pendingDecision] : null;

  return (
    <>
      <div className={cn('flex flex-wrap gap-3', className)}>
        <Button
          variant="primary"
          icon={<CheckCircle className="h-4 w-4" />}
          onClick={() => handleAction('approve')}
        >
          Approve
        </Button>
        <Button
          variant="danger"
          icon={<XCircle className="h-4 w-4" />}
          onClick={() => handleAction('deny')}
        >
          Deny
        </Button>
        <Button
          variant="outline"
          icon={<Flag className="h-4 w-4" />}
          onClick={() => handleAction('flag')}
        >
          Flag for Review
        </Button>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setPendingDecision(null);
          setNotes('');
          setNotesError('');
        }}
        title={config?.title || ''}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {config?.icon}
            <p className="text-sm text-gray-400">{config?.description}</p>
          </div>

          <Textarea
            label="Decision Notes"
            placeholder="Provide a reason for your decision..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (notesError) setNotesError('');
            }}
            error={notesError}
            required
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConfirm(false);
                setPendingDecision(null);
                setNotes('');
                setNotesError('');
              }}
            >
              Cancel
            </Button>
            <Button variant={config?.confirmVariant || 'primary'} onClick={confirmDecision}>
              Confirm {config?.title}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
