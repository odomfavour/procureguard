import { NextResponse } from 'next/server';
// MSFLib owns browser token storage and session validation. The authenticated
// layout gates rendering; the API must enforce authorization on every request.
export function proxy() { return NextResponse.next(); }
export const config = { matcher: ['/dashboard/:path*'] };
