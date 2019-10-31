export interface Commit {
    id: string;
    short_id: string;
    title: string;
    author_name: string;
    author_email: string;
    created_at: Date;
    committer_name: string;
    committer_email: string;
    message: string;
    fromSubModule: string;
}
