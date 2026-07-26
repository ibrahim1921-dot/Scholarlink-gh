type SignOutListener = () => void;
const signOutListeners = new Set<SignOutListener>();

export const authEvents = {
  onSignOut(listener: SignOutListener) {
    signOutListeners.add(listener);
    return () => {
      signOutListeners.delete(listener);
    };
  },
  emitSignOut() {
    signOutListeners.forEach((listener) => listener());
  },
};
