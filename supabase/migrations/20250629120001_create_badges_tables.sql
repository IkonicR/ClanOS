CREATE TABLE "public"."badges" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."clan_badges" (
    "clan_tag" TEXT NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY ("clan_tag", "badge_id"),
    FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."clan_badges" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone." ON public.badges FOR SELECT USING (true);
CREATE POLICY "Clan badges are viewable by everyone." ON public.clan_badges FOR SELECT USING (true);

-- For now, only admins can create badges
CREATE POLICY "Admins can create badges." ON public.badges FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- For now, only admins can assign badges to clans
CREATE POLICY "Admins can assign badges to clans." ON public.clan_badges FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
); 