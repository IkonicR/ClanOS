import { Liveblocks } from "@liveblocks/node";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret || !secret.startsWith("sk_")) {
    // This will be visible in the server logs
    console.error("LIVEBLOCKS_SECRET_KEY is not set or invalid in .env.local");
    // And the client will see a 500 error with a clear JSON response
    return NextResponse.json(
      {
        message:
          "LIVEBLOCKS_SECRET_KEY is not set or invalid in the server environment. Please check your .env.local file.",
      },
      { status: 500 }
    );
  }

  const liveblocks = new Liveblocks({
    secret,
  });
  
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 403 });
  }

  // For the user's avatar and name in Liveblocks
  const userInfo = {
    name: user.user_metadata.name || "Teammate",
    picture: user.user_metadata.avatar_url || "/default-avatar.png",
  };

  const session = liveblocks.prepareSession(user.id, { userInfo });

  const { room } = await request.json();
  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
} 