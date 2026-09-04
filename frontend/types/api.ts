export type Role = "CUSTOMER" | "MECHANIC" | "MANAGER" | "ADMIN";
export type ProfileStatus = "payment_pending" | "pending_verification" | "approved" | "rejected";

export type User = {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  isActive?: boolean;
  theme: string;
  auth0Sub?: string;
  phoneVerified?: boolean;
};

export type Vehicle = {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  manufactureYear: number;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  colour: string;
};

export type RegistrationPayment = {
  _id: string;
  amount: number;
  currency: string;
  method: string;
  status: "pending" | "paid" | "failed";
  receiptNumber?: string;
  paidAt?: string;
};

export type MechanicProfile = {
  _id: string;
  user: User;
  serviceCenter?: { _id: string; name: string; address?: string };
  skills: string[];
  supportedVehicleTypes: string[];
  isVerified: boolean;
  isOnline: boolean;
  rating: number;
  profileStatus: ProfileStatus;
  registrationPayment?: RegistrationPayment | null;
  verificationDocs?: string[];
  rejectionReason?: string;
};

export type ServiceRequest = {
  _id: string;
  customer: string;
  vehicle: Vehicle;
  assignedMechanic?: User;
  serviceType: string;
  problemCategory: string;
  description: string;
  urgency: string;
  address: string;
  currentStatus: string;
  breakdownLocation?: { type?: string; coordinates?: [number, number] };
  estimatedDistanceKm?: number;
  estimatedArrivalMinutes?: number;
  statusHistory: { status: string; note?: string; at?: string }[];
  quotation?: { _id: string; labourFee: number; partsCost: number; serviceFee: number; taxes: number; total: number; status: string };
  payment?: { _id: string; amount: number; method: string; status: string; receiptNumber?: string };
  createdAt?: string;
  updatedAt?: string;
};
