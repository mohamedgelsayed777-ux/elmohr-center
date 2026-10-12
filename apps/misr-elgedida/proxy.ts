import { NextResponse, type NextRequest } from "next/server";

// Standalone preview scaffold: no authentication or database is connected yet.
// Protected business features must not be added until server-side authorization exists.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
