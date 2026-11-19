import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

/** Raw service errors are not user-friendly; map the known ones. */
function friendly(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : '';
  if (/Cannot (delete|update|restore) missing/.test(msg)) return 'That entry no longer exists.';
  if (/already exists/.test(msg)) return 'That entry is already back in your history.';
  if (/Demo data can only/.test(msg)) return 'Demo data can only be loaded when there are no logs.';
  if (/permission/i.test(msg)) return 'Notification permission was not granted. Enable it in Settings.';
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastCtrl = inject(ToastController);
  private undoToast?: HTMLIonToastElement;

  /** Anchor above the tab bar when it exists so toasts never cover it. */
  private anchor(): HTMLElement | undefined {
    return document.querySelector<HTMLElement>('ion-tab-bar') ?? undefined;
  }

  async show(message: string, color?: 'danger' | 'success'): Promise<void> {
    const t = await this.toastCtrl.create({
      message, duration: 2500, position: 'bottom', positionAnchor: this.anchor(), color, translucent: true,
    });
    await t.present();
  }

  error(err: unknown, fallback = 'Something went wrong'): Promise<void> {
    return this.show(friendly(err, fallback), 'danger');
  }

  /** Toast with an Undo button; replaces any previous undo toast. */
  async undoable(message: string, onUndo: () => Promise<void>): Promise<void> {
    await this.undoToast?.dismiss();
    const t = await this.toastCtrl.create({
      message,
      duration: 6000,
      position: 'bottom',
      positionAnchor: this.anchor(),
      translucent: true,
      buttons: [
        {
          text: 'Undo',
          role: 'cancel',
          handler: () => {
            onUndo().catch((e) => this.error(e, 'Could not undo'));
          },
        },
      ],
    });
    this.undoToast = t;
    await t.present();
  }
}
