import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Stepper } from '../../components/ui/Stepper';
import { Card } from '../../components/ui/Card';
import { FileUpload } from '../../components/ui/FileUpload';
import { CLAIM_TYPES } from '../../constants';
import { formatCurrency } from '../../lib/utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

const claimSchema = z.object({
  type: z.string().min(1, 'Please select a claim type'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Please provide a detailed description (20+ chars)'),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  incidentDate: z.string().min(1, 'Incident date is required'),
});

type ClaimFormData = z.infer<typeof claimSchema>;

const steps = [
  { label: 'Claim Type', description: 'Select type' },
  { label: 'Details', description: 'Incident info' },
  { label: 'Documents', description: 'Upload files' },
  { label: 'Review', description: 'Confirm & submit' },
];

export function NewClaimPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      type: '',
      policyNumber: '',
      title: '',
      description: '',
      amount: '',
      incidentDate: '',
    },
  });

  const formValues = watch();

  const handleNext = async () => {
    let valid = false;
    if (currentStep === 0) {
      valid = await trigger(['type', 'policyNumber']);
    } else if (currentStep === 1) {
      valid = await trigger(['title', 'description', 'amount', 'incidentDate']);
    } else {
      valid = true;
    }

    if (valid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (_data: ClaimFormData) => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitting(false);
    navigate('/claims');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Claims', href: '/claims' },
          { label: 'New Claim' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">File a New Claim</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete all steps to submit your insurance claim.
        </p>
      </div>

      <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

      <Card padding="lg" className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Claim Type */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Claim Information</h2>
              <Select
                label="Claim Type"
                options={CLAIM_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                placeholder="Select a claim type"
                error={errors.type?.message}
                required
                {...register('type')}
              />
              <Input
                label="Policy Number"
                placeholder="e.g. POL-AUTO-12345"
                error={errors.policyNumber?.message}
                required
                {...register('policyNumber')}
              />
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
              <Input
                label="Claim Title"
                placeholder="Brief description of the incident"
                error={errors.title?.message}
                required
                {...register('title')}
              />
              <Textarea
                label="Description"
                placeholder="Provide a detailed account of what happened..."
                error={errors.description?.message}
                required
                rows={4}
                {...register('description')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Claim Amount ($)"
                  type="number"
                  placeholder="0.00"
                  error={errors.amount?.message}
                  required
                  {...register('amount')}
                />
                <Input
                  label="Incident Date"
                  type="date"
                  error={errors.incidentDate?.message}
                  required
                  {...register('incidentDate')}
                />
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Supporting Documents</h2>
              <p className="text-sm text-gray-500 mb-4">
                Upload any relevant documents such as police reports, photos, receipts, or medical records.
              </p>
              <FileUpload onFilesChange={setFiles} />
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Your Claim</h2>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Claim Type</p>
                    <p className="font-medium text-gray-900 capitalize">{formValues.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Policy Number</p>
                    <p className="font-medium text-gray-900">{formValues.policyNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Title</p>
                    <p className="font-medium text-gray-900">{formValues.title}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Description</p>
                    <p className="font-medium text-gray-900">{formValues.description}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium text-gray-900">
                      {formValues.amount ? formatCurrency(Number(formValues.amount)) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Incident Date</p>
                    <p className="font-medium text-gray-900">{formValues.incidentDate}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Documents</p>
                    <p className="font-medium text-gray-900">
                      {files.length} file{files.length !== 1 ? 's' : ''} attached
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                icon={<ArrowRight className="h-4 w-4" />}
                iconPosition="right"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                loading={submitting}
                icon={<Send className="h-4 w-4" />}
              >
                Submit Claim
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
