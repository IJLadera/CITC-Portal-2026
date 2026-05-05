import Editprofile from "../../Components/profile/editprofile";
import Profileloadingskeleton from "../../Components/profile/profileloadingskeleton";
import { ToastContainer, toast } from "react-toastify";
import { useEffect, useState, useCallback } from "react";
import {
  Grid,
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Divider,
} from "@mui/material";
import { FaHeart, FaRegHeart, FaRegComment, FaTrash, FaEdit, FaLock } from "react-icons/fa";

import { College, YearLevel } from "../../Components/models";
import { useAppDispatch, useAppSelector } from "../../../../../../../hooks";
import { fetchYearLevelsApi } from "../../../../../../../api";
import { fetchCollegeses, fetchCurrentUser } from "../slice";
import { getPosts } from "../../../../posts/api";
import http from "../../../../../../../http";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDraftContent(content: any): string {
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        return parsed.blocks.map((b: any) => b.text).join("\n");
      }
    } catch {
      return content;
    }
  }
  return content || "";
}

function timeAgo(dateStr: string | number): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return "";
  }
}

/**
 * Safely extract a display string from a value that may be
 * a plain string OR an object like { uuid, name, rank }.
 */
function resolveString(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    // Try common string-like keys in order of preference
    return (
      value.name ??
      value.label ??
      value.title ??
      value.display_name ??
      ""
    );
  }
  return String(value);
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeletePostModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0,0,0,0.5)",
      }}
      onClick={onCancel}
    >
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: "12px",
          p: 3,
          width: 320,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Delete post?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This action cannot be undone. The post will be permanently removed.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Box
            onClick={onCancel}
            sx={{
              cursor: "pointer",
              px: 2,
              py: 1,
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              fontSize: 14,
              "&:hover": { bgcolor: "#f5f5f5" },
            }}
          >
            Cancel
          </Box>
          <Box
            onClick={onConfirm}
            sx={{
              cursor: "pointer",
              px: 2,
              py: 1,
              borderRadius: "8px",
              bgcolor: "#E24B4A",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              "&:hover": { bgcolor: "#c93a39" },
            }}
          >
            Delete
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onDelete,
}: {
  post: any;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const description = parseDraftContent(post.description || post.content || "");
  const imageUrl = post.image || post.images || null;
  const timestamp = post.timestamp || post.created_at || post.createdAt;

  return (
    <>
      {showDeleteModal && (
        <DeletePostModal
          onConfirm={() => {
            setShowDeleteModal(false);
            onDelete(post.id);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <Box
        sx={{
          bgcolor: "white",
          border: "0.5px solid #e8e8e8",
          borderRadius: "12px",
          overflow: "hidden",
          transition: "box-shadow 0.15s",
          "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "14px 16px 10px" }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: "#378ADD",
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {(post.authorName || "U")[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
              {post.authorName || "You"}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#999" }}>
              {timeAgo(timestamp)}
            </Typography>
          </Box>
          <Box
            onClick={() => setShowDeleteModal(true)}
            sx={{
              cursor: "pointer",
              color: "#ccc",
              p: "6px",
              borderRadius: "6px",
              display: "flex",
              "&:hover": { color: "#E24B4A", bgcolor: "#FFF0F0" },
            }}
          >
            <FaTrash size={13} />
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ px: 2, pb: imageUrl ? 1 : 1.5 }}>
          {post.title && (
            <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 0.5 }}>
              {post.title}
            </Typography>
          )}
          {description && (
            <Typography
              sx={{
                fontSize: 13,
                color: "#555",
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </Typography>
          )}
        </Box>

        {/* Image */}
        {imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt={post.title || "Post image"}
            onError={(e: any) => {
              e.currentTarget.parentElement.style.display = "none";
            }}
            sx={{
              width: "100%",
              maxHeight: 320,
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            borderTop: "0.5px solid #f0f0f0",
          }}
        >
          <Box
            onClick={() => setLiked((p) => !p)}
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              py: 1.25,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: liked ? "#E24B4A" : "#888",
              "&:hover": { bgcolor: "#fafafa" },
              transition: "color 0.15s",
            }}
          >
            {liked ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
            {liked ? "Liked" : "Like"}
          </Box>
          <Box sx={{ width: "0.5px", bgcolor: "#f0f0f0" }} />
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              py: 1.25,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#888",
              "&:hover": { bgcolor: "#fafafa" },
            }}
          >
            <FaRegComment size={14} />
            Comment
          </Box>
        </Box>
      </Box>
    </>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editProfile, setEditProfile] = useState(false);
  const [yearLevels, setYearLevels] = useState<YearLevel | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "events">("posts");

  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.unieventify.user);
  const userRole = useAppSelector((state) => state.unieventify.userRole);
  const collegeData = useAppSelector((state) => state.unieventify.colleges);

  // ── Safely resolve userRole name (may be a plain string OR {uuid,name,rank}) ──
  const roleName = resolveString(userRole?.name);

  // ── Fetch profile & colleges ───────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchCurrentUser())
      .then(() => setLoading(false))
      .catch((err: any) => {
        setError(err);
        setLoading(false);
      });
    dispatch(fetchCollegeses());
  }, []);

  useEffect(() => {
    if (!editProfile) {
      dispatch(fetchCurrentUser());
      dispatch(fetchCollegeses());
    }

    const fetchYearLevelsData = async () => {
      try {
        const data = await fetchYearLevelsApi();
        setYearLevels(data);
      } catch (err) {
        console.error("Error fetching year levels:", err);
      }
    };

    fetchYearLevelsData();
  }, [editProfile, dispatch]);

  // ── Fetch posts — filtered to current user ────────────────────────────────
  useEffect(() => {
    if (!profile) return;

    setPostsLoading(true);
    getPosts()
      .then((response: any) => {
        const data = response.data?.results ?? response.data;
        const all: any[] = Array.isArray(data) ? data : [];

        console.log("profile.id:", profile.id);
        console.log("ALL POSTS SAMPLE:", all.slice(0, 2));

        const mine = all.filter((post: any) => {
          const postUserId =
            post.user?.id ??
            post.created_by?.id ??
            post.author?.id ??
            post.user_id ??
            post.userId ??
            null;

          if (postUserId === null) return true;
          return String(postUserId) === String(profile.id);
        });

        console.log("FILTERED mine:", mine.length, "of", all.length);

        const normalised = mine.map((post: any) => ({
          ...post,
          authorName:
            post.user?.first_name && post.user?.last_name
              ? `${post.user.first_name} ${post.user.last_name}`
              : post.created_by?.first_name
              ? `${post.created_by.first_name} ${post.created_by.last_name}`
              : profile?.first_name
              ? `${profile.first_name} ${profile.last_name}`
              : "You",
          description: parseDraftContent(
            post.description || post.content || ""
          ),
        }));

        normalised.sort(
          (a: any, b: any) =>
            new Date(b.timestamp || b.created_at || b.createdAt).getTime() -
            new Date(a.timestamp || a.created_at || a.createdAt).getTime()
        );

        setPosts(normalised);
      })
      .catch((err: any) => {
        console.error("getPosts error:", err);
        setPosts([]);
      })
      .finally(() => setPostsLoading(false));
  }, [profile]);

  const handleDeletePost = useCallback(
    async (postId: string) => {
      try {
        await http.delete(`/lms/post/${postId}/`);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success("Post deleted.");
      } catch {
        toast.error("Could not delete post. Try again.");
      }
    },
    []
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const college = collegeData?.find(
    (c) => c.id === profile?.department?.college
  );
  const yearLevel = (yearLevels as any)?.find(
    (y: any) => y.id === profile?.section?.tblYearLevel
  );

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  if (error) return <Profileloadingskeleton />;

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editProfile) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          px: { xs: "2vw", sm: "5vw" },
          py: { xs: "2vh", sm: "5vh" },
          bgcolor: "white",
          color: "black",
          borderRadius: "8px",
          height: "100vh",
          overflow: "scroll",
        }}
      >
        <Editprofile
          handleClickEdit={(v) => setEditProfile(v)}
          profile={profile}
          collegeParams={college?.name}
          yearLevelParams={yearLevel?.yearLevel}
          currentUser={profile}
        />
        <ToastContainer />
      </Box>
    );
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!profile) return <Profileloadingskeleton />;

  const initials =
    profile.first_name && profile.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`
      : (profile.username || "U")[0];

  return (
    <Box
      sx={{
        flexGrow: 1,
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 3 },
        bgcolor: "#F7F7F5",
        minHeight: "100vh",
        overflow: "auto",
      }}
    >
      <Grid container spacing={3} alignItems="flex-start">
        {/* ── Left Sidebar ── */}
        <Grid item xs={12} md={4} lg={3}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Avatar + identity card */}
            <Box
              sx={{
                bgcolor: "white",
                border: "0.5px solid #e8e8e8",
                borderRadius: "14px",
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar
                src={profile.image}
                sx={{
                  width: 88,
                  height: 88,
                  fontSize: 28,
                  fontWeight: 600,
                  bgcolor: "#378ADD",
                  border: "2.5px solid #FAB417",
                  color: "#E6F1FB",
                }}
              >
                {!profile.image && initials}
              </Avatar>

              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>
                  {profile.first_name} {profile.last_name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#999", mt: 0.5 }}>
                  {profile.username}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#999" }}>
                  {profile.email}
                </Typography>
              </Box>

              {/* ✅ FIX: use resolved roleName string instead of userRole?.name directly */}
              {roleName && (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "99px",
                    bgcolor: "#FAEEDA",
                    color: "#633806",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {roleName}
                </Box>
              )}

              {/* Stats row */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 1,
                  width: "100%",
                  mt: 0.5,
                }}
              >
                {[
                  { n: posts.length, label: "Posts" },
                  { n: 0, label: "Liked" },
                  { n: 0, label: "Events" },
                ].map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      bgcolor: "#F7F7F5",
                      borderRadius: "8px",
                      py: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
                      {s.n}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#999", mt: 0.25 }}>
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", mt: 0.5 }}>
                <Box
                  onClick={() => setEditProfile(true)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    cursor: "pointer",
                    px: 2,
                    py: 0.875,
                    borderRadius: "8px",
                    bgcolor: "#FAB417",
                    color: "#412402",
                    fontSize: 13,
                    fontWeight: 600,
                    "&:hover": { bgcolor: "#EF9F27" },
                    transition: "background 0.15s",
                  }}
                >
                  <FaEdit size={12} /> Edit profile
                </Box>
                <Box
                  component="a"
                  href="change_password"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    cursor: "pointer",
                    px: 2,
                    py: 0.875,
                    borderRadius: "8px",
                    border: "0.5px solid #e0e0e0",
                    bgcolor: "white",
                    color: "inherit",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    "&:hover": { bgcolor: "#f5f5f5" },
                    transition: "background 0.15s",
                  }}
                >
                  <FaLock size={11} /> Password
                </Box>
              </Box>
            </Box>

            {/* Personal info card */}
            <Box
              sx={{
                bgcolor: "white",
                border: "0.5px solid #e8e8e8",
                borderRadius: "14px",
                p: "16px 20px",
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#aaa",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  mb: 1.5,
                }}
              >
                Personal info
              </Typography>

              {[
                { label: "First name", value: profile.first_name },
                { label: "Last name", value: profile.last_name },
                { label: "Middle name", value: profile.middle_name },
                { label: "ID number", value: profile.idNumber },
                { label: "College", value: resolveString(college?.name) || "—" },
                { label: "Department", value: resolveString(profile.department?.name) || "—" },
                ...(profile.section?.tblYearLevel
                  ? [{ label: "Year level", value: resolveString(yearLevel?.yearLevel) || "—" }]
                  : []),
                ...(profile.section
                  ? [{ label: "Section", value: resolveString(profile.section?.section) || "—" }]
                  : []),
                ...(profile.organization
                  ? [
                      { label: "Org type", value: resolveString(profile.organization?.studentOrgType) || "—" },
                      { label: "Organization", value: resolveString(profile.organization?.studentOrgName) || "—" },
                    ]
                  : []),
              ].map((row, i, arr) => (
                <Box key={row.label}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      py: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: 12, color: "#999" }}>
                      {row.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        maxWidth: "55%",
                        textAlign: "right",
                        wordBreak: "break-word",
                      }}
                    >
                      {row.value || "—"}
                    </Typography>
                  </Box>
                  {i < arr.length - 1 && (
                    <Divider sx={{ borderColor: "#FAB417", opacity: 0.4 }} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* ── Right — Tabbed content ── */}
        <Grid item xs={12} md={8} lg={9}>
          <Box
            sx={{
              bgcolor: "white",
              border: "0.5px solid #e8e8e8",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            {/* Tab bar */}
            <Box
              sx={{
                display: "flex",
                borderBottom: "0.5px solid #e8e8e8",
                px: 2,
              }}
            >
              {(["posts", "events"] as const).map((tab) => (
                <Box
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    py: 1.5,
                    px: 2.5,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? "#FAB417" : "#999",
                    borderBottom: activeTab === tab ? "2px solid #FAB417" : "2px solid transparent",
                    mb: "-0.5px",
                    transition: "color 0.15s",
                    textTransform: "capitalize",
                  }}
                >
                  {tab === "posts" ? `My posts (${posts.length})` : "Events attended"}
                </Box>
              ))}
            </Box>

            {/* Posts panel */}
            {activeTab === "posts" && (
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                {postsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : posts.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 7, color: "#bbb" }}>
                    <Typography sx={{ fontSize: 32, mb: 1.5 }}>✏️</Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#aaa" }}>
                      No posts yet
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "#ccc", mt: 0.5 }}>
                      Posts you create will appear here.
                    </Typography>
                  </Box>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDelete={handleDeletePost}
                    />
                  ))
                )}
              </Box>
            )}

            {/* Events panel */}
            {activeTab === "events" && (
              <Box sx={{ textAlign: "center", py: 7, color: "#bbb" }}>
                <Typography sx={{ fontSize: 32, mb: 1.5 }}>🗓</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#aaa" }}>
                  No events yet
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#ccc", mt: 0.5 }}>
                  Events you attend will show up here.
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      <ToastContainer />
    </Box>
  );
}