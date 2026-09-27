export interface TechnicianProfileDto {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    bio: string | null;
    certifications: string[];
    rating: number;
    jobsCompletedCount: number;
    phone: string | null;
}
export interface LiveTelemetryDto {
    isLive: boolean;
    latitude: number | null;
    longitude: number | null;
    lastLocationUpdate: Date | null;
    estimatedEtaMinutes: number | null;
    distanceKm: number | null;
}
export interface LiveTrackingResponseDto {
    jobId: string;
    title: string;
    description: string | null;
    status: string;
    scheduledAt: Date | null;
    estimatedDuration: number;
    enRouteAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    customerAddress: string | null;
    technician: TechnicianProfileDto | null;
    telemetry: LiveTelemetryDto;
    completionOtp: string | null;
}
