const configuredGatewayUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL?.trim();

const gatewayUrl = configuredGatewayUrl
    ? configuredGatewayUrl.replace(/\/$/, "")
    : "http://localhost:4000";

export function buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${gatewayUrl}${normalizedPath}`;
}
