CREATE TABLE "public"."clan_profiles" (
    "clan_tag" TEXT NOT NULL,
    "description" TEXT,
    "recruitment_status" TEXT DEFAULT 'closed',
    "banner_image_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY ("clan_tag")
);

ALTER TABLE "public"."clan_profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public clan_profiles are viewable by everyone." ON public.clan_profiles FOR SELECT USING (true);

CREATE POLICY "Clan leaders can update their own clan profile." ON public.clan_profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.clan_tag = clan_profiles.clan_tag
    AND profiles.role IN ('admin', 'leader', 'coLeader')
  )
); 