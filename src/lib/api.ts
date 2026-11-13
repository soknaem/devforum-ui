import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
};

export type PageResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
};

export type CursorPageResponse<T> = {
  content: T[];
  nextCursor?: string | null;
  hasMore: boolean;
};

export type AuthUser = {
  userId: number;
  username: string;
  email: string;
};

export type Resource = {
  id: string | number;
  title: string;
  description?: string;
  url?: string;
  type?: string;
  status?: ResourceStatus;
  categoryId?: string | number;
  categoryName?: string;
  authorId: string | number;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  tags: string[];
  media: Media[];
  /** Ordered body (text and files in the author's order). Only on the single-resource response. */
  blocks?: ContentBlock[] | null;
  /** ARCHIVED only: when it was archived and when it will be deleted automatically. */
  archivedAt?: string | null;
  purgeAt?: string | null;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  bookmarked?: boolean;
  myReaction?: string | null;
  /** The viewer's "Interested" / "Not interested" choice (feed + detail only). */
  myPreference?: ResourcePreference | null;
  /** Computed by the API for the viewer (owner or admin). Only reliable in the feed + detail. */
  canEdit?: boolean;
  canDelete?: boolean;
  /** "For you" feed: not seen yet ("New"), and why it was recommended. */
  unseen?: boolean;
  reason?: string | null;
  sharedFromId?: string | number;
  sharedFromTitle?: string;
  sharedFromAuthorUsername?: string;
  /** Full content of the original post when this resource is a share. */
  sharedFrom?: Resource | null;
  createdAt: string;
  updatedAt: string;
};

export type UserSummary = {
  id: number;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export type Interests = {
  /** Tags the user picked. */
  tags: string[];
  /** Tags learned from what they read, save and react to. */
  learned: string[];
  /** Popular tags to add with one click. */
  suggestions: string[];
};

// ---- reports + admin panel ----
export type ReportTarget = "RESOURCE" | "COMMENT" | "USER";
export type ReportReason = "SPAM" | "ABUSE" | "INAPPROPRIATE" | "COPYRIGHT" | "OTHER";
export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export type AdminStats = {
  users: number;
  admins: number;
  suspendedUsers: number;
  resourcesPublished: number;
  resourcesDraft: number;
  resourcesArchived: number;
  comments: number;
  reactions: number;
  openReports: number;
  daily: { date: string; users: number; resources: number; comments: number }[];
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: string;
  suspended: boolean;
  suspendedReason?: string | null;
  createdAt: string;
  resourceCount: number;
  commentCount: number;
};

export type AdminComment = {
  id: number;
  content: string;
  authorUsername: string;
  resourceId: number;
  resourceTitle: string;
  createdAt: string;
};

export type AdminReport = {
  id: number;
  targetType: ReportTarget;
  targetId: number;
  targetLabel: string;
  targetOwner?: string | null;
  resourceId?: number | null;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  reporter: string;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

export type AdminAudit = {
  id: number;
  admin: string;
  action: string;
  targetType?: string | null;
  targetId?: number | null;
  details?: string | null;
  createdAt: string;
};

export type NotificationScope = "ALL" | "FOLLOWING" | "INTERESTING";

export type ResourceStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

export type ContentBlock = {
  id: string | number;
  type: "TEXT" | "MEDIA";
  text?: string | null;
  media?: Media | null;
};

export type ResourceCounts = {
  published: number;
  draft: number;
  archived: number;
};

export type ResourcePreference = "INTERESTED" | "NOT_INTERESTED";

export type Media = {
  id: string | number;
  fileName: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  mediaType: string;
  resourceId?: string | number;
};

export type Comment = {
  id: string | number;
  content: string;
  resourceId: string | number;
  authorId: string | number;
  authorUsername: string;
  parentId?: string | number;
  replyCount: number;
  reactionCount: number;
  bookmarked?: boolean;
  myReaction?: string | null;
  edited: boolean;
  /** Computed by the API for the current viewer (owner or admin). */
  canEdit?: boolean;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ForumContentBlock = {
  type: "TEXT" | "CODE" | "IMAGE" | "LINK" | "FILE";
  text?: string;
  language?: string;
  url?: string;
  title?: string;
  alt?: string;
  mediaId?: string | number;
  fileName?: string;
  contentType?: string;
};

export type ForumCategory = {
  key: string;
  label: string;
  description: string;
};

export type ForumTopic = {
  id: string | number;
  title: string;
  categoryKey: string;
  categoryLabel: string;
  summary?: string;
  blocks?: ForumContentBlock[];
  authorId: string | number;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  replyCount: number;
  viewCount: number;
  /** First image of the topic (set in lists too, where `blocks` is empty). */
  coverImageUrl?: string | null;
  /** The original discussion when this topic is a share. */
  sharedFrom?: ForumTopic | null;
  canEdit?: boolean;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ForumReply = {
  id: string | number;
  topicId: string | number;
  blocks: ForumContentBlock[];
  authorId: string | number;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  id: string | number;
  username: string;
  email?: string;
  /** ROLE_USER or ROLE_ADMIN */
  role?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  location?: string;
  website?: string;
  followerCount: number;
  followingCount: number;
  resourceCount: number;
  /** True when the logged-in viewer already follows this user. */
  following?: boolean;
  joinedAt: string;
};

export type Notification = {
  id: string | number;
  type: string;
  actorUsername: string;
  actorAvatarUrl?: string | null;
  /** What targetId points at: RESOURCE, COMMENT or USER. */
  targetType: string;
  targetId: string | number;
  /** Where a click should go - resolved by the API (null when the content was deleted). */
  resourceId?: number | null;
  commentId?: number | null;
  /** When commentId is a reply: the top-level comment whose thread must be opened. */
  parentCommentId?: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type ReactionSummary = {
  totalCount: number;
  countsByType: Record<string, number>;
  myReaction?: string | null;
};

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8085/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: API,
  credentials: "include",
});

const multipart = (url: string, form: FormData) => ({
  url,
  method: "POST",
  body: form,
});

export const api = createApi({
  reducerPath: "api",

  baseQuery,

  tagTypes: [
    "Auth",
    "Resource",
    "Comment",
    "Bookmark",
    "Follow",
    "Notification",
    "User",
    "Reaction",
    "MyResources",
    "Interest",
    "Block",
    "Forum",
    "Admin",
  ],

  endpoints: (build) => ({
    login: build.mutation<
      ApiResponse<AuthUser>,
      {
        username: string;
        password: string;
      }
    >({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    register: build.mutation<
      ApiResponse<AuthUser>,
      {
        username: string;
        email: string;
        password: string;
        fullName?: string;
      }
    >({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    logout: build.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    me: build.query<ApiResponse<UserProfile>, void>({
      query: () => "/users/me",
      providesTags: ["Auth", "User"],
    }),

    getFeed: build.query<
      CursorPageResponse<Resource>,
      {
        cursor?: string;
        limit?: number;
      }
    >({
      query: ({ cursor, limit = 20 }) => ({
        url: "/feed",
        params: {
          ...(cursor ? { cursor } : {}),
          limit,
        },
      }),
      transformResponse: (
        r: ApiResponse<CursorPageResponse<Resource>>
      ) => r.data,
      providesTags: ["Resource"],
    }),

    getResources: build.query<
      PageResponse<Resource>,
      {
        page?: number;
        size?: number;
        search?: string;
        type?: string;
        status?: string;
        tag?: string;
      }
    >({
      query: ({
        page = 0,
        size = 20,
        search,
        type,
        status,
        tag,
      }) => ({
        url: "/resources",
        params: {
          page,
          size,
          ...(search ? { search } : {}),
          ...(type ? { type } : {}),
          ...(status ? { status } : {}),
          ...(tag ? { tag } : {}),
        },
      }),
      transformResponse: (
        r: ApiResponse<PageResponse<Resource>>
      ) => r.data,
      providesTags: ["Resource"],
    }),

    getResource: build.query<ApiResponse<Resource>, string>({
      query: (id) => `/resources/${id}`,
      providesTags: (_r, _e, id) => [
        {
          type: "Resource",
          id,
        },
      ],
    }),

    createResource: build.mutation<
      ApiResponse<Resource>,
      {
        title: string;
        description?: string;
        url?: string;
        type: string;
        status?: string;
        categoryId?: number;
        tags?: string[];
      }
    >({
      query: (body) => ({
        url: "/resources",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Resource"],
    }),

    createResourceWithMedia: build.mutation<
      ApiResponse<Resource>,
      FormData
    >({
      query: (form) =>
        multipart("/resources/with-media", form),
      invalidatesTags: ["Resource", "MyResources"],
    }),

    // ---- status control: Drafts / Archived pages ----
    getMyResources: build.query<
      PageResponse<Resource>,
      { status: ResourceStatus; page?: number; size?: number }
    >({
      query: ({ status, page = 0, size = 10 }) =>
        `/resources/me?status=${status}&page=${page}&size=${size}`,
      transformResponse: (r: ApiResponse<PageResponse<Resource>>) => r.data,
      providesTags: ["MyResources"],
    }),

    getMyResourceCounts: build.query<ResourceCounts, void>({
      query: () => "/resources/me/counts",
      transformResponse: (r: ApiResponse<ResourceCounts>) => r.data,
      providesTags: ["MyResources"],
    }),

    changeResourceStatus: build.mutation<
      ApiResponse<Resource>,
      { id: string; status: ResourceStatus }
    >({
      query: ({ id, status }) => ({
        url: `/resources/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      // Keep an open detail page in sync WITHOUT re-fetching it (a fetch counts as a view).
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const changed = data.data;
          dispatch(
            api.util.updateQueryData("getResource", id, (draft) => {
              if (draft?.data) {
                draft.data.status = changed.status;
                draft.data.archivedAt = changed.archivedAt;
                draft.data.purgeAt = changed.purgeAt;
              }
            }),
          );
        } catch {
          /* the caller shows the error */
        }
      },
      invalidatesTags: ["MyResources"],
    }),

    // Replace the ordered body: multipart `blocks` (JSON) + `files`
    updateResourceContent: build.mutation<
      ApiResponse<Resource>,
      { id: string; form: FormData }
    >({
      query: ({ id, form }) => multipart(`/resources/${id}/content`, form),
      invalidatesTags: ["Resource", "MyResources"],
    }),

    updateResource: build.mutation<
      ApiResponse<Resource>,
      {
        id: string;
        body: Partial<Resource>;
      }
    >({
      query: ({ id, body }) => ({
        url: `/resources/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Resource", "MyResources"],
    }),

    deleteResource: build.mutation<void, string>({
      query: (id) => ({
        url: `/resources/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Resource", "MyResources"],
    }),

    shareResource: build.mutation<
      ApiResponse<Resource>,
      {
        id: string;
        comment?: string;
      }
    >({
      query: ({ id, comment }) => ({
        url: `/resources/${id}/share`,
        method: "POST",
        body: {
          comment,
        },
      }),
      invalidatesTags: ["Resource"],
    }),

    uploadMedia: build.mutation<
      ApiResponse<Media>,
      {
        file: File;
        folder?: string;
      }
    >({
      query: ({ file, folder = "misc" }) => {
        const f = new FormData();

        f.append("file", file);
        f.append("folder", folder);

        return multipart("/media/upload", f);
      },
      invalidatesTags: ["Resource"],
    }),

    attachMedia: build.mutation<
      ApiResponse<Media>,
      {
        resourceId: string;
        file: File;
      }
    >({
      query: ({ resourceId, file }) => {
        const f = new FormData();

        f.append("file", file);

        return multipart(
          `/media/resources/${resourceId}`,
          f
        );
      },
      invalidatesTags: ["Resource"],
    }),

    getMedia: build.query<
      ApiResponse<Media[]>,
      string
    >({
      query: (id) => `/media/resources/${id}`,
    }),

    deleteMedia: build.mutation<void, string>({
      query: (id) => ({
        url: `/media/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Resource"],
    }),

    getComments: build.query<
      PageResponse<Comment>,
      string
    >({
      query: (id) => ({
        url: `/resources/${id}/comments`,
        params: {
          page: 0,
          size: 50,
        },
      }),
      transformResponse: (
        r: ApiResponse<PageResponse<Comment>>
      ) => r.data,
      // "Auth" so canEdit/canDelete are re-fetched when the user logs in/out.
      // The specific id lets a realtime event refresh ONE resource's discussion.
      providesTags: (_r, _e, id) => [
        { type: "Comment", id: `resource-${id}` },
        "Auth",
      ],
    }),

    getReplies: build.query<
      PageResponse<Comment>,
      string
    >({
      query: (id) => ({
        url: `/comments/${id}/replies`,
        params: {
          page: 0,
          size: 50,
        },
      }),
      transformResponse: (
        r: ApiResponse<PageResponse<Comment>>
      ) => r.data,
      providesTags: (_r, _e, id) => [
        { type: "Comment", id: `replies-${id}` },
        "Auth",
      ],
    }),

    addComment: build.mutation<
      ApiResponse<Comment>,
      {
        resourceId: string;
        content: string;
        parentId?: string;
      }
    >({
      query: ({ resourceId, ...body }) => ({
        url: `/resources/${resourceId}/comments`,
        method: "POST",
        body,
      }),
      // Counters are kept live by the realtime layer; invalidating "Resource" here would
      // re-fetch the post, and the API counts every GET of a post as a view.
      invalidatesTags: ["Comment"],
    }),

    editComment: build.mutation<
      ApiResponse<Comment>,
      {
        id: string;
        content: string;
      }
    >({
      query: ({ id, content }) => ({
        url: `/comments/${id}`,
        method: "PUT",
        body: {
          content,
        },
      }),
      invalidatesTags: ["Comment"],
    }),

    deleteComment: build.mutation<void, string>({
      query: (id) => ({
        url: `/comments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment"],
    }),

    react: build.mutation<
      ApiResponse<ReactionSummary>,
      {
        targetType: "RESOURCE" | "COMMENT";
        targetId: string;
        type: string;
      }
    >({
      query: (body) => ({
        url: "/reactions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Reaction", "Comment"],
    }),

    removeReaction: build.mutation<
      ApiResponse<ReactionSummary>,
      {
        targetType: "RESOURCE" | "COMMENT";
        targetId: string;
      }
    >({
      query: ({ targetType, targetId }) => ({
        url: `/reactions/${targetType}/${targetId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reaction", "Comment"],
    }),

    reactionSummary: build.query<
      ApiResponse<ReactionSummary>,
      {
        targetType: "RESOURCE" | "COMMENT";
        targetId: string;
      }
    >({
      query: ({ targetType, targetId }) =>
        `/reactions/${targetType}/${targetId}/summary`,
      providesTags: (_r, _e, { targetType, targetId }) => [
        { type: "Reaction", id: `${targetType}-${targetId}` },
      ],
    }),

    // "Interested" / "Not interested" from a post's "..." menu
    setPreference: build.mutation<
      ApiResponse<{ resourceId: number; preference: ResourcePreference | null }>,
      { id: string; type: ResourcePreference }
    >({
      query: ({ id, type }) => ({
        url: `/resources/${id}/preference`,
        method: "PUT",
        body: { type },
      }),
    }),

    clearPreference: build.mutation<
      ApiResponse<{ resourceId: number; preference: ResourcePreference | null }>,
      string
    >({
      query: (id) => ({
        url: `/resources/${id}/preference`,
        method: "DELETE",
      }),
    }),

    bookmark: build.mutation<void, string>({
      query: (id) => ({
        url: `/resources/${id}/bookmark`,
        method: "POST",
      }),
      invalidatesTags: ["Bookmark"],
    }),

    unbookmark: build.mutation<void, string>({
      query: (id) => ({
        url: `/resources/${id}/bookmark`,
        method: "DELETE",
      }),
      invalidatesTags: ["Bookmark"],
    }),

    getBookmarks: build.query<
      PageResponse<Resource>,
      {
        page?: number;
        size?: number;
      }
    >({
      query: ({ page = 0, size = 20 }) => ({
        url: "/users/me/bookmarks",
        params: {
          page,
          size,
        },
      }),
      transformResponse: (
        r: ApiResponse<PageResponse<Resource>>
      ) => r.data,
      providesTags: [
        "Bookmark",
        "Resource",
      ],
    }),

    getHistory: build.query<
      PageResponse<Resource>,
      {
        page?: number;
        size?: number;
      }
    >({
      query: ({ page = 0, size = 20 }) => ({
        url: "/users/me/history",
        params: {
          page,
          size,
        },
      }),
      transformResponse: (
        r: ApiResponse<PageResponse<Resource>>
      ) => r.data,
    }),

    getProfile: build.query<
      ApiResponse<UserProfile>,
      string
    >({
      query: (username) =>
        `/users/${username}`,
      providesTags: ["User"],
    }),

    getUserResources: build.query<
      Resource[],
      {
        username: string;
        page?: number;
        size?: number;
      }
    >({
      query: ({
        username,
        page = 0,
        size = 20,
      }) => ({
        url: `/users/${username}/resources`,
        params: {
          page,
          size,
        },
      }),
      transformResponse: (
        r: ApiResponse<Resource[]>
      ) => r.data,
      providesTags: ["Resource"],
    }),

    updateProfile: build.mutation<
      ApiResponse<UserProfile>,
      Partial<UserProfile>
    >({
      query: (body) => ({
        url: "/users/me/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: [
        "User",
        "Auth",
      ],
    }),

    uploadAvatar: build.mutation<
      ApiResponse<unknown>,
      File
    >({
      query: (file) => {
        const f = new FormData();

        f.append("file", file);

        return multipart(
          "/users/me/avatar",
          f
        );
      },
      invalidatesTags: [
        "User",
        "Auth",
      ],
    }),

    uploadCover: build.mutation<
      ApiResponse<unknown>,
      File
    >({
      query: (file) => {
        const f = new FormData();

        f.append("file", file);

        return multipart(
          "/users/me/cover",
          f
        );
      },
      invalidatesTags: [
        "User",
        "Auth",
      ],
    }),

    follow: build.mutation<void, string>({
      query: (u) => ({
        url: `/users/${u}/follow`,
        method: "POST",
      }),
      invalidatesTags: [
        "Follow",
        "User",
      ],
    }),

    unfollow: build.mutation<void, string>({
      query: (u) => ({
        url: `/users/${u}/follow`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "Follow",
        "User",
      ],
    }),

    followers: build.query<
      PageResponse<{
        id: string | number;
        username: string;
        fullName?: string;
        avatarUrl?: string;
      }>,
      {
        username: string;
        page?: number;
        size?: number;
      }
    >({
      query: ({
        username,
        page = 0,
        size = 30,
      }) => ({
        url: `/users/${username}/followers`,
        params: {
          page,
          size,
        },
      }),
      transformResponse: (
        r: ApiResponse<
          PageResponse<{
            id: string | number;
            username: string;
            fullName?: string;
            avatarUrl?: string;
          }>
        >
      ) => r.data,
      providesTags: ["Follow"],
    }),

    following: build.query<
      PageResponse<{
        id: string | number;
        username: string;
        fullName?: string;
        avatarUrl?: string;
      }>,
      {
        username: string;
        page?: number;
        size?: number;
      }
    >({
      query: ({
        username,
        page = 0,
        size = 30,
      }) => ({
        url: `/users/${username}/following`,
        params: {
          page,
          size,
        },
      }),
      transformResponse: (
        r: ApiResponse<
          PageResponse<{
            id: string | number;
            username: string;
            fullName?: string;
            avatarUrl?: string;
          }>
        >
      ) => r.data,
      providesTags: ["Follow"],
    }),

    getNotifications: build.query<
      PageResponse<Notification>,
      {
        page?: number;
        size?: number;
        /** Kinds to show: COMMENT, COMMENT_REPLY, REACTION, SHARE, FOLLOW, NEW_POST... (empty = all) */
        types?: string[];
        /** ALL | FOLLOWING (people I follow) | INTERESTING (content I am interested in) */
        scope?: NotificationScope;
        unreadOnly?: boolean;
      }
    >({
      query: ({
        page = 0,
        size = 30,
        types = [],
        scope = "ALL",
        unreadOnly = false,
      }) => ({
        url: "/notifications",
        params: {
          page,
          size,
          ...(types.length ? { types: types.join(",") } : {}),
          ...(scope !== "ALL" ? { scope } : {}),
          ...(unreadOnly ? { unreadOnly: true } : {}),
        },
      }),
      transformResponse: (
        r: ApiResponse<PageResponse<Notification>>
      ) => r.data,
      providesTags: ["Notification"],
    }),

    // ---- password recovery / change ----
    forgotPassword: build.mutation<ApiResponse<void>, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),

    resetPassword: build.mutation<ApiResponse<void>, { token: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),

    changePassword: build.mutation<ApiResponse<void>, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),

    // ---- reporting ----
    createReport: build.mutation<
      ApiResponse<void>,
      { targetType: ReportTarget; targetId: number | string; reason: ReportReason; details?: string }
    >({
      query: (body) => ({
        url: "/reports",
        method: "POST",
        body: { ...body, targetId: Number(body.targetId) },
      }),
    }),

    // ---- admin panel (ROLE_ADMIN only; the API enforces it) ----
    adminStats: build.query<AdminStats, void>({
      query: () => "/admin/stats",
      transformResponse: (r: ApiResponse<AdminStats>) => r.data,
      providesTags: ["Admin"],
    }),

    adminUsers: build.query<
      PageResponse<AdminUser>,
      { search?: string; role?: string; suspended?: boolean; page?: number; size?: number }
    >({
      query: ({ search, role, suspended, page = 0, size = 20 }) => ({
        url: "/admin/users",
        params: {
          page,
          size,
          ...(search ? { search } : {}),
          ...(role ? { role } : {}),
          ...(suspended !== undefined ? { suspended } : {}),
        },
      }),
      transformResponse: (r: ApiResponse<PageResponse<AdminUser>>) => r.data,
      providesTags: ["Admin"],
    }),

    adminSetRole: build.mutation<ApiResponse<AdminUser>, { id: number; role: string }>({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/role`, method: "PATCH", body: { role } }),
      invalidatesTags: ["Admin"],
    }),

    adminSuspend: build.mutation<ApiResponse<AdminUser>, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/admin/users/${id}/suspend`, method: "POST", body: { reason } }),
      invalidatesTags: ["Admin"],
    }),

    adminUnsuspend: build.mutation<ApiResponse<AdminUser>, number>({
      query: (id) => ({ url: `/admin/users/${id}/suspend`, method: "DELETE" }),
      invalidatesTags: ["Admin"],
    }),

    adminResources: build.query<
      PageResponse<Resource>,
      { search?: string; status?: ResourceStatus; page?: number; size?: number }
    >({
      query: ({ search, status, page = 0, size = 20 }) => ({
        url: "/admin/resources",
        params: { page, size, ...(search ? { search } : {}), ...(status ? { status } : {}) },
      }),
      transformResponse: (r: ApiResponse<PageResponse<Resource>>) => r.data,
      providesTags: ["Admin"],
    }),

    adminSetResourceStatus: build.mutation<ApiResponse<void>, { id: number | string; status: ResourceStatus }>({
      query: ({ id, status }) => ({ url: `/admin/resources/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Admin"],
    }),

    adminDeleteResource: build.mutation<ApiResponse<void>, number | string>({
      query: (id) => ({ url: `/admin/resources/${id}`, method: "DELETE" }),
      invalidatesTags: ["Admin"],
    }),

    adminComments: build.query<
      PageResponse<AdminComment>,
      { search?: string; page?: number; size?: number }
    >({
      query: ({ search, page = 0, size = 20 }) => ({
        url: "/admin/comments",
        params: { page, size, ...(search ? { search } : {}) },
      }),
      transformResponse: (r: ApiResponse<PageResponse<AdminComment>>) => r.data,
      providesTags: ["Admin"],
    }),

    adminDeleteComment: build.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/admin/comments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Admin"],
    }),

    adminReports: build.query<
      PageResponse<AdminReport>,
      { status?: ReportStatus; page?: number; size?: number }
    >({
      query: ({ status, page = 0, size = 20 }) => ({
        url: "/admin/reports",
        params: { page, size, ...(status ? { status } : {}) },
      }),
      transformResponse: (r: ApiResponse<PageResponse<AdminReport>>) => r.data,
      providesTags: ["Admin"],
    }),

    adminResolveReport: build.mutation<
      ApiResponse<AdminReport>,
      { id: number; status: ReportStatus; note?: string; action?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/reports/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Admin"],
    }),

    adminAudit: build.query<PageResponse<AdminAudit>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 30 }) => ({ url: "/admin/audit", params: { page, size } }),
      transformResponse: (r: ApiResponse<PageResponse<AdminAudit>>) => r.data,
      providesTags: ["Admin"],
    }),

    // ---- ranked / following feeds ----
    getForYou: build.query<
      CursorPageResponse<Resource>,
      { exclude: string[]; limit?: number }
    >({
      query: ({ exclude, limit = 20 }) => ({
        url: "/feed/for-you",
        params: { ...(exclude.length ? { exclude: exclude.join(",") } : {}), limit },
      }),
      transformResponse: (r: ApiResponse<CursorPageResponse<Resource>>) => r.data,
    }),

    getFollowingFeed: build.query<
      CursorPageResponse<Resource>,
      { cursor?: string; limit?: number }
    >({
      query: ({ cursor, limit = 20 }) => ({
        url: "/feed/following",
        params: { ...(cursor ? { cursor } : {}), limit },
      }),
      transformResponse: (r: ApiResponse<CursorPageResponse<Resource>>) => r.data,
    }),

    // Posts that were on screen: they stop being "New" in For you.
    markSeen: build.mutation<void, number[]>({
      query: (resourceIds) => ({
        url: "/feed/seen",
        method: "POST",
        body: { resourceIds },
      }),
    }),

    // ---- interests (preferred tags) ----
    getInterests: build.query<Interests, void>({
      query: () => "/users/me/interests",
      transformResponse: (r: ApiResponse<Interests>) => r.data,
      providesTags: ["Interest"],
    }),

    saveInterests: build.mutation<Interests, string[]>({
      query: (tags) => ({
        url: "/users/me/interests",
        method: "PUT",
        body: { tags },
      }),
      transformResponse: (r: ApiResponse<Interests>) => r.data,
      invalidatesTags: ["Interest"],
    }),

    // ---- blocking ----
    getBlockedUsers: build.query<UserSummary[], void>({
      query: () => "/users/me/blocked",
      transformResponse: (r: ApiResponse<UserSummary[]>) => r.data,
      providesTags: ["Block"],
    }),

    getBlockStatus: build.query<boolean, string>({
      query: (username) => `/users/${username}/block`,
      transformResponse: (r: ApiResponse<{ blocked: boolean }>) => r.data.blocked,
      providesTags: ["Block"],
    }),

    blockUser: build.mutation<void, string>({
      query: (username) => ({ url: `/users/${username}/block`, method: "POST" }),
      invalidatesTags: ["Block", "Notification", "Comment"],
    }),

    unblockUser: build.mutation<void, string>({
      query: (username) => ({ url: `/users/${username}/block`, method: "DELETE" }),
      invalidatesTags: ["Block", "Notification", "Comment"],
    }),

    getForumCategories: build.query<ApiResponse<ForumCategory[]>, void>({
      query: () => "/forum/categories",
    }),

    getForumTopics: build.query<
      PageResponse<ForumTopic>,
      { categoryKey?: string; sortBy?: "popular" | "new"; page?: number; size?: number }
    >({
      query: ({ categoryKey, sortBy = "popular", page = 0, size = 30 }) => ({
        url: "/forum/topics",
        params: { page, size, sortBy, ...(categoryKey ? { categoryKey } : {}) },
      }),
      transformResponse: (response: ApiResponse<PageResponse<ForumTopic>>) => response.data,
      providesTags: [{ type: "Forum", id: "LIST" }],
    }),

    getForumTopic: build.query<ApiResponse<ForumTopic>, string>({
      query: (id) => `/forum/topics/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Forum", id }],
    }),

    getForumReplies: build.query<
      PageResponse<ForumReply>,
      { topicId: string; page?: number; size?: number }
    >({
      query: ({ topicId, page = 0, size = 50 }) => ({
        url: `/forum/topics/${topicId}/replies`,
        params: { page, size },
      }),
      transformResponse: (response: ApiResponse<PageResponse<ForumReply>>) => response.data,
      providesTags: (_result, _error, { topicId }) => [{ type: "Forum", id: `replies-${topicId}` }],
    }),

    createForumTopic: build.mutation<
      ApiResponse<ForumTopic>,
      { title: string; categoryKey: string; blocks: ForumContentBlock[] }
    >({
      query: (body) => ({ url: "/forum/topics", method: "POST", body }),
      invalidatesTags: [{ type: "Forum", id: "LIST" }],
    }),

    createForumReply: build.mutation<
      ApiResponse<ForumReply>,
      { topicId: string; blocks: ForumContentBlock[] }
    >({
      query: ({ topicId, blocks }) => ({
        url: `/forum/topics/${topicId}/replies`,
        method: "POST",
        body: { blocks },
      }),
      invalidatesTags: (_result, _error, { topicId }) => [
        { type: "Forum", id: "LIST" },
        { type: "Forum", id: topicId },
        { type: "Forum", id: `replies-${topicId}` },
      ],
    }),

    shareForumTopic: build.mutation<ApiResponse<ForumTopic>, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({
        url: `/forum/topics/${id}/share`,
        method: "POST",
        body: { comment },
      }),
      invalidatesTags: [{ type: "Forum", id: "LIST" }],
    }),

    deleteForumTopic: build.mutation<void, string>({
      query: (id) => ({ url: `/forum/topics/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Forum", id: "LIST" }],
    }),

    unreadCount: build.query<number, void>({
      query: () =>
        "/notifications/unread-count",

      transformResponse: (
        r: ApiResponse<number> | number
      ) =>
        typeof r === "number"
          ? r
          : r.data,

      providesTags: ["Notification"],
    }),

    markNotificationRead: build.mutation<
      void,
      string
    >({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      // The bell badge drops immediately; the refetch below then confirms the real value.
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData("unreadCount", undefined, (count) =>
            Math.max(0, count - 1),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsRead: build.mutation<
      void,
      void
    >({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData("unreadCount", undefined, () => 0),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useMeQuery,

  useGetFeedQuery,
  useGetResourcesQuery,
  useGetResourceQuery,

  useCreateResourceMutation,
  useCreateResourceWithMediaMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useShareResourceMutation,

  useUploadMediaMutation,
  useAttachMediaMutation,
  useGetMediaQuery,
  useDeleteMediaMutation,

  useGetCommentsQuery,
  useGetRepliesQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,

  useReactMutation,
  useRemoveReactionMutation,
  useReactionSummaryQuery,
  useSetPreferenceMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useCreateReportMutation,
  useAdminStatsQuery,
  useAdminUsersQuery,
  useAdminSetRoleMutation,
  useAdminSuspendMutation,
  useAdminUnsuspendMutation,
  useAdminResourcesQuery,
  useAdminSetResourceStatusMutation,
  useAdminDeleteResourceMutation,
  useAdminCommentsQuery,
  useAdminDeleteCommentMutation,
  useAdminReportsQuery,
  useAdminResolveReportMutation,
  useAdminAuditQuery,
  useLazyGetForYouQuery,
  useLazyGetFollowingFeedQuery,
  useMarkSeenMutation,
  useGetInterestsQuery,
  useSaveInterestsMutation,
  useGetBlockedUsersQuery,
  useGetBlockStatusQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetMyResourcesQuery,
  useGetMyResourceCountsQuery,
  useChangeResourceStatusMutation,
  useUpdateResourceContentMutation,
  useClearPreferenceMutation,

  useBookmarkMutation,
  useUnbookmarkMutation,
  useGetBookmarksQuery,
  useGetHistoryQuery,

  useGetProfileQuery,
  useGetUserResourcesQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useUploadCoverMutation,

  useFollowMutation,
  useUnfollowMutation,
  useFollowersQuery,
  useFollowingQuery,

  useGetNotificationsQuery,
  useUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetForumCategoriesQuery,
  useGetForumTopicsQuery,
  useGetForumTopicQuery,
  useGetForumRepliesQuery,
  useCreateForumTopicMutation,
  useCreateForumReplyMutation,
  useShareForumTopicMutation,
  useDeleteForumTopicMutation,
} = api;