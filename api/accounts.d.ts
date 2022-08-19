export interface Account {
    user_agent: string;
    client_id: string;
    client_secret: string;
    account_name: string;
    password: string;
    post_karma: number;
    comment_karma: number;
    is_sold: boolean;
    is_harvested: boolean;
    is_suspended: boolean;
    cake_day: number;
}
