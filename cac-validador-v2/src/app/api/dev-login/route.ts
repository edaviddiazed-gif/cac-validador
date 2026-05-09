import { NextResponse, type NextRequest } from "next/server";

const DEV_ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL ?? "admin@local.test";
const DEV_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { email, password } = await request.json().catch(() => ({
    email: "",
    password: "",
  }));

  const normalizedEmail = String(email).trim().toLowerCase();
  const expectedEmail = DEV_ADMIN_EMAIL.trim().toLowerCase();
  const typedPassword = String(password ?? "");
  const passwordMatches = DEV_ADMIN_PASSWORD
    ? typedPassword === DEV_ADMIN_PASSWORD
    : typedPassword.length > 0;

  if (normalizedEmail !== expectedEmail || !passwordMatches) {
    return NextResponse.json(
      { error: "Credenciales locales inválidas" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      email: DEV_ADMIN_EMAIL,
      role: "admin_cac",
      eapbId: null,
    },
  });

  response.cookies.set("cac_dev_session", DEV_ADMIN_EMAIL, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
