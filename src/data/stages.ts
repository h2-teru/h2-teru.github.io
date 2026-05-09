export interface Stage {
  id: number;
  handle: string;
  tag: string;
  timeAgo: string;
  name: string;
  risk: 'LOW' | 'MED' | 'HIGH';
  riskLevel: number;
  reward: string;
  teaser: string;
  fullMsg: string;
  requiredCompleted: number;
  colorCount: number;
}

export const STAGES: Stage[] = [
  {
    id: 1,
    handle: 'ghost_zero',
    tag: 'ANON',
    timeAgo: '14m前',
    name: 'KASUMI Bank · Subnet 03',
    risk: 'LOW',
    riskLevel: 1,
    reward: '128 ¢',
    teaser: '小口座のアクセスログを消したい。急いでる。金は払う。',
    fullMsg: 'ターゲットのファイアウォールを突破して、取引ログを持ち帰ってくれ。配線を全て繋げばセキュリティを "NULL" に書き換えられる。時間との勝負だ。',
    requiredCompleted: 0,
    colorCount: 2,
  },
  {
    id: 2,
    handle: 'silent_arc',
    tag: 'ANON',
    timeAgo: '47m前',
    name: 'NeoTel Telco · Cell Cluster',
    risk: 'LOW',
    riskLevel: 2,
    reward: '256 ¢',
    teaser: '追跡者の通信を遮断したい。報酬は弾む。リスクは低い。',
    fullMsg: 'ターゲットのファイアウォールを突破して、取引ログを持ち帰ってくれ。配線を全て繋げばセキュリティを "NULL" に書き換えられる。時間との勝負だ。',
    requiredCompleted: 1,
    colorCount: 2,
  },
  {
    id: 3,
    handle: 'null_byte',
    tag: 'ANON',
    timeAgo: '3h前',
    name: 'CyberMed Lab · Genome Vault',
    risk: 'MED',
    riskLevel: 3,
    reward: '512 ¢',
    teaser: '研究データに興味がある。取引できる？実績ある人限定。',
    fullMsg: 'ターゲットのファイアウォールを突破して、機密データを持ち帰ってくれ。配線を全て繋げばセキュリティを "NULL" に書き換えられる。時間との勝負だ。',
    requiredCompleted: 1,
    colorCount: 3,
  },
  {
    id: 4,
    handle: '0x_specter',
    tag: 'ANON',
    timeAgo: '6h前',
    name: 'AeroCorp HQ · Drone Mesh',
    risk: 'MED',
    riskLevel: 3,
    reward: '1.0k ¢',
    teaser: '軍事ドローンの管制をオフラインにしてくれ。腕に自信のある人だけ。',
    fullMsg: 'ターゲットのファイアウォールを突破して、機密データを持ち帰ってくれ。配線を全て繋げばセキュリティを "NULL" に書き換えられる。時間との勝負だ。',
    requiredCompleted: 2,
    colorCount: 3,
  },
  {
    id: 5,
    handle: 'REDACTED',
    tag: '???',
    timeAgo: '??h前',
    name: 'OmniGov Archive · Zero Floor',
    risk: 'HIGH',
    riskLevel: 5,
    reward: '2.4k ¢',
    teaser: '[ENCRYPTED] ███████ ██████████ ██████。必要な人には分かる。',
    fullMsg: 'ターゲットのファイアウォールを突破して、機密データを持ち帰ってくれ。配線を全て繋げばセキュリティを "NULL" に書き換えられる。時間との勝負だ。',
    requiredCompleted: 3,
    colorCount: 4,
  },
];

export const RISK_COLOR: Record<Stage['risk'], string> = {
  LOW:  '#4da3ff',
  MED:  '#ffb454',
  HIGH: '#ff4d6d',
};
