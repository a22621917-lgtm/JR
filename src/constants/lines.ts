export interface LineMeta {
  key: string;
  name: string;
  symbol: string;
  color: string;
  textColor: string;
  borderColor: string;
  description: string;
  directionLabels: {
    0: string; // dir 0
    1: string; // dir 1
  };
}

export const KNOWN_LINES: Record<string, LineMeta> = {
  osakaloop: {
    key: 'osakaloop',
    name: '大阪環状線',
    symbol: 'O',
    color: '#E25227', // Osaka Loop Line Red-Orange
    textColor: '#ffffff',
    borderColor: '#E25227',
    description: '大阪〜天王寺〜大阪 (環状)',
    directionLabels: {
      0: '内回り (反時計回り)',
      1: '外回り (時計回り)',
    },
  },
  kyoto: {
    key: 'kyoto',
    name: 'JR京都線',
    symbol: 'A',
    color: '#0072BC', // Blue
    textColor: '#ffffff',
    borderColor: '#0072BC',
    description: '京都〜大阪',
    directionLabels: {
      0: '上り (京都方面)',
      1: '下り (大阪方面)',
    },
  },
  kobesanyo: {
    key: 'kobesanyo',
    name: 'JR神戸線・山陽線',
    symbol: 'A',
    color: '#0072BC', // Blue
    textColor: '#ffffff',
    borderColor: '#0072BC',
    description: '大阪〜姫路・姫路〜上郡',
    directionLabels: {
      0: '上り (大阪方面)',
      1: '下り (姫路・上郡方面)',
    },
  },
  yamatoji: {
    key: 'yamatoji',
    name: '大和路線',
    symbol: 'Q',
    color: '#00A650', // Green
    textColor: '#ffffff',
    borderColor: '#00A650',
    description: 'JR難波〜加茂',
    directionLabels: {
      0: '上り (JR難波方面)',
      1: '下り (奈良・加茂方面)',
    },
  },
  osakahigashi: {
    key: 'osakahigashi',
    name: 'おおさか東線',
    symbol: 'F',
    color: '#4753A2', // Navy / Violet
    textColor: '#ffffff',
    borderColor: '#4753A2',
    description: '大阪〜新大阪〜久宝寺',
    directionLabels: {
      0: '上り (大阪・新大阪方面)',
      1: '下り (久宝寺方面)',
    },
  },
  hanwahagoromo: {
    key: 'hanwahagoromo',
    name: '阪和線・羽衣線',
    symbol: 'R',
    color: '#F68B1F', // Orange
    textColor: '#ffffff',
    borderColor: '#F68B1F',
    description: '天王寺〜和歌山',
    directionLabels: {
      0: '上り (天王寺方面)',
      1: '下り (和歌山方面)',
    },
  },
  yumesaki: {
    key: 'yumesaki',
    name: 'JRゆめ咲線',
    symbol: 'P',
    color: '#003580', // Deep Navy
    textColor: '#ffffff',
    borderColor: '#003580',
    description: '西九条〜桜島 (USJ方面)',
    directionLabels: {
      0: '上り (西九条方面)',
      1: '下り (桜島方面)',
    },
  },
  tozai: {
    key: 'tozai',
    name: 'JR東西線',
    symbol: 'H',
    color: '#D5007F', // Pink
    textColor: '#ffffff',
    borderColor: '#D5007F',
    description: '京橋〜尼崎',
    directionLabels: {
      0: '上り (京橋方面)',
      1: '下り (尼崎方面)',
    },
  },
  gakkentoshi: {
    key: 'gakkentoshi',
    name: '学研都市線',
    symbol: 'H',
    color: '#D5007F', // Pink
    textColor: '#ffffff',
    borderColor: '#D5007F',
    description: '木津〜京橋',
    directionLabels: {
      0: '上り (木津方面)',
      1: '下り (京橋方面)',
    },
  },
  nara: {
    key: 'nara',
    name: '奈良線',
    symbol: 'D',
    color: '#9E5926', // Brown
    textColor: '#ffffff',
    borderColor: '#9E5926',
    description: '京都〜奈良・木津',
    directionLabels: {
      0: '上り (京都方面)',
      1: '下り (奈良・木津方面)',
    },
  },
  takarazuka: {
    key: 'takarazuka',
    name: 'JR宝塚線',
    symbol: 'G',
    color: '#F8B500', // Yellow/Gold
    textColor: '#1a1a1a',
    borderColor: '#F8B500',
    description: '大阪〜新三田',
    directionLabels: {
      0: '上り (大阪方面)',
      1: '下り (宝塚・新三田方面)',
    },
  },
  kosei: {
    key: 'kosei',
    name: '湖西線',
    symbol: 'B',
    color: '#00A3E0', // Cyan
    textColor: '#ffffff',
    borderColor: '#00A3E0',
    description: '近江塩津〜京都',
    directionLabels: {
      0: '上り (近江塩津方面)',
      1: '下り (京都方面)',
    },
  },
  kansaiairport: {
    key: 'kansaiairport',
    name: '関西空港線',
    symbol: 'S',
    color: '#0078C1', // Blue
    textColor: '#ffffff',
    borderColor: '#0078C1',
    description: '日根野〜関西空港',
    directionLabels: {
      0: '上り (日根野方面)',
      1: '下り (関西空港方面)',
    },
  },
  sagano: {
    key: 'sagano',
    name: '嵯峨野線',
    symbol: 'E',
    color: '#8F4399', // Purple
    textColor: '#ffffff',
    borderColor: '#8F4399',
    description: '京都〜園部',
    directionLabels: {
      0: '上り (京都方面)',
      1: '下り (園部方面)',
    },
  },
};

// Train display type color and style mapping
export interface TrainTypeStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  badge: string;
}

export function getTrainTypeStyle(displayType: string): TrainTypeStyle {
  const dt = displayType.trim();

  if (dt.includes('特急')) {
    return {
      label: '特急',
      bg: 'bg-rose-950/80',
      text: 'text-rose-200',
      border: 'border-rose-600',
      badge: 'bg-rose-600 text-white',
    };
  }
  if (dt.includes('新快速')) {
    return {
      label: '新快速',
      bg: 'bg-blue-950/80',
      text: 'text-blue-200',
      border: 'border-blue-500',
      badge: 'bg-blue-600 text-white',
    };
  }
  if (dt.includes('快速') || dt.includes('大和路') || dt.includes('丹波路') || dt.includes('みやこ路')) {
    return {
      label: dt,
      bg: 'bg-amber-950/80',
      text: 'text-amber-200',
      border: 'border-amber-500',
      badge: 'bg-amber-500 text-slate-950 font-bold',
    };
  }
  if (dt.includes('区間快速')) {
    return {
      label: '区間快速',
      bg: 'bg-emerald-950/80',
      text: 'text-emerald-200',
      border: 'border-emerald-500',
      badge: 'bg-emerald-600 text-white',
    };
  }
  if (dt.includes('関空') || dt.includes('紀州') || dt.includes('関空紀州')) {
    return {
      label: dt,
      bg: 'bg-orange-950/80',
      text: 'text-orange-200',
      border: 'border-orange-500',
      badge: 'bg-gradient-to-r from-blue-600 to-orange-500 text-white',
    };
  }
  if (dt.includes('直通快速')) {
    return {
      label: '直通快速',
      bg: 'bg-cyan-950/80',
      text: 'text-cyan-200',
      border: 'border-cyan-500',
      badge: 'bg-cyan-600 text-white',
    };
  }

  // Default "普通" (Local)
  return {
    label: dt || '普通',
    bg: 'bg-slate-800/80',
    text: 'text-slate-200',
    border: 'border-slate-600',
    badge: 'bg-slate-700 text-slate-100',
  };
}
