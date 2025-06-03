// src/lib/domain.ts
export function getBaseDomain(): string {
  // En desarrollo usamos localhost, en producción skailan.com
  if (process.env.NODE_ENV === "development") {
    return "localhost";
  }

  // En producción, usar el dominio principal
  return process.env.NEXT_PUBLIC_BASE_DOMAIN || "skailan.com";
}

export function getFullDomain(subdomain: string): string {
  const baseDomain = getBaseDomain();

  if (baseDomain === "localhost") {
    // En desarrollo, usar el formato subdomain.localhost
    return `${subdomain}.${baseDomain}`;
  }

  // En producción, usar subdomain.skailan.com
  return `${subdomain}.${baseDomain}`;
}

export function getCurrentDomain(request?: Request): string {
  if (typeof window !== "undefined") {
    // Cliente
    return window.location.hostname;
  }

  if (request) {
    // Servidor con request
    const url = new URL(request.url);
    return url.hostname;
  }

  // Fallback para servidor
  return getBaseDomain();
}
