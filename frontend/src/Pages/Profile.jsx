import React, { useMemo, useRef, useState } from "react";
import { useAuth } from "../Hooks/useAuth";
import { uploadAvatar } from "../Services/userService";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

export const Profile = () => {
  const fileInputRef = useRef(null);
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  const avatarSrc = useMemo(() => {
    if (!user?.avatar?.url) return "";

    const separator = user.avatar.url.includes("?") ? "&" : "?";
    return `${user.avatar.url}${separator}t=${avatarRefreshKey}`;
  }, [avatarRefreshKey, user?.avatar?.url]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const res = await uploadAvatar(file);
      const avatar = res.data?.data?.avatar;

      if (!avatar?.url) {
        throw new Error("Avatar URL missing in response.");
      }

      updateUser({ avatar });
      setAvatarRefreshKey(Date.now());
      setSuccess("Avatar updated successfully.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 px-6 pt-16 pb-6 relative">
      <section className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 min-h-[calc(100vh-9rem)] flex items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-[#8ff6d0]/10 to-white/[0.03] p-8 text-center shadow-[0_0_40px_rgba(143,246,208,0.08)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8ff6d0] mb-4">
            Profile
          </p>

          <div className="mx-auto h-28 w-28 rounded-[2rem] overflow-hidden border border-white/10 bg-[#071310] flex items-center justify-center text-3xl text-white font-medium">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user?.name || "Profile avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>

          <h1 className="text-white text-3xl font-light mt-6">
            {user?.name || "User"}
          </h1>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#8ff6d0] to-[#73d9b5] text-[#002117] font-semibold disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Update avatar"}
          </button>

          {success ? (
            <p className="text-sm text-[#b8ffe6] mt-4">{success}</p>
          ) : null}

          {error ? (
            <p className="text-sm text-red-200 mt-4">{error}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
};
