import { Component, Input } from '@angular/core';
import { sleepinessTier, tierLabel } from './format';

/** Sleepiness score shown as number + text on a tier-coloured pill. */
@Component({
  selector: 'app-tier-pill',
  template: `<span class="tier num" [class]="'tier tier-' + tier">{{ value }} · {{ label }}</span>`,
})
export class TierPillComponent {
  @Input({ required: true }) value!: number;
  get tier() { return sleepinessTier(this.value); }
  get label() { return tierLabel(this.value); }
}
