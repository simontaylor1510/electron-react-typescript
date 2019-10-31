import { Commit } from './commit';

export interface Namespace {
    id: number;
    name: string;
    path: string;
    kind: string;
}

export interface GroupAccess {
    access_level: number;
    notification_level: number;
}

export interface Permissions {
    project_access?: any;
    group_access: GroupAccess;
}

export interface Project {
    id: number;
    description: string;
    default_branch: string;
    tag_list: string[];
    public: boolean;
    archived: boolean;
    visibility_level: number;
    ssh_url_to_repo: string;
    http_url_to_repo: string;
    web_url: string;
    name: string;
    name_with_namespace: string;
    path: string;
    path_with_namespace: string;
    container_registry_enabled: boolean;
    issues_enabled: boolean;
    merge_requests_enabled: boolean;
    wiki_enabled: boolean;
    builds_enabled: boolean;
    snippets_enabled: boolean;
    created_at: Date;
    last_activity_at: Date;
    shared_runners_enabled: boolean;
    lfs_enabled: boolean;
    creator_id: number;
    namespace: Namespace;
    avatar_url?: any;
    star_count: number;
    forks_count: number;
    open_issues_count: number;
    public_builds: boolean;
    shared_with_groups: any[];
    only_allow_merge_if_build_succeeds: boolean;
    request_access_enabled: boolean;
    only_allow_merge_if_all_discussions_are_resolved: boolean;
    approvals_before_merge: number;
    permissions: Permissions;
    last_commit: Commit;
    needs_permissions_stick_shaking: boolean;
}
