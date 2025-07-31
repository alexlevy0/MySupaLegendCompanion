import { Platform, Alert as RNAlert } from 'react-native';

// Types mirroring the React Native Alert API
export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

class Alert {
  /**
   * Cross-platform implementation of Alert.alert.
   * On native platforms we simply proxy to React Native's Alert.
   * On web, we fallback to window.alert / window.confirm for up to two buttons
   * and render a custom modal for three or more buttons.
   */
  public static alert(
    title: string = '',
    message?: string,
    buttons: AlertButton[] = [{ text: 'OK' }],
    options: AlertOptions = {}
  ) {
    // Mobile & desktop native platforms → use RN Alert directly
    if (Platform.OS !== 'web') {
      RNAlert.alert(title, message, buttons, options as any);
      return;
    }

    // Web implementation
    const mergedButtons = buttons.length ? buttons : [{ text: 'OK' }];

    // 1 button → window.alert
    if (mergedButtons.length === 1) {
      window.alert([title, message].filter(Boolean).join('\n\n'));
      mergedButtons[0].onPress?.();
      options.onDismiss?.();
      return;
    }

    // 2 buttons → window.confirm (first button considered "cancel", second "ok")
    if (mergedButtons.length === 2) {
      const confirmResult = window.confirm([title, message].filter(Boolean).join('\n\n'));
      const chosenButton = confirmResult ? mergedButtons[1] : mergedButtons[0];
      chosenButton.onPress?.();
      options.onDismiss?.();
      return;
    }

    // 3+ buttons → custom modal
    renderCustomModal(title, message, mergedButtons, options);
  }
}

export default Alert;

/* -------------------------------------------------------------------------- */
/*                                Web Modal                                  */
/* -------------------------------------------------------------------------- */

function renderCustomModal(
  title: string,
  message: string | undefined,
  buttons: AlertButton[],
  options: AlertOptions
) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.4)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '10000';
  overlay.style.animation = 'alertfadein 0.15s ease';

  if (options.cancelable) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        options.onDismiss?.();
      }
    });
  }

  // Modal container
  const modal = document.createElement('div');
  modal.style.background = '#ffffff';
  modal.style.borderRadius = '12px';
  modal.style.minWidth = '280px';
  modal.style.maxWidth = '90vw';
  modal.style.padding = '20px';
  modal.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.gap = '16px';
  modal.style.animation = 'alertscalein 0.2s ease';

  const titleEl = document.createElement('h2');
  titleEl.textContent = title;
  titleEl.style.margin = '0';
  titleEl.style.fontSize = '18px';
  titleEl.style.fontWeight = '600';
  titleEl.style.color = '#000';
  modal.appendChild(titleEl);

  if (message) {
    const msgEl = document.createElement('p');
    msgEl.textContent = message;
    msgEl.style.margin = '0';
    msgEl.style.fontSize = '14px';
    msgEl.style.color = '#333';
    modal.appendChild(msgEl);
  }

  // Buttons container
  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.flexDirection = 'column';
  btnContainer.style.gap = '8px';

  buttons.forEach((btn) => {
    const btnEl = document.createElement('button');
    btnEl.textContent = btn.text;
    btnEl.style.padding = '10px';
    btnEl.style.fontSize = '14px';
    btnEl.style.borderRadius = '8px';
    btnEl.style.border = 'none';
    btnEl.style.cursor = 'pointer';
    btnEl.style.fontWeight = '600';

    // Style variants
    switch (btn.style) {
      case 'cancel':
        btnEl.style.background = '#E5E5EA';
        btnEl.style.color = '#000';
        break;
      case 'destructive':
        btnEl.style.background = '#FF3B30';
        btnEl.style.color = '#fff';
        break;
      default:
        btnEl.style.background = '#007AFF';
        btnEl.style.color = '#fff';
        break;
    }

    btnEl.addEventListener('click', () => {
      btn.onPress?.();
      cleanup();
      options.onDismiss?.();
    });

    btnContainer.appendChild(btnEl);
  });

  modal.appendChild(btnContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function cleanup() {
    if (overlay.parentElement) {
      document.body.removeChild(overlay);
    }
  }

  injectStyles();
}

function injectStyles() {
  const styleId = 'alert-polyfill-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes alertfadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes alertscalein {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}