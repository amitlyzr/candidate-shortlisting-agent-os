import { NextRequest } from "next/server";
import { db } from "./prisma";


export interface AuthUser {
    id: string; // MongoDB ObjectId
    userId: string; // Lyzr user ID
    email: string;
    orgId: string;
    token: string;
}

/**
 * Get authenticated user from request headers
 * Headers expected: x-user-id, x-email, x-org-id, x-token
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
    const userId = request.headers.get("x-user-id");
    const email = request.headers.get("x-email");
    const orgId = request.headers.get("x-org-id");
    const token = request.headers.get("x-token");

    if (!userId || !email || !orgId || !token) {
        return null;
    }

    // Get or create user in database
    let user = await db.user.findUnique({
        where: { userId }
    });

    if (!user) {
        // Create new user
        user = await db.user.create({
            data: {
                userId,
                email,
                orgId,
                token
            }
        });
    } else {
        // Update user data if changed
        user = await db.user.update({
            where: { userId },
            data: {
                email,
                orgId,
                token
            }
        });
    }

    return {
        id: user.id,
        userId: user.userId,
        email: user.email,
        orgId: user.orgId,
        token: user.token
    };
}

/**
 * Create auth error response
 */
export function authErrorResponse() {
    return Response.json(
        { error: "Unauthorized. Please provide valid authentication headers." },
        { status: 401 }
    );
}
