import { toast } from "sonner";

export const notify = {
  // Generic

  success(message: string) {
    toast.success("🏓 We just had an edge ball!", {
      description: message,
    });
  },

  error(message: string) {
    toast.error("🏓 Fault!", {
      description: message,
    });
  },

  warning(message: string) {
    toast.warning("🏓 Time Out!", {
      description: message,
    });
  },

  info(message: string) {
    toast.info("🏓 Service!", {
      description: message,
    });
  },

  // Authentication

  welcomeBack() {
    toast.success("🏓 You're in the draw!", {
      description: "Welcome back to KiwiTTR.",
    });
  },

  accountCreated() {
    toast.success("🏓 We just had an edge ball!", {
      description:
        "Your account has been created successfully.",
    });
  },

  signedOut() {
    toast.success("👋 See you next time!", {
      description: "You have been signed out.",
    });
  },

  // Players

  playerAdded(name: string) {
    toast.success("🏓 New Player Added", {
      description: `${name} has joined KiwiTTR.`,
    });
  },

  playerUpdated(name: string) {
    toast.success("🏓 Player Updated", {
      description: `${name} has been updated.`,
    });
  },

  playerDeleted(name: string) {
    toast.success("🏓 Player Removed", {
      description: `${name} has been removed.`,
    });
  },

  // Matches

  matchRecorded() {
    toast.success("🏓 Match Point!", {
      description:
        "The match has been recorded successfully.",
    });
  },

  // Ratings

  ratingsUpdated() {
    toast.success("📈 Ratings Updated", {
      description:
        "The latest TTR ratings have been calculated.",
    });
  },

  careerHigh(name: string) {
    toast.success("⭐ New Career High!", {
      description: `${name} reached a new highest rating.`,
    });
  },

  // Clubs

  clubCreated(name: string) {
    toast.success("🏓 Welcome to the League!", {
      description: `${name} has been created.`,
    });
  },

  // Events

  eventCreated(name: string) {
    toast.success("🏆 Tournament Open!", {
      description: `${name} has been created.`,
    });
  },

  // Helpers

  timeout(message: string) {
    this.warning(message);
  },

  fault(message: string) {
    this.error(message);
  },

  service(message: string) {
    this.info(message);
  },

  edgeBall(message: string) {
    this.success(message);
  },
};