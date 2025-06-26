import { PostgrestError } from "@supabase/supabase-js";

export type Post = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    } | null;
    like_count: number;
    user_has_liked_post: boolean;
  };
  
export interface Comment {
    id: string;
    content: string;
    created_at: string;
    post_id: string;
    user_id: string;
    profiles: {
        username: string;
        avatar_url: string | null;
    };
}

export interface Member {
    tag: string;
    name: string;
    role: 'member' | 'admin' | 'coLeader' | 'leader';
    townHallLevel: number;
    expLevel: number;
    league: {
      id: number;
      name: 'Unranked' | 'Bronze League III' | 'Bronze League II' | 'Bronze League I' | 'Silver League III' | 'Silver League II' | 'Silver League I' | 'Gold League III' | 'Gold League II' | 'Gold League I' | 'Crystal League III' | 'Crystal League II' | 'Crystal League I' | 'Master League III' | 'Master League II' | 'Master League I' | 'Champion League III' | 'Champion League II' | 'Champion League I' | 'Titan League III' | 'Titan League II' | 'Titan League I' | 'Legends League';
      iconUrls: {
        small: string;
        tiny: string;
        medium?: string;
      };
    };
    trophies: number;
    versusTrophies: number;
    clanRank: number;
    previousClanRank: number;
    donations: number;
    donationsReceived: number;
}
  
export type MemberWithFriendship = Member & {
    profile_id: string | null;
    friendship: {
        id: string;
        status: 'pending' | 'accepted' | 'blocked';
        isRequester: boolean;
    } | null;
};
  
export type Profile = {
    id: string;
    username: string;
    avatar_url?: string;
    player_tag?: string;
    clan_tag?: string;
    role?: 'admin' | 'user';
};