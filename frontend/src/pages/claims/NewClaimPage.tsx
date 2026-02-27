import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Stepper } from "../../components/ui/Stepper";
import { Card } from "../../components/ui/Card";
import { FileUpload } from "../../components/ui/FileUpload";
import { useClaimsStore } from "../../store/claimsStore";
import { apiGetVehicleOptions } from "../../lib/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Send, Car } from "lucide-react";

const claimSchema = z.object({
  policyNumber: z
    .string()
    .min(5, "Policy number must be at least 5 characters"),
  vehicleCompany: z.string().min(1, "Please select vehicle company"),
  vehicleModel: z.string().min(1, "Please select vehicle model"),
  description: z.string().optional(),
  incidentDate: z.string().optional(),
  location: z.string().optional(),
});

type ClaimFormData = z.infer<typeof claimSchema>;

const steps = [
  { label: "Vehicle Info", description: "Policy details" },
  { label: "Damage Photos", description: "Upload images" },
  { label: "Review", description: "Confirm & submit" },
];

export function NewClaimPage() {
  const navigate = useNavigate();
  const createClaim = useClaimsStore((s) => s.createClaim);
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [companyOptions, setCompanyOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [modelsByCompany, setModelsByCompany] = useState<
    Record<string, string[]>
  >({});
  const [optionsLoading, setOptionsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      policyNumber: "",
      vehicleCompany: "",
      vehicleModel: "",
      description: "",
      incidentDate: "",
      location: "",
    },
  });

  const formValues = watch();
  const selectedCompany = watch("vehicleCompany");
  const modelOptions = ((modelsByCompany[selectedCompany] || []) as string[]).map((model) => ({
    value: model,
    label: model,
  }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiGetVehicleOptions();
        if (!mounted) return;
        setCompanyOptions(
          data.companies.map((company) => ({ value: company, label: company })),
        );
        setModelsByCompany(data.models_by_company || {});
      } catch {
        if (!mounted) return;
        setSubmitError("Failed to load vehicle options. Please refresh.");
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleNext = async () => {
    let valid = false;
    if (currentStep === 0) {
      valid = await trigger(["policyNumber", "vehicleCompany", "vehicleModel"]);
    } else if (currentStep === 1) {
      valid = files.length > 0;
      if (!valid) setSubmitError("Please upload at least one damage photo");
      else setSubmitError(null);
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

  const onSubmit = async (data: ClaimFormData) => {
    if (files.length === 0) {
      setSubmitError("Please upload at least one damage photo");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const claim = await createClaim(
        files,
        data.policyNumber,
        data.vehicleCompany,
        data.vehicleModel,
        data.description || undefined,
        data.incidentDate || undefined,
        data.location || undefined,
      );
      navigate(`/claims/${claim.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[{ label: "Claims", href: "/claims" }, { label: "New Claim" }]}
      />

      <div>
        <div className="flex items-center gap-3 mb-1">
          <Car className="h-6 w-6 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">
            File a Motor Damage Claim
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos of vehicle damage for instant AI-powered assessment.
        </p>
      </div>

      <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

      <Card padding="lg" className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Vehicle & Policy Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">
                Vehicle & Policy Information
              </h2>
              <Input
                label="Policy Number"
                placeholder="e.g. POL-COMP-12345"
                error={errors.policyNumber?.message}
                required
                {...register("policyNumber")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Vehicle Company"
                  options={companyOptions}
                  placeholder="Select company"
                  error={errors.vehicleCompany?.message}
                  required
                  defaultValue=""
                  disabled={optionsLoading}
                  {...register("vehicleCompany")}
                />
                <Select
                  label="Vehicle Model"
                  options={modelOptions}
                  placeholder={
                    selectedCompany
                      ? "Select model"
                      : "Select company first"
                  }
                  error={errors.vehicleModel?.message}
                  required
                  defaultValue=""
                  disabled={optionsLoading || !selectedCompany || modelOptions.length === 0}
                  {...register("vehicleModel")}
                />
              </div>
              <Textarea
                label="Description (optional)"
                placeholder="Describe what happened — e.g. rear-ended at traffic light..."
                rows={3}
                {...register("description")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Incident Date"
                  type="date"
                  {...register("incidentDate")}
                />
                <Input
                  label="Location"
                  placeholder="e.g. Highway 101, Hyderabad"
                  {...register("location")}
                />
              </div>
            </div>
          )}

          {/* Step 2: Damage Photos */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-2">
                Upload Damage Photos
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Upload clear photos of all damaged areas. Our AI will detect the
                damage zones (Front, Rear, Left Side, Right Side) and assess
                severity.
              </p>
              <FileUpload
                accept=".jpg,.jpeg,.png"
                onFilesChange={(f) => {
                  setFiles(f);
                  if (f.length > 0) setSubmitError(null);
                }}
              />
              {files.length === 0 && submitError && (
                <p className="text-xs text-red-400">{submitError}</p>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Review Your Claim
              </h2>

              <div className="bg-dark-700/50 rounded-xl p-4 border border-white/[0.06] space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Policy Number</p>
                    <p className="font-medium text-gray-200">
                      {formValues.policyNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Incident Date</p>
                    <p className="font-medium text-gray-200">
                      {formValues.incidentDate || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vehicle</p>
                    <p className="font-medium text-gray-200">
                      {formValues.vehicleCompany} {formValues.vehicleModel}
                    </p>
                  </div>
                  {formValues.description && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Description</p>
                      <p className="font-medium text-gray-200">
                        {formValues.description}
                      </p>
                    </div>
                  )}
                  {formValues.location && (
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-200">
                        {formValues.location}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Damage Photos</p>
                    <p className="font-medium text-gray-200">
                      {files.length} photo{files.length !== 1 ? "s" : ""}{" "}
                      attached
                    </p>
                  </div>
                </div>
              </div>

              {/* Image previews */}
              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="aspect-video rounded-lg overflow-hidden border border-white/[0.06]"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Damage photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <p className="text-sm text-red-400 text-center">
                  {submitError}
                </p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
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
                Submit & Analyze
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
