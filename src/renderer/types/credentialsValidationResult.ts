interface CredentialsValidationResult {
    failureReason: string | null;
    invalidCredentials: boolean;
    success: boolean;
}