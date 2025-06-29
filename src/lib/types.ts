import { PostgrestError } from "@supabase/supabase-js";

export type Post = {
    id: string;
    user_id: string;
    content: string;
    image_url?: string | null;
    created_at: string;
    profiles: {
      in_game_name: string | null;
      avatar_url: string | null;
    } | null;
    like_count: number;
    user_has_liked_post: boolean;
    comment_count: number;
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
    } | null;
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
  
export interface Profile {
    id: string;
    updated_at: string;
    username: string | null;
    avatar_url: string | null;
    location: string | null;
    bio: string | null;
    player_tag: string | null;
    clan_tag: string | null;
    banner_url: string | null;
    social_links: { [key: string]: string } | null;
    role: 'admin' | 'user' | 'leader' | 'coLeader' | 'elder' | null;
    languages: string[] | null;
    in_game_name: string | null;
    active_profile_id: string | null;
}

export interface LinkedProfile {
    id: string;
    user_id: string;
    player_tag: string;
    clan_tag: string | null;
    in_game_name: string | null;
    role: 'admin' | 'user' | 'leader' | 'coLeader' | 'elder' | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Clan {
    tag: string;
    name:string;
    clanLevel: number;
    badgeUrls: {
      small: string;
      large: string;
      medium: string;
};
    warLeague?: {
      id: number;
      name: string;
    };
    memberList?: Member[];
    description?: string;
}
  
export type WarMember = {
    tag: string;
    name: string;
    mapPosition: number;
    townhallLevel: number;
    attacks?: any[]; // Simplified for now
    bestOpponentAttack?: any; // Simplified for now
};

export type WarClan = {
    tag: string;
    name: string;
    badgeUrls: { small: string, medium: string, large: string };
    clanLevel: number;
    attacks: number;
    stars: number;
    destructionPercentage: number;
    expEarned: number;
    members: WarMember[];
};

export type War = {
    state: 'notInWar' | 'preparation' | 'inWar' | 'warEnded';
    clan: WarClan;
    opponent: WarClan;
    teamSize: number;
    startTime: string;
    endTime: string;
};

export interface ClanWar {
    result: 'win' | 'lose' | 'tie';
    endTime: string;
    teamSize: number;
    attacksPerMember: number;
    clan: WarClan;
    opponent: WarClan;
}

export interface ClanProfile {
    clan_tag: string;
    description: string | null;
    recruitment_status: 'open' | 'closed' | 'invite_only';
    banner_image_url: string | null;
    created_at: string;
}

export type Badge = {
    id: string;
    name: string;
    description: string;
    icon_url: string;
};