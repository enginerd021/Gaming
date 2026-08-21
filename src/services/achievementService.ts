import { doc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { updateDoc } from '@/lib/firebaseCall';

/**
 * Service to handle checking, unlocking, and notifying achievements.
 */
export const achievementService = {
  /**
   * Unlocks an achievement for a user if they don't already have it.
   * @param userId The UID of the player
   * @param achievementId The ID of the achievement to unlock
   * @param currentAchievements The list of already unlocked achievements
   */
  async unlockAchievement(
    userId: string,
    achievementId: string,
    currentAchievements: string[] = []
  ): Promise<boolean> {
    if (!userId || !achievementId) return false;

    // Check if already unlocked
    if (currentAchievements.includes(achievementId)) {
      return false;
    }

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return false;

    try {
      const profileRef = doc(db, "profiles", userId);
      await updateDoc(profileRef, {
        achievements: arrayUnion(achievementId)
      });

      // Trigger a beautiful notification inside the app client
      this.notifyAchievementUnlocked(achievement.title, achievement.description);
      return true;
    } catch (err) {
      console.error("Failed to unlock achievement:", err);
      return false;
    }
  },

  /**
   * Helper to display a premium-looking floating card when an achievement is unlocked.
   */
  notifyAchievementUnlocked(title: string, description: string) {
    if (typeof window === 'undefined') return;

    // Create custom notification popup elements dynamically
    const notificationContainer = document.createElement('div');
    notificationContainer.setAttribute('id', `achievement-toast-${Date.now()}`);
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.bottom = '2rem';
    notificationContainer.style.right = '2rem';
    notificationContainer.style.zIndex = '9999';
    notificationContainer.style.background = 'rgba(10, 15, 30, 0.95)';
    notificationContainer.style.border = '1px solid var(--accent-cyan)';
    notificationContainer.style.boxShadow = 'var(--glow-cyan)';
    notificationContainer.style.borderRadius = '12px';
    notificationContainer.style.padding = '1.25rem 1.5rem';
    notificationContainer.style.display = 'flex';
    notificationContainer.style.alignItems = 'center';
    notificationContainer.style.gap = '1rem';
    notificationContainer.style.maxWidth = '360px';
    notificationContainer.style.fontFamily = 'inherit';
    notificationContainer.style.backdropFilter = 'blur(10px)';
    notificationContainer.style.transition = 'transform 300ms ease, opacity 300ms ease';
    notificationContainer.style.transform = 'translateY(50px)';
    notificationContainer.style.opacity = '0';

    // Badge styling
    const badge = document.createElement('div');
    badge.innerHTML = '🏆';
    badge.style.fontSize = '2rem';
    badge.style.background = 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-violet) 100%)';
    badge.style.webkitBackgroundClip = 'text';
    badge.style.webkitTextFillColor = 'transparent';

    // Content container
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = '0.2rem';

    const header = document.createElement('strong');
    header.innerText = `ACHIEVEMENT UNLOCKED!`;
    header.style.fontSize = '0.7rem';
    header.style.color = 'var(--accent-gold)';
    header.style.letterSpacing = '0.1em';

    const achievementTitle = document.createElement('h4');
    achievementTitle.innerText = title;
    achievementTitle.style.fontSize = '1.1rem';
    achievementTitle.style.margin = '0';
    achievementTitle.style.color = '#fff';

    const achievementDesc = document.createElement('p');
    achievementDesc.innerText = description;
    achievementDesc.style.fontSize = '0.8rem';
    achievementDesc.style.color = 'var(--text-secondary)';
    achievementDesc.style.margin = '0';
    achievementDesc.style.lineHeight = '1.3';

    content.appendChild(header);
    content.appendChild(achievementTitle);
    content.appendChild(achievementDesc);

    notificationContainer.appendChild(badge);
    notificationContainer.appendChild(content);
    document.body.appendChild(notificationContainer);

    // Animate in
    setTimeout(() => {
      notificationContainer.style.transform = 'translateY(0)';
      notificationContainer.style.opacity = '1';
    }, 100);

    // Remove after 6 seconds
    setTimeout(() => {
      notificationContainer.style.transform = 'translateY(50px)';
      notificationContainer.style.opacity = '0';
      setTimeout(() => {
        if (notificationContainer.parentNode) {
          notificationContainer.parentNode.removeChild(notificationContainer);
        }
      }, 300);
    }, 6000);
  }
};
