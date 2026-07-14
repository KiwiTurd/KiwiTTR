import { supabase } from "../lib/supabase";
import { updateOwnPlayerAvatarUrl } from "./supabase/playerService";
import { PLAYER_AVATAR_UPDATED_EVENT } from "../constants/playerAvatar";

const AVATAR_SIZE = 512;
const MAX_SOURCE_SIZE = 10 * 1024 * 1024;

function compressAvatar(file: File) {
  return new Promise<Blob>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    if (file.size > MAX_SOURCE_SIZE) {
      reject(new Error("Please select an image smaller than 10 MB."));
      return;
    }

    const image = new window.Image();
    const source = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(source);
        reject(new Error("Image processing is unavailable."));
        return;
      }

      const scale = Math.max(
        AVATAR_SIZE / image.width,
        AVATAR_SIZE / image.height
      );
      const width = image.width * scale;
      const height = image.height * scale;

      context.drawImage(
        image,
        (AVATAR_SIZE - width) / 2,
        (AVATAR_SIZE - height) / 2,
        width,
        height
      );
      URL.revokeObjectURL(source);

      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Unable to compress the image."));
          }
        },
        "image/webp",
        0.82
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("Unable to read the selected image."));
    };

    image.src = source;
  });
}

export async function uploadOwnPlayerAvatar(file: File) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error("You must be signed in to upload a profile picture.");
  }

  const avatar = await compressAvatar(file);
  const path = `${user.id}/avatar.webp`;
  const { error: uploadError } = await supabase.storage
    .from("player-avatars")
    .upload(path, avatar, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("player-avatars")
    .getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

  await updateOwnPlayerAvatarUrl(avatarUrl);
  window.dispatchEvent(new Event(PLAYER_AVATAR_UPDATED_EVENT));
  return avatarUrl;
}
