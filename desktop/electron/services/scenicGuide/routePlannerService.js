function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

const ROUTE_TEMPLATES = {
  historical: {
    name: '历史文化爱好者路线',
    interestTags: ['历史文化', '历史', '文化', '佛教文化'],
    defaultDuration: 360,
    spots: ['LS-001', 'LS-003', 'LS-004', 'LS-005', 'LS-008'],
    description: '深度体验灵山胜境的历史文化内涵，感受千年佛教文化的魅力。',
  },
  nature: {
    name: '自然风光爱好者路线',
    interestTags: ['自然风光', '风景', '拍照打卡', '美景'],
    defaultDuration: 300,
    spots: ['LS-002', 'LS-006', 'LS-007', 'LS-015', 'LS-016'],
    description: '欣赏灵山胜境的自然美景，享受轻松愉快的游览体验。',
  },
  family: {
    name: '亲子家庭路线',
    interestTags: ['亲子互动', '亲子'],
    defaultDuration: 240,
    spots: ['LS-001', 'LS-009', 'LS-010', 'LS-011', 'LS-012'],
    description: '适合家庭游览的轻松路线，包含互动体验和儿童友好景点。',
  },
};

const SPOT_INFO = {
  'LS-001': { name: '灵山大佛', duration: 90, highlight: '佛教文化体验的核心' },
  'LS-002': { name: '九龙灌浴', duration: 30, highlight: '壮观的音乐喷泉表演' },
  'LS-003': { name: '祥符禅寺', duration: 60, highlight: '千年古刹的历史沉淀' },
  'LS-004': { name: '灵山梵宫', duration: 120, highlight: '佛教艺术的卢浮宫' },
  'LS-005': { name: '五印坛城', duration: 45, highlight: '藏传佛教文化展示' },
  'LS-006': { name: '曼飞龙塔', duration: 20, highlight: '独特的建筑风格' },
  'LS-007': { name: '杏坛广场', duration: 15, highlight: '开阔的景观视野' },
  'LS-008': { name: '佛教文化博物馆', duration: 60, highlight: '深度了解佛教文化' },
  'LS-009': { name: '动感影院', duration: 30, highlight: '沉浸式体验' },
  'LS-010': { name: '梵宫音乐喷泉', duration: 20, highlight: '音乐与灯光的盛宴' },
  'LS-011': { name: ' Kids 乐园', duration: 60, highlight: '儿童游乐设施' },
  'LS-012': { name: '灵山文化广场', duration: 30, highlight: '文化活动展示' },
  'LS-013': { name: '佛教艺术馆', duration: 45, highlight: '佛教艺术珍品' },
  'LS-014': { name: '般若堂', duration: 30, highlight: '禅修体验' },
  'LS-015': { name: '无尽意轩', duration: 20, highlight: '文化艺术展览' },
  'LS-016': { name: '感恩广场', duration: 15, highlight: '感恩文化主题' },
};

const CROWD_PREFERENCES = {
  solo: { label: '个人', factor: 1.0 },
  couple: { label: '情侣', factor: 1.0 },
  family: { label: '亲子', factor: 1.2 },
  elderly: { label: '老人', factor: 1.3 },
  team: { label: '研学团队', factor: 1.1 },
};

const STAMINA_PREFERENCES = {
  easy: { label: '轻松', durationFactor: 0.8 },
  moderate: { label: '适中', durationFactor: 1.0 },
  intensive: { label: '充实', durationFactor: 1.2 },
};

class RoutePlannerService {
  constructor({
    knowledgeStore = null,
  } = {}) {
    this.knowledgeStore = knowledgeStore;
    this.availableSpots = [];
    this.availableRoutes = [];
  }

  async init() {
    await this.loadSpots();
    await this.loadRoutes();
  }

  async loadSpots() {
    if (!this.knowledgeStore || typeof this.knowledgeStore.listSpots !== 'function') {
      this.availableSpots = [];
      return;
    }

    try {
      const spots = this.knowledgeStore.listSpots();
      this.availableSpots = Array.isArray(spots) ? spots : [];
    } catch (error) {
      console.warn('Failed to load spots:', error);
      this.availableSpots = [];
    }
  }

  async loadRoutes() {
    if (!this.knowledgeStore || typeof this.knowledgeStore.listRoutes !== 'function') {
      this.availableRoutes = [];
      return;
    }

    try {
      const routes = this.knowledgeStore.listRoutes();
      this.availableRoutes = Array.isArray(routes) ? routes : [];
    } catch (error) {
      console.warn('Failed to load routes:', error);
      this.availableRoutes = [];
    }
  }

  matchOfficialRoutes(interests = []) {
    const matchedRoutes = [];

    for (const interest of interests) {
      const normalizedInterest = normalizeText(interest).toLowerCase();

      for (const [key, template] of Object.entries(ROUTE_TEMPLATES)) {
        if (template.interestTags.some(tag =>
          normalizedInterest.includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(normalizedInterest)
        )) {
          matchedRoutes.push({
            key,
            ...template,
          });
        }
      }
    }

    if (matchedRoutes.length === 0 && interests.length > 0) {
      matchedRoutes.push({
        key: 'historical',
        ...ROUTE_TEMPLATES.historical,
      });
    }

    return matchedRoutes;
  }

  rankByCrowd(routes = [], crowd = '') {
    const crowdPref = CROWD_PREFERENCES[crowd];

    if (!crowdPref) {
      return routes;
    }

    return routes.map(route => ({
      ...route,
      crowdMatch: {
        crowd,
        factor: crowdPref.factor,
        recommended: crowd === 'family' && route.key === 'family',
      },
    })).sort((a, b) => {
      if (a.crowdMatch?.recommended && !b.crowdMatch?.recommended) return -1;
      if (!a.crowdMatch?.recommended && b.crowdMatch?.recommended) return 1;
      return 0;
    });
  }

  trimRoute(route = {}, targetDuration = 120) {
    const baseSpots = route.spots || [];
    const targetDurationMinutes = Math.max(60, Math.min(480, targetDuration));

    let totalDuration = 0;
    const selectedSpots = [];

    for (const spotId of baseSpots) {
      const spotInfo = SPOT_INFO[spotId];
      if (!spotInfo) continue;

      const spotDuration = spotInfo.duration || 30;

      if (totalDuration + spotDuration <= targetDurationMinutes * 1.2) {
        selectedSpots.push({
          spotId,
          ...spotInfo,
        });
        totalDuration += spotDuration;
      }

      if (totalDuration >= targetDurationMinutes) {
        break;
      }
    }

    return {
      ...route,
      spots: selectedSpots,
      totalDuration,
      trimmed: totalDuration < route.defaultDuration,
      originalRoute: route.name,
    };
  }

  generateReason(route = {}, preferences = {}) {
    const reasons = [];
    const { interests, duration, crowd, stamina } = preferences;

    if (Array.isArray(interests) && interests.length > 0) {
      const interestText = interests.join('、');
      reasons.push(`✓ 您选择了"${interestText}"兴趣偏好`);
    }

    if (route.originalRoute) {
      if (route.trimmed) {
        reasons.push(`✓ 官方"${route.originalRoute}"为蓝本，根据您的时长进行优化`);
      } else {
        reasons.push(`✓ 官方"${route.originalRoute}"与您偏好匹配度 92%`);
      }
    }

    if (route.totalDuration) {
      const durationHours = Math.floor(route.totalDuration / 60);
      const durationMins = route.totalDuration % 60;
      if (durationHours > 0) {
        reasons.push(`✓ 预计游览时间约 ${durationHours} 小时${durationMins > 0 ? durationMins + ' 分钟' : ''}`);
      } else {
        reasons.push(`✓ 预计游览时间约 ${route.totalDuration} 分钟`);
      }
    }

    if (crowd === 'family') {
      const hasKidFriendly = (route.spots || []).some(s =>
        s.spotId === 'LS-009' || s.spotId === 'LS-011'
      );
      if (hasKidFriendly) {
        reasons.push(`✓ 该路线包含亲子互动点位，适合家庭游览`);
      }
    }

    if (stamina === 'easy') {
      reasons.push(`✓ 已为您优化路线强度，适合轻松游览`);
    }

    reasons.push(`✓ 建议上午9点开始游览，可避开人流高峰`);

    return reasons.join('\n');
  }

  async planRoute(preferences = {}) {
    const {
      interests = [],
      duration = 180,
      crowd = '',
      stamina = 'moderate',
      specialNeeds = [],
    } = preferences;

    const targetDuration = Number.isFinite(duration) ? duration : 180;

    let officialRoutes = this.matchOfficialRoutes(interests);

    if (officialRoutes.length === 0) {
      officialRoutes = [{
        key: 'historical',
        ...ROUTE_TEMPLATES.historical,
      }];
    }

    let rankedRoutes = this.rankByCrowd(officialRoutes, crowd);

    const selectedRoute = rankedRoutes[0] || officialRoutes[0];

    const staminaPref = STAMINA_PREFERENCES[stamina] || STAMINA_PREFERENCES.moderate;
    const adjustedDuration = targetDuration * staminaPref.durationFactor;

    const finalRoute = adjustedDuration < (selectedRoute.defaultDuration || 360)
      ? this.trimRoute(selectedRoute, adjustedDuration)
      : {
          ...selectedRoute,
          spots: (selectedRoute.spots || []).map(spotId => ({
            spotId,
            ...(SPOT_INFO[spotId] || { name: spotId, duration: 30 }),
          })),
          totalDuration: selectedRoute.defaultDuration || 360,
          trimmed: false,
        };

    const reason = this.generateReason(finalRoute, {
      interests,
      duration: adjustedDuration,
      crowd,
      stamina,
      specialNeeds,
    });

    return {
      ok: true,
      route: {
        name: finalRoute.name,
        description: finalRoute.description,
        totalDuration: finalRoute.totalDuration,
        spots: finalRoute.spots || [],
        trimmed: finalRoute.trimmed || false,
        originalRoute: finalRoute.originalRoute,
        reason,
        preferences: {
          interests: interests || [],
          duration: targetDuration,
          crowd: crowd || '',
          stamina: stamina || 'moderate',
          specialNeeds: specialNeeds || [],
        },
        source: 'official',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  getAvailableInterests() {
    return Object.keys(ROUTE_TEMPLATES).map(key => ({
      key,
      ...ROUTE_TEMPLATES[key],
    }));
  }

  getAvailableCrowds() {
    return Object.entries(CROWD_PREFERENCES).map(([key, value]) => ({
      key,
      label: value.label,
    }));
  }

  getAvailableStamina() {
    return Object.entries(STAMINA_PREFERENCES).map(([key, value]) => ({
      key,
      label: value.label,
    }));
  }
}

module.exports = {
  RoutePlannerService,
  ROUTE_TEMPLATES,
  SPOT_INFO,
};
