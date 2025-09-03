import { NextResponse } from "next/server";

const DEMO_USER = {
    email: "example@gmail.com",
    password: "password123",
};

export async function POST(request: Request) {
    const { email, password } = await request.json();

    if(email === DEMO_USER.email && password === DEMO_USER.password){
        return NextResponse.json({
            success: true,
            message: "Login successful",
            token: "jwt-token",
            user : {email},
        });
    }

    return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
    );
}