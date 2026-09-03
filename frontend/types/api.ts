export type Role = "CUSTOMER" | "MECHANIC" | "MANAGER" | "ADMIN";
export type User = { _id?: string; id: string; name: string; email: string; phone: string; role: Role; avatarUrl?: string; isActive?: boolean; theme: string };
export type Vehicle = {
  _id: string; registrationNumber: string; make: string; model: string; manufactureYear: number;
  vehicleType: string; fuelType: string; transmission: string; colour: string;
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
};
export type ServiceRequest = {
  _id: string; customer: string; vehicle: Vehicle; assignedMechanic?: User; serviceType: string;
  problemCategory: string; description: string; urgency: string; address: string; currentStatus: string;
  estimatedDistanceKm?: number; estimatedArrivalMinutes?: number; statusHistory: { status: string; note?: string; at?: string }[];
  quotation?: { _id: string; labourFee: number; partsCost: number; serviceFee: number; taxes: number; total: number; status: string };
  payment?: { _id: string; amount: number; method: string; status: string; receiptNumber?: string };
};
