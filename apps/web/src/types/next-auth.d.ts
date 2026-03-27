import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    isTC?: boolean;
    isScout?: boolean;
    clearance?: number;
    doelgroepen?: string[];
    authMethode?: string;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      isTC?: boolean;
      isScout?: boolean;
      clearance?: number;
      doelgroepen?: string[];
      authMethode?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string | null;
    isTC?: boolean;
    isScout?: boolean;
    clearance?: number;
    doelgroepen?: string[];
    provider?: string;
    authMethode?: string;
  }
}
