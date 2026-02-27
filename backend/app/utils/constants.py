# Vehicle zones for damage classification
VEHICLE_ZONES = ["Front", "Rear", "Left Side", "Right Side"]

# Severity levels
SEVERITY_LEVELS = ["minor", "moderate", "severe"]

# Allowed image MIME types
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"]

# Max image size in bytes (10 MB)
MAX_IMAGE_SIZE = 10 * 1024 * 1024

# Max images per claim
MAX_IMAGES_PER_CLAIM = 5

# Max image dimension (resize before ML inference)
MAX_IMAGE_DIMENSION = 1920

# Fraud thresholds
FRAUD_SIMILARITY_THRESHOLD = 0.92
FRAUD_FREQUENCY_LIMIT = 3
FRAUD_FREQUENCY_MONTHS = 6

# Decision thresholds
DECISION_AUTO_APPROVE_FRAUD_MAX = 30
DECISION_AUTO_APPROVE_COST_MAX = 15000  # INR
DECISION_REJECT_FRAUD_MIN = 80
DECISION_HIGH_COST_THRESHOLD = 50000  # INR
