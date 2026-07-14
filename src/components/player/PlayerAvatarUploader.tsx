import {
  LoaderCircle,
  Upload,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";

import { notify } from "../../services/notificationService";
import { uploadOwnPlayerAvatar } from "../../services/playerAvatarService";
import PlayerAvatar from "../shared/PlayerAvatar";

export default function PlayerAvatarUploader({
  firstName,
  lastName,
  avatarUrl,
  onUploaded,
  compact = false,
}: {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  onUploaded: (avatarUrl: string) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file?: File) {
    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrl = await uploadOwnPlayerAvatar(file);
      onUploaded(uploadedUrl);
      notify.success("Your profile picture has been updated.");
    } catch (error) {
      console.error(error);
      notify.error(
        error instanceof Error
          ? error.message
          : "Unable to upload your profile picture."
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className={`flex ${compact ? "items-center gap-3" : "flex-col items-center gap-3"}`}>
      <PlayerAvatar
        firstName={firstName}
        lastName={lastName}
        imageUrl={avatarUrl}
        size="xl"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={event => void handleFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {isUploading ? "Uploading…" : "Upload Picture"}
      </button>
    </div>
  );
}
