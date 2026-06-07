declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
  }
  export function sign(payload: object, secret: string, options?: SignOptions): string;
  export function verify(token: string, secret: string): { userId?: string };
  export default { sign, verify };
}
