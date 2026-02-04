import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Rect } from 'react-native-svg';
import {
  Phone,
  GeoLocation,
  Calendar,
  Book,
  AccidentAndEmergency,
  PpeMask,
  Justice,
  GroupDiscussionMeeting,
  Laptop,
  RegisterBook,
  Communication,
  ContactSupport,
  HealthWorker,
  HospitalSymbol,
  Liver,
  Spleen,
  Kidneys,
  Pancreas,
  Thyroid,
  Pediatrics,
  Radiology,
  Diagnostics,
  UltrasoundScanner,
  Xray,
  Skeleton,
  Stomach,
  Syringe
} from 'healthicons-react-native/outline';

import { sections } from './src/data/links';
import { routeByHref } from './src/data/routes';
import contentIndex from './src/data/content-index.json';
import { contentMap } from './src/data/content-map';
import { assetMap } from './src/data/asset-map';
import directoryData from './src/data/phone-directory.json';
import structuredData from './src/data/structured-data.json';
import decisionTrees from './src/data/decision-trees.json';
import fleischnerData from './src/data/fleischner-data.json';
import directionsSites from './src/data/directions-sites.json';
import { structuredImageMap } from './src/data/structured-image-map';
import { directoryConfigs, directoryDefaults } from './src/data/directory-config';

const colors = {
  ink: '#0c1b2e',
  muted: '#5c7089',
  panel: '#0f1f36',
  accent: '#1fb6ff',
  accentStrong: '#0c8cfb',
  accentWarm: '#1fb6ff',
  logoBlue: '#2C6DAE',
  border: '#d7e2ef',
  card: '#ffffff',
  bg: '#f6f9fe',
  haze: '#e6f1ff'
};

const fonts = {
  display: Platform.select({ ios: 'Avenir Next', android: 'serif' }),
  body: Platform.select({ ios: 'Avenir Next', android: 'serif' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace' })
};

const DEFAULT_SETTINGS = {
  firstName: 'Zahir',
  lastName: 'momin',
  homeAddress: '',
  phoneNumber: '(404) 384-5441',
  emailAddress: 'zahirabbasmomin@gmail.com',
  favoriteTickers: 'NVDA, AAPL, MSFT, AMZN, WMT, JPM, V, JNJ, HD, CVX, PG, KO',
  enableDirections: false,
  remindWorklist: false,
  warnEvents: false,
  feedbackText: ''
};

const EVENTS_LOOKAHEAD_DAYS = 7;
const EVENTS_RADIUS_MILES = 15;
const CONSTRUCTION_RADIUS_MILES = 10;
const EVENTS_MAX_PER_SITE = 6;
const CONSTRUCTION_MAX_PER_SITE = 4;
const BRAVES_TEAM_ID = 144;
const TRUIST_PARK = { lat: 33.8907, lon: -84.4677 };
const BRAVES_RADIUS_MILES = 25;
const getEnvVar = (key) =>
  (typeof process !== 'undefined' && process.env ? process.env[key] : '') || '';
const TICKETMASTER_KEY = getEnvVar('EXPO_PUBLIC_TICKETMASTER_KEY');
const SEATGEEK_KEY = getEnvVar('EXPO_PUBLIC_SEATGEEK_CLIENT_ID');

const BASE_WIDTH = 390;
const DEVICE_WIDTH = Dimensions.get('window').width || BASE_WIDTH;
const DEVICE_FONT_SCALE = PixelRatio.getFontScale ? PixelRatio.getFontScale() : 1;
const FONT_SCALE_MULTIPLIER = 1;
const PLATFORM_FONT_MULTIPLIER = Platform.OS === 'android' ? 0.85 : 1;
const FONT_SCALE =
  (Math.min(DEVICE_WIDTH / BASE_WIDTH, 1) *
    FONT_SCALE_MULTIPLIER *
    PLATFORM_FONT_MULTIPLIER) /
  DEVICE_FONT_SCALE;
const scaleFont = (size) => Math.round(size * FONT_SCALE);
const TYPE_SCALE_FACTOR = 1.25;
const typeScale = {
  display: scaleFont(24 * TYPE_SCALE_FACTOR),
  title: scaleFont(20 * TYPE_SCALE_FACTOR),
  subtitle: scaleFont(18 * TYPE_SCALE_FACTOR),
  subhead: scaleFont(16 * TYPE_SCALE_FACTOR),
  body: scaleFont(14 * TYPE_SCALE_FACTOR),
  caption: scaleFont(12 * TYPE_SCALE_FACTOR)
};

const NAV_SCALE = 0.75;
const BOTTOM_NAV_HEIGHT = Math.round(135 * NAV_SCALE);
const NAV_ICON_SIZE = Math.round(27 * NAV_SCALE * 1.1);
const NAV_ICON_BOX = Math.round(54 * NAV_SCALE);
const NAV_ICON_RADIUS = Math.round(18 * NAV_SCALE);
const NAV_PADDING_H = Math.round(18 * NAV_SCALE);
const NAV_PADDING_TOP = Math.round(12 * NAV_SCALE);
const NAV_PADDING_BOTTOM = Math.round(15 * NAV_SCALE);
const NAV_ITEM_PADDING = Math.round(9 * NAV_SCALE);
const NAV_TOOLTIP_OFFSET = Math.round(70 * NAV_SCALE);
const MENU_SCALE = 1.25;
const MENU_BUTTON_SIZE = Math.round(36 * MENU_SCALE);
const MENU_BUTTON_RADIUS = Math.round(MENU_BUTTON_SIZE / 2);
const MENU_ICON_SIZE = Math.round(18 * MENU_SCALE);
const MENU_BUTTON_TOP = 56;
const MENU_POPOVER_TOP = MENU_BUTTON_TOP + MENU_BUTTON_SIZE + 8;

const normalizeSource = (value = '') =>
  value
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buildContentLookup = () => {
  const map = new Map();
  contentIndex.forEach((entry) => {
    const key = normalizeSource(entry.source);
    if (key) {
      map.set(key, entry.id);
    }
  });
  return map;
};

const useFadeIn = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true
    }).start();
  }, [opacity]);
  return opacity;
};

const filterSections = (query, list) => {
  const term = query.trim().toLowerCase();
  if (!term) return list;
  return list
    .map((section) => {
      if (section.groups) {
        const groups = section.groups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => item.title.toLowerCase().includes(term))
          }))
          .filter((group) => group.items.length);
        if (!groups.length) return null;
        return { ...section, groups };
      }
      const items = (section.items || []).filter((item) => item.title.toLowerCase().includes(term));
      if (!items.length) return null;
      return { ...section, items };
    })
    .filter(Boolean);
};

const sectionCategoryOrder = [
  'Directories',
  'Directions, Maps & Weather',
  'Schedules & Vacation',
  'Follow Up Guidelines',
  'Trauma',
  'Section Reference',
  'Safety Manuals',
  'Contrast Administration Guidelines',
  'Policies & Procedures',
  'Rotation Assignments',
  'Stock Watch',
  'Information Technology'
];

const sectionCategoryMap = {
  'Facilities Directory': 'Directories',
  'Personnel Directory': 'Directories',
  'Schedules & Vacation': 'Schedules & Vacation',
  'Directions, Maps & Weather': 'Directions, Maps & Weather',
  'Incidental Findings Management': 'Follow Up Guidelines',
  'Calculators & Risk Tools': 'Follow Up Guidelines',
  'ACR RADS and Follow Up Guidelines': 'Follow Up Guidelines',
  Trauma: 'Trauma',
  'Pediatric Radiology Reference': 'Section Reference',
  'MSK Radiology Reference': 'Section Reference',
  'GI Radiology Reference': 'Section Reference',
  'Ultrasound Worksheets': 'Section Reference',
  'Interesting Articles': 'Section Reference',
  'Radiation Safety': 'Safety Manuals',
  'MRI Safety': 'Safety Manuals',
  'ACR Contrast Manual': 'Safety Manuals',
  'MRI Safety Manual': 'Safety Manuals',
  'Contrast Administration Guidelines': 'Contrast Administration Guidelines',
  'Rotation Worklist Assignments': 'Rotation Assignments',
  'Information Technology': 'Information Technology',
  'Stock Watch': 'Stock Watch',
  'Contrast Policies & Procedures': 'Policies & Procedures',
  'General Policies & Procedures': 'Policies & Procedures',
  'Policies by Section': 'Policies & Procedures',
  'Protocols by Section': 'Policies & Procedures'
};

const groupSectionsByCategory = (list) => {
  const grouped = new Map();
  list.forEach((section) => {
    const category = sectionCategoryMap[section.title] || 'Section Reference';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category).push(section);
  });

  const ordered = [];
  sectionCategoryOrder.forEach((category) => {
    if (grouped.has(category)) {
      ordered.push({ title: category, sections: grouped.get(category) });
      grouped.delete(category);
    }
  });

  grouped.forEach((sections, title) => {
    ordered.push({ title, sections });
  });

  return ordered;
};

const categoryIconMap = {
  Directories: 'phone',
  'Directions, Maps & Weather': 'geo',
  'Schedules & Vacation': 'calendar',
  'Follow Up Guidelines': 'book',
  Trauma: 'trauma',
  'Section Reference': 'book',
  'Safety Manuals': 'ppe',
  'Contrast Administration Guidelines': 'policy',
  'Policies & Procedures': 'justice',
  'Rotation Assignments': 'rotation',
  'Stock Watch': 'calculator',
  'Information Technology': 'laptop'
};

const getCategoryIcon = (title) => categoryIconMap[title] || 'folder';

const categoryNavIconMap = {
  'Stock Watch': { iconType: 'ion', icon: 'stats-chart' },
  'Contrast Administration Guidelines': { iconType: 'health', icon: 'syringe' }
};

const getLinkIcon = (title = '') => {
  const value = title.toLowerCase();
  if (/(liver|hepatic)/.test(value)) return 'liver';
  if (/(spleen|splenic)/.test(value)) return 'spleen';
  if (/(pancreas|pancreatic)/.test(value)) return 'pancreas';
  if (/(kidney|renal)/.test(value)) return 'kidneys';
  if (/thyroid/.test(value)) return 'thyroid';
  if (/\ber\b/.test(value) || /emergency\s*room/.test(value)) return 'er';
  if (/\bus\b/.test(value) || /ultrasound/.test(value)) return 'us';
  if (/\bct\b/.test(value) || /computed\s*tomography/.test(value)) return 'ct';
  if (/\bmri\b/.test(value) || /magnetic\s*resonance/.test(value)) return 'mri';
  if (/\bnm\b/.test(value) || /nuclear\s*medicine/.test(value)) return 'nm';
  if (/\bmsk\b/.test(value) || /musculoskeletal/.test(value)) return 'msk';
  if (/\bgi\b/.test(value) || /gastro(en|)terology/.test(value)) return 'gi';
  if (/(pediatric|child)/.test(value)) return 'pediatrics';
  if (/trauma|injury|emergency/.test(value)) return 'trauma';
  if (/(imaging|mri|ct|ultrasound|xray)/.test(value)) return 'imaging';
  if (/(phone|call|contact|directory|numbers)/.test(value)) return 'phone';
  if (/(map|directions|site|hospital)/.test(value)) return 'geo';
  if (/weather|forecast/.test(value)) return 'geo';
  if (/(schedule|vacation|shift|rotation)/.test(value)) return 'calendar';
  if (/(calculator|calc|risk|score|index)/.test(value)) return 'calculator';
  if (/(protocol|policy|manual|guideline|reference)/.test(value)) return 'policy';
  if (/(stock|ticker|market|equity)/.test(value)) return 'laptop';
  if (/(it|technology|pacs)/.test(value)) return 'laptop';
  return 'document';
};

const healthIconComponents = {
  phone: Phone,
  geo: GeoLocation,
  calendar: Calendar,
  book: Book,
  trauma: AccidentAndEmergency,
  ppe: PpeMask,
  justice: Justice,
  rotation: GroupDiscussionMeeting,
  laptop: Laptop,
  folder: RegisterBook,
  support: ContactSupport,
  chat: Communication,
  worker: HealthWorker,
  hospital: HospitalSymbol,
  liver: Liver,
  spleen: Spleen,
  kidneys: Kidneys,
  pancreas: Pancreas,
  thyroid: Thyroid,
  pediatrics: Pediatrics,
  imaging: Radiology,
  er: AccidentAndEmergency,
  us: UltrasoundScanner,
  ct: Diagnostics,
  mri: Radiology,
  nm: Radiology,
  msk: Skeleton,
  gi: Stomach,
  calculator: Diagnostics,
  policy: Justice,
  syringe: Syringe,
  document: RegisterBook,
  default: HospitalSymbol
};

const HealthIcon = ({ name, size = 18, color = colors.panel, style }) => {
  const IconComponent = healthIconComponents[name] || healthIconComponents.default;
  return <IconComponent width={size} height={size} color={color} style={style} />;
};

const directoryIconMap = {
  'directory-master': 'phone',
  'directory-er': 'er',
  'directory-ct': 'ct',
  'directory-mri': 'mri',
  'directory-us': 'us',
  'directory-xray': 'ct',
  'directory-nm': 'nm',
  'directory-cobb': 'hospital',
  'directory-kennestone': 'hospital',
  'directory-douglas': 'hospital',
  'directory-paulding': 'hospital',
  'directory-north-fulton': 'hospital'
};

const calculatorIconMap = {
  'adrenal-ct': 'imaging',
  'adrenal-mri': 'imaging',
  'hepatic-fat': 'liver',
  gfr: 'kidneys',
  'iodinated-contrast': 'policy',
  'gadolinium-contrast': 'policy',
  'mri-safety-compatibility': 'mri',
  'pancreatic-fluid': 'pancreas',
  'liver-length': 'liver',
  'renal-length': 'kidneys',
  'spleen-size': 'spleen',
  'carotid-stenosis': 'justice',
  tirads: 'thyroid',
  gallbladder: 'imaging'
};

const structuredKindIconMap = {
  contacts: 'phone',
  facilityContacts: 'hospital',
  frequentContacts: 'support',
  rotation: 'rotation',
  injuryTables: 'trauma'
};

const traumaIconMap = {
  'trauma-liver': 'liver',
  'trauma-spleen': 'spleen',
  'trauma-pancreas': 'pancreas',
  'trauma-kidneys': 'kidneys'
};

const getPageIcon = ({ type, id, title, href, data } = {}) => {
  if (type === 'library') return 'book';
  if (type === 'directory') {
    return directoryIconMap[id] || getLinkIcon(title || href || '');
  }
  if (type === 'calculator') {
    return calculatorIconMap[id] || getLinkIcon(title || href || '') || 'calculator';
  }
  if (type === 'decisionTree') {
    const icon = getLinkIcon(title || href || '');
    return icon === 'document' ? 'rotation' : icon;
  }
  if (type === 'structured') {
    if (data?.kind && structuredKindIconMap[data.kind]) return structuredKindIconMap[data.kind];
    return getLinkIcon(title || href || data?.title || '');
  }
  if (type === 'content') return getLinkIcon(title || href || '');
  if (type === 'trauma') return traumaIconMap[id] || 'trauma';
  if (type === 'events') return 'calendar';
  if (type === 'weather') return 'geo';
  return getLinkIcon(title || href || '');
};

const normalizeText = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();
const digitsOnly = (value = '') => value.replace(/\D/g, '');
const isPhoneNumber = (value = '') => {
  const digits = digitsOnly(String(value || ''));
  if (digits.length === 10) return true;
  return digits.length === 11 && digits.startsWith('1');
};
const extractDirectionsDestination = (url = '') => {
  const match = /[?&]destination=([^&]+)/i.exec(url);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' '));
  } catch {
    return match[1].replace(/\+/g, ' ');
  }
};

const buildNavigationUrl = (url = '') => {
  const destination = extractDirectionsDestination(url);
  if (!destination) return null;
  const encoded = encodeURIComponent(destination);
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${encoded}&dirflg=d`;
  }
  if (Platform.OS === 'android') {
    return `google.navigation:q=${encoded}&mode=d`;
  }
  return null;
};

const openExternal = async (url) => {
  if (!url) return;
  const navUrl = /maps\/dir\/\?api=1/i.test(url) ? buildNavigationUrl(url) : null;
  if (navUrl) {
    try {
      const supported = await Linking.canOpenURL(navUrl);
      if (supported) {
        await Linking.openURL(navUrl);
        return;
      }
    } catch {
      // Fall back to original URL.
    }
  }
  Linking.openURL(url).catch(() => {});
};

const resolveStructuredImage = (src) => structuredImageMap[src] || null;
const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
const parseNumber = (value) => {
  const parsed = parseFloat(String(value || '').trim());
  return Number.isFinite(parsed) ? parsed : null;
};
const formatNumber = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '--');
const formatPercent = (value, digits = 1) =>
  Number.isFinite(value) ? `${value.toFixed(digits)}%` : '--';
const ageToMonths = (value, unit) => {
  const num = parseNumber(value);
  if (!Number.isFinite(num)) return null;
  if (unit === 'years') return num * 12;
  if (unit === 'weeks') return num * (7 / 30.437);
  return num;
};

const parseTickers = (value = '') =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.toUpperCase());

const buildStooqSymbols = (symbol = '') => {
  const clean = String(symbol || '').trim().toLowerCase();
  if (!clean) return [];
  if (clean.includes('.')) return [clean];
  return [`${clean}.us`, clean];
};

const buildYahooSymbol = (symbol = '') => {
  const clean = String(symbol || '').trim().toUpperCase();
  if (!clean) return '';
  return clean.replace('.', '-');
};

const stripJinaWrapper = (text = '') => {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.toLowerCase().startsWith('date,'));
  if (startIndex > -1) return lines.slice(startIndex).join('\n');
  return text;
};

const stripJsonWrapper = (text = '') => {
  if (!text) return '';
  const startIndex = text.indexOf('{');
  if (startIndex === -1) return '';
  return text.slice(startIndex);
};

const buildEventRange = () => {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + EVENTS_LOOKAHEAD_DAYS);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate,
    endDate
  };
};

const formatEventDate = (value) => {
  if (!value) return 'Date TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const toRadians = (value) => (value * Math.PI) / 180;
const distanceMiles = (aLat, aLon, bLat, bLon) => {
  const earthRadius = 3958.8;
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const isWithinRadius = (site, target, radius) => {
  if (!Number.isFinite(site.lat) || !Number.isFinite(site.lon)) return false;
  return distanceMiles(site.lat, site.lon, target.lat, target.lon) <= radius;
};

const fetchJsonWithFallback = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Request failed');
    return await response.json();
  } catch (error) {
    try {
      const fallbackUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
      const response = await fetch(fallbackUrl);
      if (!response.ok) throw new Error('Fallback failed');
      const text = await response.text();
      const cleaned = stripJsonWrapper(text);
      return cleaned ? JSON.parse(cleaned) : null;
    } catch (fallbackError) {
      return null;
    }
  }
};

const deriveEventCategory = (name = '') => {
  const value = name.toLowerCase();
  if (/festival|fair/.test(value)) return 'Festival';
  if (/parade|celebration/.test(value)) return 'Celebration';
  if (/marathon|race/.test(value)) return 'Race';
  return '';
};

const mapTicketmasterCategory = (event) => {
  const derived = deriveEventCategory(event?.name || '');
  if (derived) return derived;
  const segment = event?.classifications?.[0]?.segment?.name || '';
  if (/sports/i.test(segment)) return 'Sports';
  if (/music/i.test(segment)) return 'Concert';
  if (/arts/i.test(segment)) return 'Show';
  if (/film|misc/i.test(segment)) return 'Festival';
  return 'Event';
};

const mapSeatGeekCategory = (event) => {
  const derived = deriveEventCategory(event?.title || '');
  if (derived) return derived;
  const type = event?.type || event?.taxonomies?.[0]?.name || '';
  if (/sports/i.test(type)) return 'Sports';
  if (/concert|music/i.test(type)) return 'Concert';
  if (/theat|show|performance/i.test(type)) return 'Show';
  if (/festival|fair|community/i.test(type)) return 'Festival';
  return 'Event';
};

const toTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  const ts = date.getTime();
  return Number.isNaN(ts) ? null : ts;
};

const isTrafficImpactEvent = (event) => {
  if (!event) return false;
  if (event.source === 'MLB Schedule') return true;
  if (Number.isFinite(event.capacity) && event.capacity >= 2000) return true;
  const descriptor = `${event.title || ''} ${event.venue || ''} ${event.category || ''}`.toLowerCase();
  if (/stadium|arena|amphitheat|coliseum|ballpark|speedway/.test(descriptor)) return true;
  if (/festival|fair|parade|celebration|marathon|race|show|concert|game|match|tournament/.test(descriptor)) {
    return true;
  }
  if (/sports|concert|show|festival|celebration/.test(descriptor)) return true;
  return false;
};

const dedupeEvents = (events = []) => {
  const seen = new Map();
  events.forEach((event) => {
    const key = `${(event.title || '').toLowerCase()}|${event.dateTime || event.dateLabel || ''}`;
    if (!seen.has(key)) {
      seen.set(key, event);
    }
  });
  return Array.from(seen.values());
};

const sortEventsByDate = (events = []) =>
  [...events].sort((a, b) => {
    const aTime = a.startTimestamp ?? toTimestamp(a.dateTime) ?? 0;
    const bTime = b.startTimestamp ?? toTimestamp(b.dateTime) ?? 0;
    return aTime - bTime;
  });

const normalizeTicketmasterEvents = (payload) => {
  const events = payload?._embedded?.events || [];
  return events.map((event) => {
    const dateTime = event?.dates?.start?.dateTime;
    const localDate = event?.dates?.start?.localDate;
    const localTime = event?.dates?.start?.localTime;
    const rawDate = dateTime || (localDate && localTime ? `${localDate}T${localTime}` : localDate);
    const venue = event?._embedded?.venues?.[0]?.name || 'Venue TBD';
    return {
      id: event?.id ? `tm-${event.id}` : `tm-${Math.random().toString(36).slice(2)}`,
      title: event?.name || 'Event',
      dateTime: rawDate,
      dateLabel: formatEventDate(rawDate),
      startTimestamp: toTimestamp(rawDate),
      venue,
      category: mapTicketmasterCategory(event),
      source: 'Ticketmaster',
      url: event?.url || ''
    };
  });
};

const normalizeSeatGeekEvents = (payload) => {
  const events = payload?.events || [];
  return events.map((event) => {
    const dateTime = event?.datetime_local || event?.datetime_utc;
    const venue = event?.venue?.name || 'Venue TBD';
    return {
      id: event?.id ? `sg-${event.id}` : `sg-${Math.random().toString(36).slice(2)}`,
      title: event?.title || 'Event',
      dateTime,
      dateLabel: formatEventDate(dateTime),
      startTimestamp: toTimestamp(dateTime),
      venue,
      category: mapSeatGeekCategory(event),
      source: 'SeatGeek',
      url: event?.url || '',
      capacity: event?.venue?.capacity || null
    };
  });
};

const normalizeBravesGames = (payload) => {
  const dates = payload?.dates || [];
  const games = dates.flatMap((entry) => entry?.games || []);
  return games
    .filter((game) => game?.teams?.home?.team?.id === BRAVES_TEAM_ID)
    .map((game) => {
      const homeTeam = game?.teams?.home?.team?.name || 'Atlanta Braves';
      const awayTeam = game?.teams?.away?.team?.name || 'Opponent';
      const dateTime = game?.gameDate || game?.officialDate || '';
      const gamePk = game?.gamePk;
      return {
        id: gamePk ? `mlb-${gamePk}` : `mlb-${Math.random().toString(36).slice(2)}`,
        title: `${homeTeam} vs ${awayTeam}`,
        dateTime,
        dateLabel: formatEventDate(dateTime),
        startTimestamp: toTimestamp(dateTime),
        venue: 'Truist Park',
        category: 'Sports',
        source: 'MLB Schedule',
        url: gamePk ? `https://www.mlb.com/gameday/${gamePk}` : ''
      };
    });
};

const fetchBravesGames = async (range) => {
  const url =
    `https://statsapi.mlb.com/api/v1/schedule?` +
    `sportId=1` +
    `&teamId=${BRAVES_TEAM_ID}` +
    `&startDate=${encodeURIComponent(range.startDate)}` +
    `&endDate=${encodeURIComponent(range.endDate)}`;
  const payload = await fetchJsonWithFallback(url);
  return normalizeBravesGames(payload);
};

const fetchTicketmasterEvents = async (site, range) => {
  if (!TICKETMASTER_KEY) return [];
  if (!Number.isFinite(site.lat) || !Number.isFinite(site.lon)) return [];
  const url =
    `https://app.ticketmaster.com/discovery/v2/events.json?` +
    `apikey=${encodeURIComponent(TICKETMASTER_KEY)}` +
    `&latlong=${encodeURIComponent(`${site.lat},${site.lon}`)}` +
    `&radius=${EVENTS_RADIUS_MILES}&unit=miles` +
    `&startDateTime=${encodeURIComponent(range.startIso)}` +
    `&endDateTime=${encodeURIComponent(range.endIso)}` +
    `&size=20&sort=date,asc`;
  const payload = await fetchJsonWithFallback(url);
  return normalizeTicketmasterEvents(payload);
};

const fetchSeatGeekEvents = async (site, range) => {
  if (!SEATGEEK_KEY) return [];
  if (!Number.isFinite(site.lat) || !Number.isFinite(site.lon)) return [];
  const url =
    `https://api.seatgeek.com/2/events?` +
    `client_id=${encodeURIComponent(SEATGEEK_KEY)}` +
    `&lat=${encodeURIComponent(site.lat)}` +
    `&lon=${encodeURIComponent(site.lon)}` +
    `&range=${EVENTS_RADIUS_MILES}mi` +
    `&datetime_utc.gte=${encodeURIComponent(range.startIso)}` +
    `&datetime_utc.lte=${encodeURIComponent(range.endIso)}` +
    `&per_page=20`;
  const payload = await fetchJsonWithFallback(url);
  return normalizeSeatGeekEvents(payload);
};

const fetchConstructionProjects = async (site) => {
  if (!Number.isFinite(site.lat) || !Number.isFinite(site.lon)) return [];
  const geometry = `${site.lon},${site.lat}`;
  const url =
    `https://rnhp.dot.ga.gov/hosting/rest/services/GEOPI_APP/MapServer/0/query?` +
    `f=json` +
    `&geometry=${encodeURIComponent(geometry)}` +
    `&geometryType=esriGeometryPoint&inSR=4326&outSR=4326` +
    `&distance=${CONSTRUCTION_RADIUS_MILES}` +
    `&units=esriSRUnit_StatuteMile` +
    `&outFields=OBJECTID,PROJECT_NAME,STATUS,PRIMARY_WORK_TYPE,COUNTIES,ROUTE_NUMS`;
  const payload = await fetchJsonWithFallback(url);
  const features = payload?.features || [];
  return features
    .map((feature) => {
      const attrs = feature?.attributes || {};
      return {
        id: attrs.OBJECTID ? `gdot-${attrs.OBJECTID}` : `gdot-${Math.random().toString(36).slice(2)}`,
        title: attrs.PROJECT_NAME || attrs.PRIMARY_WORK_TYPE || 'Roadwork',
        status: attrs.STATUS || 'Status TBD',
        roadway: attrs.ROUTE_NUMS || '',
        county: attrs.COUNTIES || '',
        source: 'GDOT Projects'
      };
    })
    .filter((item) => !/complete|closed/i.test(item.status || ''));
};

const fetchNwsForecast = async (site) => {
  if (!Number.isFinite(site.lat) || !Number.isFinite(site.lon)) return null;
  const pointUrl = `https://api.weather.gov/points/${site.lat},${site.lon}`;
  const pointData = await fetchJsonWithFallback(pointUrl);
  const forecastUrl = pointData?.properties?.forecast;
  if (!forecastUrl) return null;
  const forecastData = await fetchJsonWithFallback(forecastUrl);
  return forecastData?.properties?.periods || [];
};

const fetchNwsForecastBundle = async (site) => {
  if (!Number.isFinite(site.lat) || !Number.isFinite(site.lon)) return null;
  const pointUrl = `https://api.weather.gov/points/${site.lat},${site.lon}`;
  const pointData = await fetchJsonWithFallback(pointUrl);
  const forecastUrl = pointData?.properties?.forecast;
  const hourlyUrl = pointData?.properties?.forecastHourly;
  if (!forecastUrl) return null;
  const [forecastData, hourlyData] = await Promise.all([
    fetchJsonWithFallback(forecastUrl),
    hourlyUrl ? fetchJsonWithFallback(hourlyUrl) : Promise.resolve(null)
  ]);
  return {
    dailyPeriods: forecastData?.properties?.periods || [],
    hourlyPeriods: hourlyData?.properties?.periods || []
  };
};

const getNextWeekendDates = () => {
  const today = new Date();
  const day = today.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return {
    saturday: saturday.toISOString().slice(0, 10),
    sunday: sunday.toISOString().slice(0, 10)
  };
};

const groupForecastPeriods = (periods = []) => {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weekend = getNextWeekendDates();

  const todayPeriods = periods.filter((period) => period.startTime?.startsWith(today));
  const tomorrowPeriods = periods.filter((period) => period.startTime?.startsWith(tomorrow));
  const weekendPeriods = periods.filter((period) =>
    period.startTime?.startsWith(weekend.saturday) || period.startTime?.startsWith(weekend.sunday)
  );

  return { todayPeriods, tomorrowPeriods, weekendPeriods, weekend };
};

const buildHazardBadges = (text = '') => {
  const message = text.toLowerCase();
  const badges = [];
  if (/snow|sleet|ice/.test(message)) badges.push('Snow/Ice');
  if (/thunderstorm|lightning/.test(message)) badges.push('Thunder');
  if (/rain|shower|drizzle/.test(message)) badges.push('Rain');
  if (/fog|mist/.test(message)) badges.push('Fog');
  if (/wind|gust/.test(message)) badges.push('Wind');
  return badges;
};

const getPrecipValue = (period) => {
  const direct = period?.probabilityOfPrecipitation?.value;
  if (Number.isFinite(direct)) return clampValue(direct, 0, 100);
  const text = (period?.detailedForecast || '').toLowerCase();
  if (/heavy|numerous|widespread|torrential/.test(text)) return 80;
  if (/likely/.test(text)) return 70;
  if (/chance|scattered/.test(text)) return 40;
  if (/slight/.test(text)) return 20;
  return 0;
};

const parseWindSpeed = (value = '') => {
  const match = /(\d+)/.exec(String(value));
  if (!match) return null;
  return parseFloat(match[1]);
};

const convertCtoF = (value) => (Number.isFinite(value) ? value * 1.8 + 32 : null);
const metersToMiles = (value) => (Number.isFinite(value) ? value / 1609.34 : null);
const pascalToInHg = (value) => (Number.isFinite(value) ? value * 0.0002953 : null);

const runWithConcurrency = async (items, limit, task) =>
  new Promise((resolve) => {
    const results = new Array(items.length);
    let nextIndex = 0;
    let active = 0;

    const launch = () => {
      while (active < limit && nextIndex < items.length) {
        const currentIndex = nextIndex;
        const item = items[currentIndex];
        nextIndex += 1;
        active += 1;
        Promise.resolve(task(item, currentIndex))
          .then((result) => {
            results[currentIndex] = result;
          })
          .catch((error) => {
            results[currentIndex] = {
              ...item,
              status: 'error',
              error: error?.message || 'Unable to load'
            };
          })
          .finally(() => {
            active -= 1;
            if (nextIndex >= items.length && active === 0) {
              resolve(results);
            } else {
              launch();
            }
          });
      }
    };

    if (!items.length) {
      resolve([]);
      return;
    }
    launch();
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseStooqCsv = (text = '') => {
  const cleaned = stripJinaWrapper(text).trim();
  if (!cleaned) return [];
  const lines = cleaned.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  const dateIndex = headers.indexOf('date');
  const closeIndex = headers.indexOf('close');
  const series = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(',');
    const date = cols[dateIndex] || cols[0];
    const closeValue = cols[closeIndex] || cols[4];
    const close = parseFloat(closeValue);
    if (!date || Number.isNaN(close)) continue;
    series.push({ date, close });
  }
  return series;
};

const parseYahooChart = (text = '') => {
  const cleaned = stripJsonWrapper(text).trim();
  if (!cleaned) return [];
  let payload = null;
  try {
    payload = JSON.parse(cleaned);
  } catch (error) {
    return [];
  }
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  if (!timestamps.length || !closes.length) return [];
  const series = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const stamp = timestamps[i];
    const close = closes[i];
    if (!Number.isFinite(stamp) || !Number.isFinite(close)) continue;
    const dateObj = new Date(stamp * 1000);
    if (Number.isNaN(dateObj.getTime())) continue;
    const date = dateObj.toISOString().slice(0, 10);
    series.push({ date, close });
  }
  return series;
};

const fetchText = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Data request failed');
  }
  return response.text();
};

const fetchStooqSeries = async (symbol) => {
  const candidates = buildStooqSymbols(symbol);
  for (const stooqSymbol of candidates) {
    const baseUrl = `https://stooq.com/q/d/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
    let text = '';
    try {
      text = await fetchText(baseUrl);
    } catch (error) {
      const fallbackUrl = `https://r.jina.ai/http://stooq.com/q/d/l/?s=${encodeURIComponent(
        stooqSymbol
      )}&i=d`;
      try {
        text = await fetchText(fallbackUrl);
      } catch (fallbackError) {
        text = '';
      }
    }
    const series = parseStooqCsv(text);
    if (series.length) return series.sort((a, b) => a.date.localeCompare(b.date));
  }
  return [];
};

const fetchYahooSeries = async (symbol) => {
  const yahooSymbol = buildYahooSymbol(symbol);
  if (!yahooSymbol) return [];
  const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?range=5d&interval=1d&includePrePost=false&corsDomain=finance.yahoo.com`;
  let text = '';
  try {
    text = await fetchText(baseUrl);
  } catch (error) {
    const fallbackUrl = `https://r.jina.ai/http://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSymbol
    )}?range=5d&interval=1d&includePrePost=false&corsDomain=finance.yahoo.com`;
    try {
      text = await fetchText(fallbackUrl);
    } catch (fallbackError) {
      text = '';
    }
  }
  const series = parseYahooChart(text);
  return series.sort((a, b) => a.date.localeCompare(b.date));
};

const fetchStockSeries = async (symbol) => {
  const stooqSeries = await fetchStooqSeries(symbol);
  if (stooqSeries.length >= 2) return stooqSeries;
  const yahooSeries = await fetchYahooSeries(symbol);
  if (yahooSeries.length) return yahooSeries;
  return stooqSeries;
};

const fetchStockSeriesWithRetry = async (symbol, attempts = 2) => {
  let lastSeries = [];
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    if (attempt > 0) {
      await sleep(1200 * attempt);
    }
    lastSeries = await fetchStockSeries(symbol);
    if (lastSeries.length >= 2) return lastSeries;
  }
  return lastSeries;
};

const formatShortDate = (value = '') => {
  const parts = String(value).split('-');
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return value;
};

const formatPrice = (value) => (Number.isFinite(value) ? value.toFixed(2) : '--');
const formatChange = (value) => {
  if (!Number.isFinite(value)) return '--';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const buildSparklinePoints = (series, width, height) => {
  if (!series.length) {
    return { points: '', coords: [], min: null, max: null };
  }
  const values = series.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const lastIndex = Math.max(series.length - 1, 1);
  const coords = series.map((point, index) => {
    const x = (index / lastIndex) * width;
    const y = height - ((point.close - min) / range) * height;
    return { x, y };
  });
  const points = coords.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  return { points, coords, min, max };
};

const liverLengthBands = [
  { label: '1-3 mo', ageText: '1-3 months', minMonths: 1, maxMonths: 3, minHeightCm: 47, maxHeightCm: 64, meanMm: 64, sdMm: 10.4, p5Mm: 48, p95Mm: 82, lowerMm: 40, upperMm: 90 },
  { label: '4-6 mo', ageText: '4-6 months', minMonths: 4, maxMonths: 6, minHeightCm: 54, maxHeightCm: 73, meanMm: 73, sdMm: 10.8, p5Mm: 53, p95Mm: 86, lowerMm: 45, upperMm: 95 },
  { label: '7-9 mo', ageText: '7-9 months', minMonths: 7, maxMonths: 9, minHeightCm: 65, maxHeightCm: 78, meanMm: 79, sdMm: 8, p5Mm: 70, p95Mm: 90, lowerMm: 60, upperMm: 100 },
  { label: '12-30 mo', ageText: '12-30 months', minMonths: 12, maxMonths: 30, minHeightCm: 71, maxHeightCm: 92, meanMm: 85, sdMm: 10, p5Mm: 68, p95Mm: 98, lowerMm: 65, upperMm: 105 },
  { label: '36-59 mo', ageText: '36-59 months', minMonths: 36, maxMonths: 59, minHeightCm: 85, maxHeightCm: 109, meanMm: 86, sdMm: 11.8, p5Mm: 63, p95Mm: 105, lowerMm: 65, upperMm: 115 },
  { label: '60-83 mo', ageText: '60-83 months', minMonths: 60, maxMonths: 83, minHeightCm: 100, maxHeightCm: 130, meanMm: 100, sdMm: 13.6, p5Mm: 77, p95Mm: 124, lowerMm: 70, upperMm: 125 },
  { label: '84-107 mo', ageText: '84-107 months', minMonths: 84, maxMonths: 107, minHeightCm: 110, maxHeightCm: 131, meanMm: 105, sdMm: 10.6, p5Mm: 90, p95Mm: 123, lowerMm: 75, upperMm: 130 },
  { label: '108-131 mo', ageText: '108-131 months', minMonths: 108, maxMonths: 131, minHeightCm: 124, maxHeightCm: 149, meanMm: 105, sdMm: 12.5, p5Mm: 83, p95Mm: 128, lowerMm: 75, upperMm: 135 },
  { label: '132-155 mo', ageText: '132-155 months', minMonths: 132, maxMonths: 155, minHeightCm: 137, maxHeightCm: 153, meanMm: 115, sdMm: 14, p5Mm: 95, p95Mm: 136, lowerMm: 85, upperMm: 140 },
  { label: '156-179 mo', ageText: '156-179 months', minMonths: 156, maxMonths: 179, minHeightCm: 143, maxHeightCm: 168, meanMm: 118, sdMm: 14.6, p5Mm: 94, p95Mm: 136, lowerMm: 85, upperMm: 140 },
  { label: '180-200 mo', ageText: '180-200 months', minMonths: 180, maxMonths: 200, minHeightCm: 152, maxHeightCm: 175, meanMm: 121, sdMm: 11.7, p5Mm: 104, p95Mm: 139, lowerMm: 95, upperMm: 145 }
];

const renalLengthBands = [
  { label: '0-1 wk', minMonths: 0, maxMonths: 0.25, mean: 4.5, sd: 0.3, count: 10 },
  { label: '1 wk - 4 mo', minMonths: 0.25, maxMonths: 4, mean: 5.3, sd: 0.7, count: 54 },
  { label: '4 - 8 mo', minMonths: 4, maxMonths: 8, mean: 6.2, sd: 0.7, count: 20 },
  { label: '8 - 12 mo', minMonths: 8, maxMonths: 12, mean: 6.2, sd: 0.6, count: 8 },
  { label: '1 - 2 y', minMonths: 12, maxMonths: 24, mean: 6.6, sd: 0.5, count: 28 },
  { label: '2 - 3 y', minMonths: 24, maxMonths: 36, mean: 7.4, sd: 0.5, count: 12 },
  { label: '3 - 4 y', minMonths: 36, maxMonths: 48, mean: 7.4, sd: 0.6, count: 30 },
  { label: '4 - 5 y', minMonths: 48, maxMonths: 60, mean: 7.9, sd: 0.5, count: 26 },
  { label: '5 - 6 y', minMonths: 60, maxMonths: 72, mean: 8.1, sd: 0.5, count: 30 },
  { label: '6 - 7 y', minMonths: 72, maxMonths: 84, mean: 7.8, sd: 0.7, count: 14 },
  { label: '7 - 8 y', minMonths: 84, maxMonths: 96, mean: 8.3, sd: 0.5, count: 18 },
  { label: '8 - 9 y', minMonths: 96, maxMonths: 108, mean: 8.9, sd: 0.9, count: 18 },
  { label: '9 - 10 y', minMonths: 108, maxMonths: 120, mean: 9.2, sd: 0.9, count: 14 },
  { label: '10 - 11 y', minMonths: 120, maxMonths: 132, mean: 9.2, sd: 0.8, count: 28 },
  { label: '11 - 12 y', minMonths: 132, maxMonths: 144, mean: 9.6, sd: 0.6, count: 22 },
  { label: '12 - 13 y', minMonths: 144, maxMonths: 156, mean: 10.4, sd: 0.9, count: 18 },
  { label: '13 - 14 y', minMonths: 156, maxMonths: 168, mean: 9.8, sd: 0.8, count: 14 },
  { label: '14 - 15 y', minMonths: 168, maxMonths: 180, mean: 10.0, sd: 0.6, count: 14 },
  { label: '15 - 16 y', minMonths: 180, maxMonths: 192, mean: 11.0, sd: 0.8, count: 6 },
  { label: '16 - 17 y', minMonths: 192, maxMonths: 204, mean: 10.0, sd: 0.9, count: 10 },
  { label: '17 - 18 y', minMonths: 204, maxMonths: 216, mean: 10.5, sd: 0.3, count: 4 },
  { label: '18 - 19 y', minMonths: 216, maxMonths: 240, mean: 10.8, sd: 1.1, count: 8 }
];

const spleenLengthBands = [
  {
    label: '0-3 mo',
    minMonths: 0,
    maxMonths: 3,
    data: {
      female: { mean: 4.4, sd: 0.57, count: 22, min: 3.2, max: 5.5 },
      male: { mean: 4.6, sd: 0.84, count: 35, min: 2.8, max: 6.8 }
    }
  },
  {
    label: '3-6 mo',
    minMonths: 3,
    maxMonths: 6,
    data: {
      female: { mean: 5.2, sd: 0.47, count: 6, min: 4.5, max: 5.6 },
      male: { mean: 5.8, sd: 0.65, count: 10, min: 4.9, max: 7.0 }
    }
  },
  {
    label: '6-12 mo',
    minMonths: 6,
    maxMonths: 12,
    data: {
      female: { mean: 6.3, sd: 0.68, count: 15, min: 5.1, max: 7.5 },
      male: { mean: 6.4, sd: 0.78, count: 12, min: 5.4, max: 7.4 }
    }
  },
  {
    label: '1-2 y',
    minMonths: 12,
    maxMonths: 24,
    data: {
      female: { mean: 6.3, sd: 0.69, count: 18, min: 5.1, max: 8.2 },
      male: { mean: 6.8, sd: 0.72, count: 17, min: 5.6, max: 8.3 }
    }
  },
  {
    label: '2-4 y',
    minMonths: 24,
    maxMonths: 48,
    data: {
      female: { mean: 7.5, sd: 0.83, count: 24, min: 5.7, max: 8.9 },
      male: { mean: 7.6, sd: 1.07, count: 22, min: 5.9, max: 9.9 }
    }
  },
  {
    label: '4-6 y',
    minMonths: 48,
    maxMonths: 72,
    data: {
      female: { mean: 8.0, sd: 0.74, count: 36, min: 6.7, max: 9.5 },
      male: { mean: 8.1, sd: 1.01, count: 18, min: 6.4, max: 9.9 }
    }
  },
  {
    label: '6-8 y',
    minMonths: 72,
    maxMonths: 96,
    data: {
      female: { mean: 8.2, sd: 0.99, count: 25, min: 6.6, max: 10.0 },
      male: { mean: 8.9, sd: 0.91, count: 26, min: 7.4, max: 10.5 }
    }
  },
  {
    label: '8-10 y',
    minMonths: 96,
    maxMonths: 120,
    data: {
      female: { mean: 8.7, sd: 0.92, count: 26, min: 6.4, max: 10.5 },
      male: { mean: 9.0, sd: 1.02, count: 15, min: 7.4, max: 11.2 }
    }
  },
  {
    label: '10-12 y',
    minMonths: 120,
    maxMonths: 144,
    data: {
      female: { mean: 9.1, sd: 1.09, count: 34, min: 6.8, max: 11.4 },
      male: { mean: 9.8, sd: 1.05, count: 19, min: 7.3, max: 11.3 }
    }
  },
  {
    label: '12-14 y',
    minMonths: 144,
    maxMonths: 168,
    data: {
      female: { mean: 9.8, sd: 1.02, count: 30, min: 7.9, max: 11.6 },
      male: { mean: 10.2, sd: 0.81, count: 18, min: 8.5, max: 11.7 }
    }
  },
  {
    label: '14-17 y',
    minMonths: 168,
    maxMonths: 204,
    data: {
      female: { mean: 10.3, sd: 0.69, count: 13, min: 8.7, max: 11.0 },
      male: { mean: 10.7, sd: 0.90, count: 13, min: 9.5, max: 12.5 }
    }
  }
];

const ScreenShell = ({ children, scrollRef, contentStyle }) => (
  <LinearGradient colors={['#e6f1ff', '#f6f9fe', '#eaf2ff']} style={styles.background}>
    <ScrollView
      ref={scrollRef}
      style={styles.scrollView}
      contentContainerStyle={[styles.scroll, contentStyle]}
    >
      {children}
    </ScrollView>
  </LinearGradient>
);

const PageShell = ({ children }) => (
  <View style={styles.pageShadow}>
    <View style={styles.page}>{children}</View>
  </View>
);

const HeroHeader = ({ title, subtitle, eyebrow, action }) => (
  <LinearGradient colors={['#0f233b', '#1a3c61', '#0f5892']} style={styles.hero}>
    <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="contain" />
    <View style={styles.heroText}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action}
    </View>
  </LinearGradient>
);

const BackHeader = ({ title, onBack, icon }) => (
  <View style={styles.backHeader}>
    <Pressable onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={16} color={colors.ink} style={styles.backIcon} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
    <View style={styles.backTitleRow}>
      {icon ? <HealthIcon name={icon} size={18} color={colors.panel} style={styles.backTitleIcon} /> : null}
      <Text style={styles.backTitle} numberOfLines={1}>{title}</Text>
    </View>
  </View>
);

const BackFooter = ({ onBack }) => (
  <View style={styles.backFooter}>
    <Pressable onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={16} color={colors.ink} style={styles.backIcon} />
      <Text style={styles.backText}>Back</Text>
    </Pressable>
  </View>
);

const LinkCard = ({ title, onPress, isCompact }) => (
  <Pressable onPress={onPress} style={[styles.cardWrapper, isCompact ? styles.cardCompact : styles.cardWide]}>
    <LinearGradient colors={[colors.logoBlue, colors.logoBlue]} style={styles.linkCard}>
      <View style={styles.linkRow}>
        <HealthIcon name={getLinkIcon(title)} size={18} color="#ffffff" style={styles.linkIcon} />
        <Text style={styles.linkText} numberOfLines={2}>{title}</Text>
        <Ionicons name="chevron-forward" size={18} color="#ffffff" style={styles.linkArrow} />
      </View>
    </LinearGradient>
  </Pressable>
);

const SectionCard = ({ children, style }) => (
  <View style={[styles.sectionCard, style]}>{children}</View>
);

const CardHeader = ({ title, subtitle, right }) => (
  <View style={styles.cardHeader}>
    <View style={styles.cardHeaderText}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);

const ActionButton = ({ title, onPress, variant = 'primary' }) => (
  <Pressable
    onPress={onPress}
    style={[styles.actionButton, variant === 'ghost' ? styles.actionButtonGhost : null]}
  >
    <Text style={[styles.actionButtonText, variant === 'ghost' ? styles.actionButtonGhostText : null]}>
      {title}
    </Text>
  </Pressable>
);

const Chip = ({ label, active, onPress }) => (
  <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : null]}>
    <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
  </Pressable>
);

const WEATHER_EMPHASIS_WORDS = new Set(['rain', 'snow', 'showers', 'precipitation', 'hail']);
const WEATHER_EMPHASIS_PATTERN = /\b(rain|snow|showers|precipitation|hail)\b/gi;

const EmphasizedWeatherText = ({ text, style, emphasisStyle }) => {
  if (!text) return null;
  const parts = String(text).split(WEATHER_EMPHASIS_PATTERN);
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (WEATHER_EMPHASIS_WORDS.has(part.toLowerCase())) {
          return (
            <Text key={`weather-${index}`} style={emphasisStyle}>
              {part}
            </Text>
          );
        }
        return <Text key={`weather-${index}`}>{part}</Text>;
      })}
    </Text>
  );
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, multiline ? styles.fieldInputMultiline : null]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboardType}
      multiline={multiline}
    />
  </View>
);

const SelectField = ({ label, value, options, onChange, placeholder = 'Select' }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.select}>
        <Text style={[styles.selectText, !selected ? styles.selectPlaceholder : null]}>
          {selected ? selected.label : placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {options.map((option) => {
                const isActive = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.modalOption, isActive ? styles.modalOptionActive : null]}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, isActive ? styles.modalOptionTextActive : null]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const StatCard = ({ label, value, helper }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {helper ? <Text style={styles.statHelper}>{helper}</Text> : null}
  </View>
);

const OptionGroup = ({ label, options, value, onChange }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.chipRow}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          active={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  </View>
);

const ResultBox = ({ text }) => (
  <View style={styles.resultBox}>
    <Text style={styles.resultText}>{text}</Text>
  </View>
);

const BulletList = ({ items }) => (
  <View style={styles.list}>
    {items.map((item, index) => (
      <View key={`${index}-${item.slice(0, 16)}`} style={styles.listRow}>
        <View style={styles.bullet} />
        <Text style={[styles.paragraph, styles.contentText]}>{item}</Text>
      </View>
    ))}
  </View>
);

const HomeScreen = ({ onOpenLink, onOpenLibrary, focusCategory, focusNonce }) => {
  const [query, setQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState(() => new Set());
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());
  const fade = useFadeIn();
  const scrollRef = useRef(null);
  const categoryPositions = useRef({});
  const { width } = useWindowDimensions();
  const columns = width >= 720 ? 2 : 1;
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    setQuery('');
    if (!focusCategory) {
      setExpandedCategories(new Set());
      setExpandedSections(new Set());
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const targetSections = sections
      .filter(
        (section) =>
          (sectionCategoryMap[section.title] || 'Section Reference') === focusCategory
      )
      .map((section) => section.title);

    setExpandedCategories(new Set([focusCategory]));
    setExpandedSections(new Set(targetSections));

    const scrollToCategory = () => {
      const target = categoryPositions.current[focusCategory];
      if (Number.isFinite(target)) {
        scrollRef.current?.scrollTo({ y: Math.max(target - 12, 0), animated: true });
        return;
      }
      setTimeout(() => {
        const retryTarget = categoryPositions.current[focusCategory];
        if (Number.isFinite(retryTarget)) {
          scrollRef.current?.scrollTo({ y: Math.max(retryTarget - 12, 0), animated: true });
        }
      }, 0);
    };
    setTimeout(scrollToCategory, 0);
  }, [focusCategory, focusNonce]);

  const toggleSection = (title) => {
    setExpandedSections((prev) => {
      if (prev.has(title)) {
        return new Set();
      }
      return new Set([title]);
    });
  };

  const toggleCategory = (title) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const filtered = useMemo(() => filterSections(query, sections), [query]);
  const groupedSections = useMemo(() => groupSectionsByCategory(filtered), [filtered]);
  return (
    <ScreenShell scrollRef={scrollRef}>
      <PageShell>
        <Animated.View style={{ opacity: fade }}>
          <HeroHeader title="Reference Hub" />

          <View style={styles.worklistCard}>
            <Text style={styles.worklistTitle}>Today's Rotation: KH Late</Text>
            <Text style={styles.worklistDetail}>Worklists: 12-3 OP Credits, 3-8 ER/IP</Text>
          </View>

          <View style={styles.search}>
            <View style={styles.searchField}>
              <Ionicons name="search-outline" size={18} color={colors.muted} style={styles.searchIcon} />
              <TextInput
                placeholder="Search links by title..."
                placeholderTextColor={colors.muted}
                style={styles.searchInputBare}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </View>

              <View style={styles.sectionWrapper}>
                {groupedSections.map((category) => (
                  <View
                    key={category.title}
                    style={styles.categoryBlock}
                    onLayout={(event) => {
                      categoryPositions.current[category.title] = event.nativeEvent.layout.y;
                    }}
                  >
                    <Pressable
                      style={styles.categoryHeader}
                      onPress={() => {
                        if (!isSearching) toggleCategory(category.title);
                      }}
                    >
                      <View style={styles.categoryTitleRow}>
                        <HealthIcon name={getCategoryIcon(category.title)} size={18} color={colors.panel} style={styles.categoryIcon} />
                        <Text style={styles.categoryTitle}>{category.title}</Text>
                      </View>
                      <View style={[styles.categoryToggle, isSearching ? styles.sectionToggleDisabled : null]}>
                        <Ionicons
                          name={isSearching || expandedCategories.has(category.title) ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.ink}
                        />
                      </View>
                    </Pressable>
                    {(isSearching || expandedCategories.has(category.title)) && (
                      <View style={styles.categoryContent}>
                        {category.sections.map((section) => {
                          const isSoloSection =
                            category.sections.length === 1 &&
                            normalizeText(section.title) === normalizeText(category.title);
                          const showSectionContent = isSearching || expandedSections.has(section.title) || isSoloSection;
                          return (
                            <View key={section.title} style={styles.section}>
                              {!isSoloSection && (
                                <Pressable
                                  style={styles.sectionHeader}
                                  onPress={() => {
                                    if (!isSearching) toggleSection(section.title);
                                  }}
                                >
                                  <View style={styles.sectionTitleRow}>
                                    <HealthIcon name="folder" size={16} color={colors.panel} style={styles.sectionIcon} />
                                    <Text style={styles.sectionTitle}>{section.title}</Text>
                                  </View>
                                  <View style={[styles.sectionToggle, isSearching ? styles.sectionToggleDisabled : null]}>
                                    <Ionicons
                                      name={isSearching || expandedSections.has(section.title) ? 'chevron-up' : 'chevron-down'}
                                      size={14}
                                      color={colors.ink}
                                    />
                                  </View>
                                </Pressable>
                              )}
                              {showSectionContent && (
                                section.groups ? (
                                  section.groups.map((group) => (
                                    <View key={`${section.title}-${group.title}`} style={styles.group}>
                                      <Text style={styles.groupTitle}>{group.title}</Text>
                                      <View style={styles.linkGrid}>
                                        {group.items.map((item) => (
                                          <LinkCard
                                            key={`${section.title}-${item.href}`}
                                            title={item.title}
                                            onPress={() => onOpenLink(item)}
                                            isCompact={columns === 1}
                                          />
                                        ))}
                                      </View>
                                    </View>
                                  ))
                                ) : (
                                  <View style={styles.linkGrid}>
                                    {(section.items || []).map((item) => (
                                      <LinkCard
                                        key={`${section.title}-${item.href}`}
                                        title={item.title}
                                        onPress={() => onOpenLink(item)}
                                        isCompact={columns === 1}
                                      />
                                    ))}
                                  </View>
                                )
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))}
              </View>

          {!filtered.length && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No links match that search.</Text>
            </View>
          )}
        </Animated.View>
      </PageShell>
    </ScreenShell>
  );
};

const ContentScreen = ({ contentId, title, onBack }) => {
  const fade = useFadeIn();
  const content = contentId ? contentMap[contentId] : null;
  const displayTitle = content?.title || title || 'Content';
  const pageIcon = getPageIcon({
    type: 'content',
    title: displayTitle,
    href: content?.source || title
  });

  return (
    <ScreenShell>
      <PageShell>
        <Animated.View style={{ opacity: fade }}>
          <BackHeader title={displayTitle} onBack={onBack} icon={pageIcon} />
          {!content && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Content not found for this page.</Text>
            </View>
          )}
          {content && (
            <View style={styles.contentBody}>
              {content.blocks.map((block, index) => {
                if (block.type === 'heading') {
                  const headingStyle = block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3;
                  return (
                    <Text key={`${block.type}-${index}`} style={[headingStyle, styles.contentText]}>
                      {block.text}
                    </Text>
                  );
                }
                if (block.type === 'paragraph') {
                  return (
                    <Text key={`${block.type}-${index}`} style={[styles.paragraph, styles.contentText]}>
                      {block.text}
                    </Text>
                  );
                }
                if (block.type === 'code') {
                  return (
                    <View key={`${block.type}-${index}`} style={styles.codeBlock}>
                      <Text style={styles.codeText} selectable>
                        {block.text}
                      </Text>
                    </View>
                  );
                }
                if (block.type === 'list') {
                  return (
                    <View key={`${block.type}-${index}`} style={styles.list}>
                      {block.items.map((item, idx) => (
                        <View key={`${index}-item-${idx}`} style={styles.listRow}>
                          <View style={styles.bullet} />
                          <Text style={[styles.paragraph, styles.contentText]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  );
                }
                if (block.type === 'table') {
                  const columns = Array.isArray(block.columns) ? block.columns : [];
                  const rows = Array.isArray(block.rows) ? block.rows : [];
                  const uniform = Boolean(block.uniform);
                  const cellWidth = Number(block.cellWidth) || 120;
                  const cellHeight = Number(block.cellHeight) || 52;
                  const maxLines = Number.isFinite(Number(block.maxLines)) ? Number(block.maxLines) : 2;
                  const cellProps =
                    uniform && maxLines > 0
                      ? { numberOfLines: maxLines, ellipsizeMode: 'tail' }
                      : {};
                  const phoneLinking = Boolean(block.phoneLinks);
                  const maxColumns = [columns.length, ...rows.map((row) => row.length)]
                    .reduce((max, size) => Math.max(max, size), 0);
                  const paddedColumns = columns.length
                    ? columns.concat(Array.from({ length: Math.max(maxColumns - columns.length, 0) }, () => ''))
                    : columns;
                  const paddedRows = rows.map((row) => {
                    if (row.length >= maxColumns) return row;
                    return row.concat(Array.from({ length: maxColumns - row.length }, () => ''));
                  });
                  return (
                    <ScrollView key={`${block.type}-${index}`} horizontal style={styles.table}>
                      <View>
                        {paddedColumns.length > 0 && (
                          <View style={styles.tableRow}>
                            {paddedColumns.map((col, idx) => (
                              <Text
                                key={`${index}-col-${idx}`}
                                style={[
                                  styles.tableCell,
                                  styles.tableHeader,
                                  uniform ? styles.tableCellUniform : null,
                                  uniform ? { width: cellWidth, height: cellHeight } : null
                                ]}
                                {...cellProps}
                              >
                                {col}
                              </Text>
                            ))}
                          </View>
                        )}
                        {paddedRows.map((row, rowIndex) => (
                          <View key={`${index}-row-${rowIndex}`} style={styles.tableRow}>
                            {row.map((cell, cellIndex) => {
                              const cellText = cell == null ? '' : String(cell);
                              const phoneDigits = phoneLinking ? digitsOnly(cellText) : '';
                              const isPhone = phoneLinking && isPhoneNumber(phoneDigits);
                              const cellStyle = [
                                styles.tableCell,
                                uniform ? styles.tableCellUniform : null,
                                uniform ? { width: cellWidth, height: cellHeight } : null,
                                isPhone ? styles.tableCellLink : null
                              ];
                              if (isPhone) {
                                return (
                                  <Text
                                    key={`${index}-cell-${rowIndex}-${cellIndex}`}
                                    style={cellStyle}
                                    onPress={() => openExternal(`tel:${phoneDigits}`)}
                                    accessibilityRole="link"
                                    {...cellProps}
                                  >
                                    {cellText}
                                  </Text>
                                );
                              }
                              return (
                                <Text
                                  key={`${index}-cell-${rowIndex}-${cellIndex}`}
                                  style={cellStyle}
                                  {...cellProps}
                                >
                                  {cellText}
                                </Text>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  );
                }
                if (block.type === 'link') {
                  if (!block.url) return null;
                  return (
                    <Pressable
                      key={`${block.type}-${index}`}
                      onPress={() => openExternal(block.url)}
                      accessibilityRole="link"
                      accessibilityLabel={block.text || 'Open link'}
                      style={styles.linkButton}
                    >
                      <View style={styles.linkButtonContent}>
                      <HealthIcon name="geo" size={14} color={colors.ink} style={styles.linkButtonIcon} />
                        <Text style={styles.linkButtonText}>{block.text || 'Open link'}</Text>
                      </View>
                    </Pressable>
                  );
                }
                if (block.type === 'image') {
                  const asset = assetMap[block.assetId];
                  const uri = block.url || block.src || block.remote;
                  const source = asset || (uri ? { uri } : null);
                  return (
                    <View key={`${block.type}-${index}`} style={styles.imageCard}>
                      {source ? (
                        <Image source={source} style={styles.contentImage} resizeMode="contain" />
                      ) : (
                        <Text style={[styles.paragraph, styles.contentText]}>{block.alt || 'Image unavailable.'}</Text>
                      )}
                      {block.alt ? <Text style={styles.imageCaption}>{block.alt}</Text> : null}
                    </View>
                  );
                }
                return null;
              })}
            </View>
          )}
          <BackFooter onBack={onBack} />
        </Animated.View>
      </PageShell>
    </ScreenShell>
  );
};

const LibraryScreen = ({ onBack, onOpen }) => {
  const fade = useFadeIn();
  const [query, setQuery] = useState('');
  const pageIcon = getPageIcon({ type: 'library' });

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return contentIndex;
    return contentIndex.filter((item) => item.title.toLowerCase().includes(term));
  }, [query]);

  return (
    <ScreenShell>
      <PageShell>
        <Animated.View style={{ opacity: fade }}>
          <BackHeader title="All Pages" onBack={onBack} icon={pageIcon} />
          <View style={styles.search}>
            <TextInput
              placeholder="Search every page..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <View style={styles.libraryGrid}>
            {filtered.map((item) => (
              <Pressable key={item.id} style={styles.libraryCard} onPress={() => onOpen(item)}>
                <Text style={styles.libraryTitle}>{item.title}</Text>
                <Text style={styles.libraryMeta} numberOfLines={1}>{item.source}</Text>
              </Pressable>
            ))}
          </View>
          <BackFooter onBack={onBack} />
        </Animated.View>
      </PageShell>
    </ScreenShell>
  );
};

const DirectoryScreen = ({ directoryId, title, onBack }) => {
  const fade = useFadeIn();
  const config = directoryConfigs[directoryId] || { mode: 'all' };
  const pageIcon = getPageIcon({
    type: 'directory',
    id: directoryId,
    title: title || config.title || 'Directory'
  });
  const [query, setQuery] = useState('');
  const [activeFacility, setActiveFacility] = useState('ALL');

  const entries = useMemo(() => {
    const base = Object.entries(directoryData).flatMap(([facility, items]) => {
      if (!Array.isArray(items)) return [];
      return items
        .filter((item) => item && item.name && item.phone)
        .map((item) => ({ facility, name: item.name, phone: item.phone }));
    });
    if (config.mode === 'facility' && config.facility) {
      return base.filter((entry) => entry.facility === config.facility);
    }
    if (config.mode === 'modality' && typeof config.filter === 'function') {
      return base.filter((entry) => config.filter(entry.name));
    }
    return base;
  }, [config]);

  const filteredEntries = useMemo(() => {
    const term = normalizeText(query);
    const digits = digitsOnly(query);
    if (!term && !digits) return entries;
    return entries.filter((entry) => {
      const facilityMatch = term && normalizeText(entry.facility).includes(term);
      const nameMatch = term && normalizeText(entry.name).includes(term);
      const phoneMatch = digits
        ? digitsOnly(entry.phone).includes(digits)
        : normalizeText(entry.phone).includes(term);
      return facilityMatch || nameMatch || phoneMatch;
    });
  }, [entries, query]);

  const facilities = useMemo(() => {
    const names = Array.from(new Set(filteredEntries.map((entry) => entry.facility)));
    return names.sort((a, b) => a.localeCompare(b));
  }, [filteredEntries]);

  useEffect(() => {
    if (activeFacility !== 'ALL' && !facilities.includes(activeFacility)) {
      setActiveFacility('ALL');
    }
  }, [activeFacility, facilities]);

  const splitImagingCenterName = (name = '') => {
    const index = name.indexOf(' - ');
    if (index === -1) {
      return { center: 'Imaging Centers', label: name.trim() };
    }
    return {
      center: name.slice(0, index).trim(),
      label: name.slice(index + 3).trim()
    };
  };

  const groupImagingCenters = (items) => {
    const groups = new Map();
    items.forEach((item) => {
      const { center, label } = splitImagingCenterName(item.name);
      const entry = { ...item, name: label };
      if (!groups.has(center)) groups.set(center, []);
      groups.get(center).push(entry);
    });
    return Array.from(groups.entries());
  };

  const groupedFacilities = useMemo(() => {
    if (config.mode === 'facility') {
      return [[config.facility, filteredEntries]];
    }
    const list = activeFacility === 'ALL' ? facilities : [activeFacility];
    return list.map((facility) => [
      facility,
      filteredEntries.filter((entry) => entry.facility === facility)
    ]);
  }, [activeFacility, facilities, filteredEntries, config]);

  const handleCall = (phone) => {
    const digits = digitsOnly(phone);
    openExternal(digits ? `tel:${digits}` : '');
  };

  return (
    <ScreenShell>
      <PageShell>
        <Animated.View style={{ opacity: fade }}>
          <BackHeader
            title={title || config.title || directoryDefaults[directoryId] || 'Directory'}
            onBack={onBack}
            icon={pageIcon}
          />
          <View style={styles.search}>
            <TextInput
              placeholder="Search names, facilities, or numbers..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {config.mode !== 'facility' && facilities.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
              <Chip label="All" active={activeFacility === 'ALL'} onPress={() => setActiveFacility('ALL')} />
              {facilities.map((facility) => (
                <Chip
                  key={facility}
                  label={facility}
                  active={activeFacility === facility}
                  onPress={() => setActiveFacility(facility)}
                />
              ))}
            </ScrollView>
          )}

          {groupedFacilities.map(([facility, items]) => (
            <SectionCard key={facility} style={styles.directoryCard}>
              <CardHeader title={facility} />
              {facility === 'Imaging Centers' ? (
                <View>
                  {groupImagingCenters(items).map(([center, centerItems]) => (
                    <View key={center} style={styles.facilitySubsection}>
                      <Text style={styles.facilitySubheading}>{center}</Text>
                      {centerItems.map((entry, index) => (
                        <View key={`${center}-${index}`} style={styles.directoryRow}>
                          <View style={styles.directoryText}>
                            <Text style={styles.directoryName}>{entry.name}</Text>
                          </View>
                          <Pressable onPress={() => handleCall(entry.phone)} style={styles.callPill}>
                            <Text style={styles.callPillText}>{entry.phone}</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ) : (
                items.map((entry, index) => (
                  <View key={`${facility}-${index}`} style={styles.directoryRow}>
                    <View style={styles.directoryText}>
                      <Text style={styles.directoryName}>{entry.name}</Text>
                    </View>
                    <Pressable onPress={() => handleCall(entry.phone)} style={styles.callPill}>
                      <Text style={styles.callPillText}>{entry.phone}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </SectionCard>
          ))}

          {!filteredEntries.length && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No matches found. Try another search term.</Text>
            </View>
          )}
          <BackFooter onBack={onBack} />
        </Animated.View>
      </PageShell>
    </ScreenShell>
  );
};

const StructuredSections = ({ data, searchPlaceholder = 'Search this reference...' }) => {
  const [query, setQuery] = useState('');
  const sections = data.sections || [];

  const filteredSections = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return sections;
    return sections
      .map((section) => {
        const title = section.heading || section.title || '';
        const description = section.description || '';
        const matchesBase = normalizeText(title + ' ' + description).includes(term);
        const baseTables = section.tables || (section.table ? [section.table] : []);
        const fallbackTable =
          section.columns && section.rows
            ? [{ title: section.heading || section.title || '', columns: section.columns, rows: section.rows }]
            : [];
        const tables = baseTables.length ? baseTables : fallbackTable;
        const matchedTables = tables
          .map((table) => {
            const rows = (table.rows || []).filter((row) => normalizeText(row.join(' ')).includes(term));
            return rows.length ? { ...table, rows } : null;
          })
          .filter(Boolean);
        const items = (section.items || []).filter((item) => normalizeText(item).includes(term));
        if (matchesBase || matchedTables.length || items.length) {
          return { ...section, tables: matchedTables, items };
        }
        return null;
      })
      .filter(Boolean);
  }, [query, sections]);

  return (
    <View>
      <View style={styles.search}>
        <TextInput
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {filteredSections.map((section, index) => {
        const title = section.heading || section.title || `Section ${index + 1}`;
        const description = section.description;
        const baseTables = section.tables || (section.table ? [section.table] : []);
        const fallbackTable =
          section.columns && section.rows
            ? [{ title: section.heading || section.title || '', columns: section.columns, rows: section.rows }]
            : [];
        const tables = baseTables.length ? baseTables : fallbackTable;
        const items = section.items || [];
        const images = section.images || [];

        return (
          <SectionCard key={`${title}-${index}`} style={styles.referenceCard}>
            <CardHeader title={title} subtitle={description} />
            {tables.map((table, tableIndex) => (
              <View key={`${title}-table-${tableIndex}`} style={styles.tableBlock}>
                {table.title ? <Text style={styles.tableTitle}>{table.title}</Text> : null}
                <ScrollView horizontal style={styles.table}>
                  <View>
                    {table.columns && table.columns.length > 0 && (
                      <View style={styles.tableRow}>
                        {table.columns.map((col, colIndex) => (
                          <Text key={`${tableIndex}-col-${colIndex}`} style={[styles.tableCell, styles.tableHeader]}>
                            {col}
                          </Text>
                        ))}
                      </View>
                    )}
                    {(table.rows || []).map((row, rowIndex) => (
                      <View key={`${tableIndex}-row-${rowIndex}`} style={styles.tableRow}>
                        {row.map((cell, cellIndex) => (
                          <Text key={`${tableIndex}-cell-${rowIndex}-${cellIndex}`} style={styles.tableCell}>
                            {cell}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
            {items.length > 0 && (
              <View style={styles.list}>
                {items.map((item, itemIndex) => (
                  <View key={`${title}-item-${itemIndex}`} style={styles.listRow}>
                    <View style={styles.bullet} />
                    <Text style={[styles.paragraph, styles.contentText]}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                {images.map((image, imageIndex) => {
                  const asset = resolveStructuredImage(image.src);
                  return (
                    <View key={`${title}-image-${imageIndex}`} style={styles.imageCard}>
                      {asset ? (
                        <Image source={asset} style={styles.referenceImage} resizeMode="contain" />
                      ) : (
                        <Text style={styles.imageCaption}>{image.alt || 'Image unavailable offline.'}</Text>
                      )}
                      {image.caption ? <Text style={styles.imageCaption}>{image.caption}</Text> : null}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </SectionCard>
        );
      })}
      {!filteredSections.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No matching sections found.</Text>
        </View>
      )}
    </View>
  );
};

const ContactsScreen = ({ data }) => {
  const contacts = data.contacts || [];
  const poolPriority = ['BODY', 'NEURO', 'IR', 'NIGHTHAWK TEAM', 'PEDS', 'EMPLOYEE', 'CONTRACT', 'UNASSIGNED'];
  const [query, setQuery] = useState('');
  const [activePool, setActivePool] = useState('ALL');

  const poolKey = (pool = '') => pool.trim().toUpperCase() || 'UNASSIGNED';
  const poolLabel = (pool = '') => {
    const key = poolKey(pool);
    const labels = {
      BODY: 'Body',
      NEURO: 'Neuro',
      IR: 'Interventional',
      'NIGHTHAWK TEAM': 'Nighthawk Team',
      PEDS: 'Peds',
      EMPLOYEE: 'Employee',
      CONTRACT: 'Contract',
      UNASSIGNED: 'Unassigned'
    };
    return labels[key] || pool.trim() || 'Unassigned';
  };

  const sortedPools = useMemo(() => {
    const pools = Array.from(new Set(contacts.map((entry) => poolKey(entry.callPool))));
    return pools.sort((a, b) => {
      const ia = poolPriority.indexOf(poolKey(a));
      const ib = poolPriority.indexOf(poolKey(b));
      const safeA = ia === -1 ? 999 : ia;
      const safeB = ib === -1 ? 999 : ib;
      if (safeA === safeB) return poolLabel(a).localeCompare(poolLabel(b));
      return safeA - safeB;
    });
  }, [contacts]);

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    const digits = digitsOnly(query);
    if (!term && !digits) return contacts;
    return contacts.filter((entry) => {
      const fields = [entry.name, entry.status, entry.subSpecialty, entry.callPool, entry.email]
        .map(normalizeText)
        .join(' ');
      const textMatch = term && fields.includes(term);
      const phoneMatch = digits ? digitsOnly(entry.phone || '').includes(digits) : normalizeText(entry.phone || '').includes(term);
      return textMatch || phoneMatch;
    });
  }, [contacts, query]);

  useEffect(() => {
    if (activePool !== 'ALL' && !sortedPools.includes(activePool)) {
      setActivePool('ALL');
    }
  }, [activePool, sortedPools]);

  const visible = activePool === 'ALL'
    ? filtered
    : filtered.filter((entry) => poolKey(entry.callPool) === activePool);

  const grouped = activePool === 'ALL'
    ? sortedPools.map((pool) => [pool, filtered.filter((entry) => poolKey(entry.callPool) === pool)])
    : [[activePool, visible]];

  const buildSmsMessage = (fullName = '') => {
    const trimmed = fullName.trim();
    const parts = trimmed.split(',');
    const candidate = parts.length > 1 ? parts.slice(1).join(',').trim().split(/\s+/)[0] : trimmed.split(/\s+/)[0];
    const name = candidate || 'there';
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const date = now.toLocaleDateString();
    return `${name}, its me Zahir. Its ${time} on ${date}. Please give me a call when you have time.`;
  };

  const smsHref = (phone, message) => {
    const digits = digitsOnly(phone);
    if (!digits) return '';
    const separator = Platform.OS === 'ios' ? '&' : '?';
    return `sms:${digits}${separator}body=${encodeURIComponent(message)}`;
  };

  return (
    <View>
      <View style={styles.search}>
        <TextInput
          placeholder="Search name, specialty, pool, or phone..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
        <Chip label="All" active={activePool === 'ALL'} onPress={() => setActivePool('ALL')} />
        {sortedPools.map((pool) => (
          <Chip key={pool} label={poolLabel(pool)} active={activePool === pool} onPress={() => setActivePool(pool)} />
        ))}
      </ScrollView>
      {grouped.map(([pool, items]) => (
        <SectionCard key={pool} style={styles.referenceCard}>
          <CardHeader title={poolLabel(pool)} />
          {items.map((entry, index) => (
            <View key={`${pool}-${index}`} style={styles.contactRow}>
              <View style={styles.contactText}>
                <Text style={styles.directoryName}>{entry.name}</Text>
                <Text style={styles.contactMeta}>{entry.subSpecialty || 'Specialty N/A'}</Text>
                {entry.email ? <Text style={styles.contactMeta}>{entry.email}</Text> : null}
                <Text style={styles.contactPhone}>{entry.phone}</Text>
              </View>
              <View style={styles.contactActions}>
                <Pressable
                  onPress={() => openExternal(`tel:${digitsOnly(entry.phone)}`)}
                  style={styles.actionChip}
                  accessibilityLabel="Call"
                >
                  <HealthIcon name="phone" size={16} color={colors.ink} />
                </Pressable>
                {entry.email ? (
                  <Pressable
                    onPress={() => openExternal(`mailto:${entry.email}`)}
                    style={styles.actionChip}
                    accessibilityLabel="Email"
                  >
                    <HealthIcon name="support" size={16} color={colors.ink} />
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => openExternal(smsHref(entry.phone, buildSmsMessage(entry.name)))}
                  style={styles.actionChip}
                  accessibilityLabel="Text"
                >
                  <HealthIcon name="chat" size={16} color={colors.ink} />
                </Pressable>
              </View>
            </View>
          ))}
        </SectionCard>
      ))}
      {!visible.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No matching contacts found.</Text>
        </View>
      )}
    </View>
  );
};

const FacilityContactsScreen = ({ data }) => {
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const [query, setQuery] = useState('');
  const [activeFacility, setActiveFacility] = useState('ALL');

  const extractPhoneNumbers = (value = '') => {
    const matches = String(value).match(/\+?\d[\d().\s-]{6,}\d/g);
    return matches ? matches.map((match) => digitsOnly(match)).filter(Boolean) : [];
  };

  const pickNumber = (values) => {
    for (const value of values) {
      if (!value) continue;
      const numbers = extractPhoneNumbers(value);
      if (numbers.length) return numbers[0];
    }
    return '';
  };

  const matchesQuery = (contact, term, digits) => {
    if (!term && !digits) return true;
    const textFields = [
      contact.facility,
      contact.name,
      contact.role,
      contact.email,
      contact.phone,
      contact.office,
      contact.cell,
      contact.ascom,
      contact.fax,
      ...(contact.phones || []),
      ...(contact.sources || [])
    ].filter(Boolean);
    const phoneFields = [
      contact.phone,
      contact.office,
      contact.cell,
      contact.ascom,
      contact.fax,
      ...(contact.phones || [])
    ].filter(Boolean);
    const text = normalizeText(textFields.join(' '));
    const phoneDigits = digitsOnly(phoneFields.join(' '));
    const textMatch = term ? text.includes(term) : false;
    const digitMatch = digits ? phoneDigits.includes(digits) : false;
    return textMatch || digitMatch;
  };

  const filteredByQuery = useMemo(() => {
    const term = normalizeText(query);
    const digits = digitsOnly(query);
    return sections.map((section) => ({
      ...section,
      contacts: (section.contacts || []).filter((contact) => matchesQuery(contact, term, digits))
    }));
  }, [query, sections]);

  const matchingContacts = useMemo(
    () => filteredByQuery.flatMap((section) => section.contacts || []),
    [filteredByQuery]
  );

  const facilities = useMemo(() => {
    const names = new Set();
    matchingContacts.forEach((contact) => {
      const facilityName = contact.facility ? contact.facility.trim() : 'Other';
      if (facilityName) names.add(facilityName);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [matchingContacts]);

  useEffect(() => {
    if (activeFacility !== 'ALL' && !facilities.includes(activeFacility)) {
      setActiveFacility('ALL');
    }
  }, [activeFacility, facilities]);

  const visibleSections = useMemo(() => {
    if (activeFacility === 'ALL') {
      return filteredByQuery.filter((section) => (section.contacts || []).length);
    }
    const facilityKey = normalizeText(activeFacility);
    return filteredByQuery
      .map((section) => ({
        ...section,
        contacts: (section.contacts || []).filter((contact) => {
          const facilityName = contact.facility ? contact.facility.trim() : 'Other';
          return normalizeText(facilityName) === facilityKey;
        })
      }))
      .filter((section) => (section.contacts || []).length);
  }, [filteredByQuery, activeFacility]);

  return (
    <View>
      {(data.subtitle || data.hint) && (
        <View style={styles.introBlock}>
          {data.subtitle ? <Text style={styles.paragraph}>{data.subtitle}</Text> : null}
          {data.hint ? <Text style={styles.hint}>{data.hint}</Text> : null}
        </View>
      )}
      <View style={styles.search}>
        <TextInput
          placeholder={data.searchPlaceholder || 'Search contacts...'}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {facilities.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          <Chip label="All" active={activeFacility === 'ALL'} onPress={() => setActiveFacility('ALL')} />
          {facilities.map((facility) => (
            <Chip
              key={facility}
              label={facility}
              active={activeFacility === facility}
              onPress={() => setActiveFacility(facility)}
            />
          ))}
        </ScrollView>
      )}
      {visibleSections.map((section, sectionIndex) => {
        const sectionTitle = section.title || section.heading || `Section ${sectionIndex + 1}`;
        const contacts = section.contacts || [];
        const sectionSubtitle = section.subtitle || '';
        const groupMap = new Map();
        contacts.forEach((contact) => {
          const facilityName = contact.facility ? contact.facility.trim() : 'Other';
          if (!groupMap.has(facilityName)) groupMap.set(facilityName, []);
          groupMap.get(facilityName).push(contact);
        });
        const groupedFacilities = Array.from(groupMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const showFacilityHeadings = activeFacility === 'ALL' && groupedFacilities.length > 1;
        const showFacilityName = !showFacilityHeadings && activeFacility === 'ALL';

        return (
          <SectionCard key={`${sectionTitle}-${sectionIndex}`} style={styles.referenceCard}>
            <CardHeader title={sectionTitle} subtitle={sectionSubtitle} />
            {groupedFacilities.map(([facility, facilityContacts], facilityIndex) => (
              <View
                key={`${sectionTitle}-${facility}`}
                style={facilityIndex === 0 || !showFacilityHeadings ? null : styles.facilitySubsection}
              >
                {showFacilityHeadings ? (
                  <Text style={styles.facilitySubheading}>{facility}</Text>
                ) : null}
                {facilityContacts.map((contact, index) => {
                  const displayName = contact.name
                    ? contact.role
                      ? `${contact.name} (${contact.role})`
                      : contact.name
                    : (contact.role || contact.facility || 'Contact');
                  const phoneLines = [];
                  if (Array.isArray(contact.phones) && contact.phones.length > 0) {
                    contact.phones.forEach((phone) => phone && phoneLines.push(phone));
                  }
                  if (contact.phone) phoneLines.push(contact.phone);
                  if (contact.office) phoneLines.push(`Office: ${contact.office}`);
                  if (contact.cell) phoneLines.push(`Cell: ${contact.cell}`);
                  if (contact.ascom) phoneLines.push(`Ascom: ${contact.ascom}`);
                  const callNumber = pickNumber([
                    contact.phone,
                    contact.office,
                    contact.cell,
                    contact.ascom,
                    ...(contact.phones || [])
                  ]);
                  const smsNumber = pickNumber([
                    contact.cell,
                    ...(contact.phones || []),
                    contact.phone,
                    contact.office,
                    contact.ascom
                  ]);
                  const hasActions = Boolean(callNumber || smsNumber || contact.email);
                  const sourcesLine = Array.isArray(contact.sources) && contact.sources.length
                    ? `Sources: ${contact.sources.join(', ')}`
                    : '';

                  return (
                    <View key={`${facility}-${index}`} style={styles.contactRow}>
                      <View style={styles.contactText}>
                        <Text style={styles.directoryName}>{displayName}</Text>
                        {showFacilityName && contact.facility ? (
                          <Text style={styles.contactMeta}>{contact.facility}</Text>
                        ) : null}
                        {contact.email ? <Text style={styles.contactMeta}>{contact.email}</Text> : null}
                        {phoneLines.map((line, lineIndex) => (
                          <Text key={`${facility}-${index}-phone-${lineIndex}`} style={styles.contactPhone}>
                            {line}
                          </Text>
                        ))}
                        {contact.fax ? (
                          <Text style={styles.contactMeta}>{`Fax: ${contact.fax}`}</Text>
                        ) : null}
                        {sourcesLine ? <Text style={styles.contactMeta}>{sourcesLine}</Text> : null}
                      </View>
                      {hasActions ? (
                        <View style={styles.contactActions}>
                          {callNumber ? (
                            <Pressable
                              onPress={() => openExternal(`tel:${callNumber}`)}
                              style={styles.actionChip}
                              accessibilityLabel="Call"
                            >
                              <HealthIcon name="phone" size={16} color={colors.ink} />
                            </Pressable>
                          ) : null}
                          {smsNumber ? (
                            <Pressable
                              onPress={() => openExternal(`sms:${smsNumber}`)}
                              style={styles.actionChip}
                              accessibilityLabel="Text"
                            >
                              <HealthIcon name="chat" size={16} color={colors.ink} />
                            </Pressable>
                          ) : null}
                          {contact.email ? (
                            <Pressable
                              onPress={() => openExternal(`mailto:${contact.email}`)}
                              style={styles.actionChip}
                              accessibilityLabel="Email"
                            >
                              <HealthIcon name="support" size={16} color={colors.ink} />
                            </Pressable>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </SectionCard>
        );
      })}
      {!visibleSections.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No matching contacts found.</Text>
        </View>
      )}
    </View>
  );
};

const FrequentContactsScreen = ({ data }) => {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('last-name');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredAction, setHoveredAction] = useState(null);
  const enableHover = Platform.OS === 'web';
  const perfectServeIcon = require('./assets/perfectserve.png');

  const apiUrl = data.apiUrl || 'https://7ma49hqc9j.execute-api.us-east-2.amazonaws.com/test';
  const routineTemplate =
    data.routineSmsTemplate ||
    '{firstName}, its me Zahir from Radiology. Its {time} on {date}. I would like to discuss routine priority results with you regarding a patient you referred to us. Please give me a call at your convenience.';
  const urgentTemplate =
    data.urgentSmsTemplate ||
    '{firstName}, its me Zahir from Radiology. Its {time} on {date}. I would like to discuss urgent priority results with you regarding a patient you referred to us. Please give me a call at your earliest convenience.';

  const normalizeValue = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (Object.prototype.hasOwnProperty.call(value, 'S')) return value.S;
      if (Object.prototype.hasOwnProperty.call(value, 'N')) return value.N;
      if (Object.prototype.hasOwnProperty.call(value, 'BOOL')) return value.BOOL;
      if (Object.prototype.hasOwnProperty.call(value, 'NULL')) return '';
    }
    return value;
  };

  const normalizeResponse = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    if (Array.isArray(payload.Items)) return payload.Items;
    if (typeof payload.body === 'string') {
      try {
        return normalizeResponse(JSON.parse(payload.body));
      } catch {
        return [];
      }
    }
    return [];
  };

  const normalizeContact = (item = {}) => {
    const name = normalizeValue(item.name || item.Name || item.full_name || '');
    const practice = normalizeValue(item.practice || item.specialty || item.Practice || '');
    const phone = normalizeValue(item.phone || item.Phone || item.phone_number || '');
    const email = normalizeValue(item.email || item.Email || item.email_address || item.emailAddress || '');
    const perfectserve = normalizeValue(
      item.perfectserve ||
      item.perfectServe ||
      item.perfect_serve ||
      item.perfectserve_link ||
      item.perfectServeLink ||
      ''
    );
    return {
      name: String(name || '').trim(),
      practice: String(practice || '').trim(),
      phone: String(phone || '').trim(),
      email: String(email || '').trim(),
      perfectserve: String(perfectserve || '').trim()
    };
  };

  const formatPhone = (value = '') => {
    const digits = digitsOnly(value);
    if (!digits) return '';
    const normalized = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (normalized.length === 10) {
      return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
    }
    return value;
  };

  const extractFirstPhone = (value = '') => {
    const match = String(value).match(/\+?\d[\d().\s-]{6,}\d/);
    if (!match) return { digits: '', prefix: '' };
    const raw = match[0].trim();
    return {
      digits: digitsOnly(raw),
      prefix: raw.startsWith('+') ? '+' : ''
    };
  };

  const getLastName = (name = '') => {
    const parts = String(name).trim().split(/\s+/);
    return parts.length ? parts[parts.length - 1] : '';
  };

  const getFirstName = (name = '') => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return 'there';
    const parts = trimmed.split(/\s+/);
    return parts.length ? parts[0] : 'there';
  };

  const compareLastName = (a, b) => {
    const lastA = normalizeText(getLastName(a.name));
    const lastB = normalizeText(getLastName(b.name));
    if (lastA === lastB) {
      return normalizeText(a.name).localeCompare(normalizeText(b.name));
    }
    return lastA.localeCompare(lastB);
  };

  const compareSpecialty = (a, b) => {
    const practiceA = normalizeText(a.practice);
    const practiceB = normalizeText(b.practice);
    if (practiceA === practiceB) {
      return compareLastName(a, b);
    }
    return practiceA.localeCompare(practiceB);
  };

  const buildSmsMessage = (template, name) => {
    const now = new Date();
    const hours = now.getHours();
    const hour = hours % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const time = `${hour}:${minutes}${suffix}`;
    const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    const firstName = getFirstName(name);
    return template
      .replace('{time}', time)
      .replace('{date}', date)
      .replace('{firstName}', firstName);
  };

  const smsHref = (phone, message) => {
    const { digits, prefix } = extractFirstPhone(phone);
    if (!digits) return '';
    const separator = Platform.OS === 'ios' ? '&' : '?';
    return `sms:${prefix}${digits}${separator}body=${encodeURIComponent(message)}`;
  };

  useEffect(() => {
    let active = true;

    const loadContacts = async () => {
      if (!apiUrl) {
        if (!active) return;
        setError('Missing API endpoint.');
        setContacts([]);
        setLoading(false);
        return;
      }
      if (!/^https?:\/\//i.test(apiUrl)) {
        if (!active) return;
        setError('API endpoint must be an http or https URL.');
        setContacts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }
        const payload = await response.json();
        const items = normalizeResponse(payload)
          .map(normalizeContact)
          .filter((item) => item.name || item.practice || item.phone);
        if (!active) return;
        setContacts(items);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err && err.message ? err.message : 'Unable to load contacts.');
        setContacts([]);
        setLoading(false);
      }
    };

    loadContacts();

    return () => {
      active = false;
    };
  }, [apiUrl]);

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    const digits = digitsOnly(query);
    if (!term && !digits) return contacts;
    return contacts.filter((contact) => {
      const fields = [contact.name, contact.practice, contact.phone].map(normalizeText).join(' ');
      const phoneMatch = digits ? digitsOnly(contact.phone).includes(digits) : false;
      const textMatch = term ? fields.includes(term) : false;
      return textMatch || phoneMatch;
    });
  }, [contacts, query]);

  const sorted = useMemo(() => {
    const comparator = sortMode === 'specialty' ? compareSpecialty : compareLastName;
    return [...filtered].sort(comparator);
  }, [filtered, sortMode]);

  const statusMessage = loading
    ? 'Loading contacts...'
    : error
      ? 'Unable to load contacts.'
      : '';

  const ActionIcon = ({ id, label, onPress, disabled, children }) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={enableHover ? () => setHoveredAction(id) : undefined}
      onHoverOut={enableHover ? () => setHoveredAction(null) : undefined}
      style={[styles.actionChip, styles.actionIconChip, disabled && styles.actionChipDisabled]}
      accessibilityLabel={label}
    >
      {children}
      {enableHover && hoveredAction === id ? (
        <View style={styles.actionTooltip}>
          <Text style={styles.actionTooltipText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <View>
      {(data.subtitle || data.hint) && (
        <View style={styles.introBlock}>
          {data.subtitle ? <Text style={styles.paragraph}>{data.subtitle}</Text> : null}
          {data.hint ? <Text style={styles.hint}>{data.hint}</Text> : null}
        </View>
      )}
      <View style={styles.search}>
        <TextInput
          placeholder={data.searchPlaceholder || 'Search by name, practice, or phone'}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by</Text>
          <View style={styles.chipRow}>
            <Chip label="Last name" active={sortMode === 'last-name'} onPress={() => setSortMode('last-name')} />
            <Chip label="Specialty" active={sortMode === 'specialty'} onPress={() => setSortMode('specialty')} />
          </View>
        </View>
        {statusMessage ? <Text style={styles.hint}>{statusMessage}</Text> : null}
      </View>
      {loading && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading contacts...</Text>
        </View>
      )}
      {!loading && error && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{`Unable to load contacts. ${error}`}</Text>
        </View>
      )}
      {!loading && !error && sorted.map((contact, index) => {
        const rawName = contact.name || 'Unknown clinician';
        const practice = contact.practice || 'Practice not listed';
        const formattedPhone = formatPhone(contact.phone);
        const phoneDisplay = formattedPhone || contact.phone || 'Phone not listed';
        const primaryPhone = extractFirstPhone(contact.phone);
        const hasPhone = Boolean(primaryPhone.digits);
        const callHref = hasPhone ? `tel:${primaryPhone.prefix}${primaryPhone.digits}` : '';
        const emailEnabled = Boolean(contact.email);
        const perfectserveEnabled = Boolean(contact.perfectserve);
        const routineMessage = buildSmsMessage(routineTemplate, rawName);
        const urgentMessage = buildSmsMessage(urgentTemplate, rawName);
        const routineId = `${index}-routine`;
        const urgentId = `${index}-urgent`;
        const perfectserveId = `${index}-perfectserve`;
        const callId = `${index}-call`;
        const emailId = `${index}-email`;

        return (
          <SectionCard key={`${rawName}-${index}`} style={styles.referenceCard}>
            <CardHeader title={rawName} subtitle={practice} />
            <View style={styles.contactRow}>
              <View style={styles.contactText}>
                <Text style={styles.contactPhone}>{phoneDisplay}</Text>
                {contact.email ? <Text style={styles.contactMeta}>{contact.email}</Text> : null}
              </View>
              <View style={styles.contactActions}>
                <ActionIcon
                  id={callId}
                  label="Call"
                  onPress={() => openExternal(callHref)}
                  disabled={!hasPhone}
                >
                  <HealthIcon name="phone" size={16} color={colors.ink} />
                </ActionIcon>
                <ActionIcon
                  id={routineId}
                  label="Routine SMS"
                  onPress={() => openExternal(smsHref(contact.phone, routineMessage))}
                  disabled={!hasPhone}
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#f2b632" />
                </ActionIcon>
                <ActionIcon
                  id={urgentId}
                  label="Urgent SMS"
                  onPress={() => openExternal(smsHref(contact.phone, urgentMessage))}
                  disabled={!hasPhone}
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#e4574b" />
                </ActionIcon>
                <ActionIcon
                  id={emailId}
                  label="Email"
                  onPress={() => openExternal(`mailto:${contact.email}`)}
                  disabled={!emailEnabled}
                >
                  <Ionicons name="mail" size={16} color={colors.ink} />
                </ActionIcon>
                <ActionIcon
                  id={perfectserveId}
                  label="PerfectServe"
                  onPress={() => openExternal(contact.perfectserve)}
                  disabled={!perfectserveEnabled}
                >
                  <Image source={perfectServeIcon} style={styles.perfectServeIcon} resizeMode="contain" />
                </ActionIcon>
              </View>
            </View>
          </SectionCard>
        );
      })}
      {!loading && !error && !sorted.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No contacts found.</Text>
        </View>
      )}
    </View>
  );
};

const RotationScreen = ({ data }) => {
  const rotations = Object.entries((data.data || {})).map(([rotation, items]) => ({
    rotation,
    items: Array.isArray(items) ? items : []
  }));
  const [query, setQuery] = useState('');
  const [expandedRotations, setExpandedRotations] = useState(() => new Set());
  const isSearching = query.trim().length > 0;

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return rotations;
    return rotations
      .map((entry) => {
        const matchedItems = entry.items.filter((item) => normalizeText(item).includes(term));
        if (normalizeText(entry.rotation).includes(term) || matchedItems.length) {
          return { ...entry, items: matchedItems.length ? matchedItems : entry.items };
        }
        return null;
      })
      .filter(Boolean);
  }, [query, rotations]);

  const toggleRotation = (rotation) => {
    setExpandedRotations((prev) => {
      if (prev.has(rotation)) {
        return new Set();
      }
      return new Set([rotation]);
    });
  };

  return (
    <View>
      <View style={styles.search}>
        <TextInput
          placeholder="Search rotations or worklist names..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {filtered.map((entry) => {
        const isOpen = isSearching || expandedRotations.has(entry.rotation);
        return (
        <SectionCard key={entry.rotation} style={styles.referenceCard}>
          <Pressable
            style={styles.sectionHeader}
            onPress={() => {
              if (!isSearching) toggleRotation(entry.rotation);
            }}
          >
            <View style={styles.sectionTitleRow}>
              <HealthIcon name="folder" size={16} color={colors.panel} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{entry.rotation}</Text>
            </View>
            <View style={[styles.sectionToggle, isSearching ? styles.sectionToggleDisabled : null]}>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.ink}
              />
            </View>
          </Pressable>
          {isOpen &&
            entry.items.map((item, index) => (
              <View key={`${entry.rotation}-${index}`} style={styles.listRow}>
                <View style={styles.bullet} />
                <Text style={[styles.paragraph, styles.contentText]}>{item}</Text>
              </View>
            ))}
        </SectionCard>
      )})}
      {!filtered.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No matching rotations found.</Text>
        </View>
      )}
    </View>
  );
};

const InjuryScoringScreen = ({ data }) => {
  const [query, setQuery] = useState('');
  const tables = Array.isArray(data.tables) ? data.tables : [];

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return tables;
    return tables
      .map((table) => {
        const rows = (table.rows || []).filter((row) => {
          const text = [row.grade, row.type, row.description].filter(Boolean).join(' ');
          return normalizeText(text).includes(term) || normalizeText(table.table || '').includes(term);
        });
        return rows.length ? { ...table, rows } : null;
      })
      .filter(Boolean);
  }, [tables, query]);

  return (
    <View>
      <View style={styles.search}>
        <TextInput
          placeholder="Search grades or keywords..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {filtered.map((table) => (
        <SectionCard key={table.table} style={styles.referenceCard}>
          <CardHeader title={table.table} />
          {table.rows.map((row, index) => (
            <View key={`${table.table}-${index}`} style={styles.gradeRow}>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>{row.grade}</Text>
              </View>
              <View style={styles.gradeBody}>
                <Text style={styles.directoryName}>{row.type}</Text>
                <Text style={styles.paragraph}>{row.description}</Text>
              </View>
            </View>
          ))}
        </SectionCard>
      ))}
      {!filtered.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No matching injury tables found.</Text>
        </View>
      )}
    </View>
  );
};

const StructuredScreen = ({ dataId, title, onBack }) => {
  const fade = useFadeIn();
  const data = structuredData[dataId];
  const pageIcon = getPageIcon({
    type: 'structured',
    id: dataId,
    title: title || data?.title || 'Reference',
    data
  });

  return (
    <ScreenShell>
      <PageShell>
        <Animated.View style={{ opacity: fade }}>
          <BackHeader title={title || data?.title || 'Reference'} onBack={onBack} icon={pageIcon} />
          {!data && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No structured data found for this page.</Text>
            </View>
          )}
          {data && data.kind === 'contacts' && <ContactsScreen data={data} />}
          {data && data.kind === 'facilityContacts' && <FacilityContactsScreen data={data} />}
          {data && data.kind === 'frequentContacts' && <FrequentContactsScreen data={data} />}
          {data && data.kind === 'rotation' && <RotationScreen data={data} />}
          {data && data.kind === 'injuryTables' && <InjuryScoringScreen data={data} />}
          {data && !data.kind && <StructuredSections data={data} />}
          <BackFooter onBack={onBack} />
        </Animated.View>
      </PageShell>
    </ScreenShell>
  );
};

const DecisionTreeNode = ({ node, depth, path, expanded, onToggle }) => {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isExpanded = expanded.has(path);

  return (
    <View style={[styles.treeNode, { marginLeft: depth * 12 }]}>
      <Pressable onPress={() => hasChildren && onToggle(path)} style={styles.treeNodeHeader}>
        <Text style={styles.treeNodeText}>{node.text}</Text>
        {hasChildren ? <Text style={styles.treeToggle}>{isExpanded ? '-' : '+'}</Text> : null}
      </Pressable>
      {node.outcome ? <Text style={styles.treeOutcome}>{node.outcome}</Text> : null}
      {hasChildren && isExpanded && (
        <View style={styles.treeChildren}>
          {node.children.map((child, index) => (
            <DecisionTreeNode
              key={`${path}-${index}`}
              node={child}
              depth={depth + 1}
              path={`${path}-${index}`}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const DecisionTreeScreen = ({ treeId, title, onBack }) => {
  const fade = useFadeIn();
  const tree = decisionTrees[treeId];
  const [expanded, setExpanded] = useState(new Set(['root']));
  const pageIcon = getPageIcon({
    type: 'decisionTree',
    id: treeId,
    title: title || tree?.title || 'Decision Tree'
  });

  const toggle = (path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const imageSource = tree?.image ? resolveStructuredImage(tree.image) : null;

  return (
    <ScreenShell>
      <PageShell>
        <Animated.View style={{ opacity: fade }}>
          <BackHeader title={title || tree?.title || 'Decision Tree'} onBack={onBack} icon={pageIcon} />
          {!tree && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Decision tree not available.</Text>
            </View>
          )}
          {tree && (
            <View>
              <SectionCard style={styles.referenceCard}>
                <CardHeader title={tree.title} subtitle={tree.subtitle} />
                <DecisionTreeNode
                  node={tree.root}
                  depth={0}
                  path="root"
                  expanded={expanded}
                  onToggle={toggle}
                />
              </SectionCard>
              {Array.isArray(tree.legend) && tree.legend.length > 0 && (
                <SectionCard style={styles.referenceCard}>
                  <CardHeader title="Legend" />
                  {tree.legend.map((item, index) => (
                    <View key={`legend-${index}`} style={styles.listRow}>
                      <View style={styles.bullet} />
                      <Text style={[styles.paragraph, styles.contentText]}>{item}</Text>
                    </View>
                  ))}
                </SectionCard>
              )}
              {imageSource && (
                <SectionCard style={styles.referenceCard}>
                  <CardHeader title="Original Image" subtitle={tree.figureNote} />
                  <Image source={imageSource} style={styles.referenceImage} resizeMode="contain" />
                </SectionCard>
              )}
            </View>
          )}
          <BackFooter onBack={onBack} />
        </Animated.View>
      </PageShell>
    </ScreenShell>
  );
};

const TraumaScreen = ({ traumaId, title, onBack }) => {
  const fade = useFadeIn();
  const traumaMap = {
    'trauma-liver': 'Liver',
    'trauma-spleen': 'Spleen',
    'trauma-pancreas': 'Pancreas',
    'trauma-kidneys': 'Kidney'
  };
  const tableName = traumaMap[traumaId];
  const organIcon = traumaIconMap[traumaId];
  const traumaData = structuredData['injury-scoring'];
  const table = traumaData?.tables?.find((entry) => entry.table === tableName);
  const [query, setQuery] = useState('');

  const rows = table?.rows || [];
  const filtered = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return rows;
    return rows.filter((row) => {
      const text = [row.grade, row.type, row.description].filter(Boolean).join(' ');
      return normalizeText(text).includes(term);
    });
  }, [rows, query]);

  return (
    <ScreenShell>
      <PageShell>
        <Animated.View style={{ opacity: fade }}>
          <BackHeader title={title || tableName || 'Trauma'} onBack={onBack} icon={organIcon} />
          {!table && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Trauma data not available.</Text>
            </View>
          )}
          {table && (
            <View>
              <View style={styles.search}>
                <TextInput
                  placeholder="Search grade, type, or keyword..."
                  placeholderTextColor={colors.muted}
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                />
              </View>
              <SectionCard style={styles.referenceCard}>
                <CardHeader title={tableName} />
                {filtered.map((row, index) => (
                  <View key={`${tableName}-${index}`} style={styles.gradeRow}>
                    <View style={styles.gradeBadge}>
                      <Text style={styles.gradeBadgeText}>{row.grade}</Text>
                    </View>
                    <View style={styles.gradeBody}>
                      <Text style={styles.directoryName}>{row.type}</Text>
                      <Text style={styles.paragraph}>{row.description}</Text>
                    </View>
                  </View>
                ))}
              </SectionCard>
            </View>
          )}
          <BackFooter onBack={onBack} />
        </Animated.View>
      </PageShell>
    </ScreenShell>
  );
};

const AdrenalCtCalculator = () => {
  const [pre, setPre] = useState('');
  const [post, setPost] = useState('');
  const [delayed, setDelayed] = useState('');

  const huPre = parseNumber(pre);
  const huPost = parseNumber(post);
  const huDel = parseNumber(delayed);
  const canCalc = [huPre, huPost, huDel].every(Number.isFinite);
  const absWashout =
    canCalc && huPost !== huPre ? ((huPost - huDel) / (huPost - huPre)) * 100 : null;
  const relWashout = canCalc && huPost !== 0 ? ((huPost - huDel) / huPost) * 100 : null;

  const buildAbsText = (value) => {
    if (!Number.isFinite(value)) return [];
    const lines = [];
    if (value >= 60) lines.push('Absolute washout >=60% is consistent with an adenoma.');
    else lines.push('Absolute washout <60% is indeterminate.');
    if (Number.isFinite(huPre) && huPre > 43) {
      lines.push('Precontrast >43 HU is suspicious for malignancy regardless of washout.');
    } else if (Number.isFinite(huPre) && huPre < 10) {
      lines.push('Precontrast <10 HU suggests adenoma.');
    }
    if (Number.isFinite(huPost) && huPost >= 120 && Number.isFinite(huPre) && huPre < 70) {
      lines.push('Marked enhancement raises possibility of pheochromocytoma.');
    }
    return lines;
  };

  const buildRelText = (value) => {
    if (!Number.isFinite(value)) return [];
    const lines = [];
    if (value >= 40) lines.push('Relative washout >=40% is consistent with an adenoma.');
    else lines.push('Relative washout <40% is indeterminate.');
    if (Number.isFinite(huPre) && huPre > 43) {
      lines.push('Precontrast >43 HU is suspicious for malignancy regardless of washout.');
    } else if (Number.isFinite(huPre) && huPre < 10) {
      lines.push('Precontrast <10 HU suggests adenoma.');
    }
    if (Number.isFinite(huPost) && huPost >= 120 && Number.isFinite(huPre) && huPre < 70) {
      lines.push('Marked enhancement raises possibility of pheochromocytoma.');
    }
    return lines;
  };

  const absNotes = buildAbsText(absWashout);
  const relNotes = buildRelText(relWashout);

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs" subtitle="Enter CT attenuation values (HU)." />
        <Field label="Precontrast HU" value={pre} onChangeText={setPre} placeholder="e.g., 18" keyboardType="numeric" />
        <Field label="Postcontrast HU" value={post} onChangeText={setPost} placeholder="e.g., 120" keyboardType="numeric" />
        <Field label="Delayed HU" value={delayed} onChangeText={setDelayed} placeholder="e.g., 65" keyboardType="numeric" />
      </SectionCard>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Washout Results" subtitle="Calculated automatically." />
        <View style={styles.statRow}>
          <StatCard label="Absolute washout" value={formatPercent(absWashout, 1)} helper=">=60% adenoma" />
          <StatCard label="Relative washout" value={formatPercent(relWashout, 1)} helper=">=40% adenoma" />
        </View>
        <View style={styles.resultGroup}>
          <Text style={styles.resultLabel}>Absolute washout notes</Text>
          {absNotes.length ? <BulletList items={absNotes} /> : <Text style={styles.hint}>Enter values to see notes.</Text>}
        </View>
        <View style={styles.resultGroup}>
          <Text style={styles.resultLabel}>Relative washout notes</Text>
          {relNotes.length ? <BulletList items={relNotes} /> : <Text style={styles.hint}>Enter values to see notes.</Text>}
        </View>
      </SectionCard>
    </View>
  );
};

const AdrenalMriCalculator = () => {
  const [adrenalIp, setAdrenalIp] = useState('');
  const [spleenIp, setSpleenIp] = useState('');
  const [adrenalOp, setAdrenalOp] = useState('');
  const [spleenOp, setSpleenOp] = useState('');

  const aIP = parseNumber(adrenalIp);
  const sIP = parseNumber(spleenIp);
  const aOP = parseNumber(adrenalOp);
  const sOP = parseNumber(spleenOp);
  const inputsValid = [aIP, sIP, aOP, sOP].every(Number.isFinite) && sIP > 0 && sOP > 0 && aIP > 0;

  const ratio = inputsValid ? (aOP / sOP) / (aIP / sIP) : null;
  const index = inputsValid ? ((aIP - aOP) / aIP) * 100 : null;

  const csiNotes = inputsValid
    ? (ratio < 0.71
      ? ['CSI ratio <0.71 indicates a lipid-rich adenoma.']
      : ['CSI ratio >=0.71 is indeterminate. Consider CT washout.'])
    : ['Enter SI values for adrenal/spleen in-phase and out-of-phase (non-zero).'];

  const siNotes = inputsValid
    ? (index > 16.5
      ? ['SI index >16.5% indicates a lipid-rich adenoma.']
      : ['SI index <=16.5% is indeterminate. Consider CT washout.'])
    : [];

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs" subtitle="Signal intensity values from in/out-of-phase sequences." />
        <Field label="Adrenal SI (in-phase)" value={adrenalIp} onChangeText={setAdrenalIp} placeholder="e.g., 180" keyboardType="numeric" />
        <Field label="Spleen SI (in-phase)" value={spleenIp} onChangeText={setSpleenIp} placeholder="e.g., 220" keyboardType="numeric" />
        <Field label="Adrenal SI (out-of-phase)" value={adrenalOp} onChangeText={setAdrenalOp} placeholder="e.g., 110" keyboardType="numeric" />
        <Field label="Spleen SI (out-of-phase)" value={spleenOp} onChangeText={setSpleenOp} placeholder="e.g., 210" keyboardType="numeric" />
      </SectionCard>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="CSI Results" subtitle="Chemical shift imaging indices." />
        <View style={styles.statRow}>
          <StatCard label="CSI ratio" value={formatNumber(ratio, 2)} helper="Adenoma <0.71" />
          <StatCard label="SI index" value={formatPercent(index, 1)} helper="Adenoma >16.5%" />
        </View>
        <View style={styles.resultGroup}>
          <Text style={styles.resultLabel}>CSI ratio notes</Text>
          <BulletList items={csiNotes} />
        </View>
        {siNotes.length ? (
          <View style={styles.resultGroup}>
            <Text style={styles.resultLabel}>SI index notes</Text>
            <BulletList items={siNotes} />
          </View>
        ) : null}
      </SectionCard>
    </View>
  );
};

const HepaticFatCalculator = () => {
  const [ctLiver, setCtLiver] = useState('');
  const [ctSpleen, setCtSpleen] = useState('');
  const [mriIp, setMriIp] = useState('');
  const [mriOp, setMriOp] = useState('');
  const [hepIp, setHepIp] = useState('');
  const [hepOp, setHepOp] = useState('');
  const [splIp, setSplIp] = useState('');
  const [splOp, setSplOp] = useState('');
  const [mriFat, setMriFat] = useState('');
  const [mriWater, setMriWater] = useState('');
  const [roiList, setRoiList] = useState('');

  const ctLiverVal = parseNumber(ctLiver);
  const ctSpleenVal = parseNumber(ctSpleen);
  const ctValid = Number.isFinite(ctLiverVal) && Number.isFinite(ctSpleenVal);
  const ctDiff = ctValid ? ctLiverVal - ctSpleenVal : null;
  const ctRatio = ctValid ? ctLiverVal / ctSpleenVal : null;
  const ctApproxFat = ctValid ? clampValue(1.5 * (ctSpleenVal - ctLiverVal) + 5, 0, 100) : null;

  const ctInterpret = (diff, ratio, liverHu) => {
    const flags = [];
    if (diff < -20) flags.push('Moderate-severe steatosis likely.');
    else if (diff < -10) flags.push('Steatosis likely.');
    else if (diff < 0) flags.push('Borderline or mild drop.');
    if (ratio < 0.8) flags.push('L/S ratio < 0.8.');
    if (liverHu < 40) flags.push('Liver HU < 40.');
    return flags.length ? flags.join(' ') : 'No CT attenuation criteria for steatosis met.';
  };

  const ctSummary = ctValid ? ctInterpret(ctDiff, ctRatio, ctLiverVal) : 'Enter liver and spleen HU values.';

  const mriIpVal = parseNumber(mriIp);
  const mriOpVal = parseNumber(mriOp);
  const mriValid = Number.isFinite(mriIpVal) && Number.isFinite(mriOpVal) && mriIpVal > 0;
  const mriDrop = mriValid ? ((mriIpVal - mriOpVal) / mriIpVal) * 100 : null;
  const mriFatFraction = mriValid ? clampValue(50 * (1 - mriOpVal / mriIpVal), 0, 100) : null;
  const mriCategory =
    mriFatFraction >= 30 ? 'Severe' : mriFatFraction >= 15 ? 'Moderate' : mriFatFraction >= 5 ? 'Mild' : 'Normal (<5%)';

  const hepIpVal = parseNumber(hepIp);
  const hepOpVal = parseNumber(hepOp);
  const splIpVal = parseNumber(splIp);
  const splOpVal = parseNumber(splOp);
  const hepValid =
    [hepIpVal, hepOpVal, splIpVal, splOpVal].every(Number.isFinite) && splIpVal > 0;
  const ratioIp = hepValid ? hepIpVal / splIpVal : null;
  const ratioOp = hepValid ? hepOpVal / splOpVal : null;
  const hepFatFraction = hepValid ? clampValue(((ratioIp - ratioOp) / (2 * ratioIp)) * 100, 0, 100) : null;
  const hepFatPct = hepValid ? clampValue(((ratioIp - ratioOp) / ratioIp) * 100, 0, 100) : null;
  const hepCategory =
    hepFatFraction >= 30 ? 'Severe' : hepFatFraction >= 15 ? 'Moderate' : hepFatFraction >= 5 ? 'Mild' : 'Normal (<5%)';

  const mriFatVal = parseNumber(mriFat);
  const mriWaterVal = parseNumber(mriWater);
  const fatWaterValid =
    Number.isFinite(mriFatVal) && Number.isFinite(mriWaterVal) && mriFatVal >= 0 && mriWaterVal >= 0;
  const fatWaterDenom = fatWaterValid ? mriFatVal + mriWaterVal : null;
  const fatWaterFraction =
    fatWaterValid && fatWaterDenom > 0 ? clampValue((mriFatVal / fatWaterDenom) * 100, 0, 100) : null;
  const fatWaterCategory =
    fatWaterFraction >= 30 ? 'Severe' : fatWaterFraction >= 15 ? 'Moderate' : fatWaterFraction >= 5 ? 'Mild' : 'Normal (<5%)';

  const roiValues = roiList
    .replace(/[,\\n]+/g, ' ')
    .split(' ')
    .map((val) => parseNumber(val))
    .filter(Number.isFinite);
  const roiMean = roiValues.length ? roiValues.reduce((sum, val) => sum + val, 0) / roiValues.length : null;
  const roiMin = roiValues.length ? Math.min(...roiValues) : null;
  const roiMax = roiValues.length ? Math.max(...roiValues) : null;

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="CT Liver-Spleen Metrics (Noncontrast)" subtitle="Enter mean HU for liver and spleen ROIs." />
        <Field label="Liver HU" value={ctLiver} onChangeText={setCtLiver} placeholder="e.g., 42" keyboardType="numeric" />
        <Field label="Spleen HU" value={ctSpleen} onChangeText={setCtSpleen} placeholder="e.g., 55" keyboardType="numeric" />
        <ResultBox
          text={
            ctValid
              ? [
                  `Liver-Spleen difference: ${formatNumber(ctDiff, 1)} HU`,
                  `Liver/Spleen ratio: ${formatNumber(ctRatio, 2)}`,
                  `Approx fat fraction (CT, informational): ${formatNumber(ctApproxFat, 1)}%`,
                  `Notes: ${ctSummary}`
                ].join('\n')
              : ctSummary
          }
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="MRI In/Out-of-Phase (2-point Dixon)" subtitle="Approximate fat fraction from IP/OP signal." />
        <Field label="In-phase mean signal" value={mriIp} onChangeText={setMriIp} placeholder="e.g., 520" keyboardType="numeric" />
        <Field label="Opposed-phase mean signal" value={mriOp} onChangeText={setMriOp} placeholder="e.g., 360" keyboardType="numeric" />
        <ResultBox
          text={
            mriValid
              ? [
                  `Signal drop: ${formatPercent(mriDrop, 1)}`,
                  `Estimated fat fraction: ${formatNumber(mriFatFraction, 1)}% (${mriCategory})`,
                  'Note: 2-point Dixon approximation; prefer vendor PDFF when available.'
                ].join('\n')
              : 'Enter in-phase and opposed-phase signal values (IP must be > 0).'
          }
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="MRI Hepatic/Spleen Corrected" subtitle="Hepatic and spleen SI on IP/OP images." />
        <Field label="Hepatic SI (in-phase)" value={hepIp} onChangeText={setHepIp} placeholder="e.g., 520" keyboardType="numeric" />
        <Field label="Hepatic SI (opposed-phase)" value={hepOp} onChangeText={setHepOp} placeholder="e.g., 360" keyboardType="numeric" />
        <Field label="Spleen SI (in-phase)" value={splIp} onChangeText={setSplIp} placeholder="e.g., 300" keyboardType="numeric" />
        <Field label="Spleen SI (opposed-phase)" value={splOp} onChangeText={setSplOp} placeholder="e.g., 295" keyboardType="numeric" />
        <ResultBox
          text={
            hepValid
              ? [
                  `Fat fraction (ratio-corrected): ${formatNumber(hepFatFraction, 1)}% (${hepCategory})`,
                  `Fat percentage: ${formatNumber(hepFatPct, 1)}%`,
                  `Ratios: IP ${formatNumber(ratioIp, 2)}, OP ${formatNumber(ratioOp, 2)}`,
                  'Note: Replicates hepatic/spleen SI method; prefer vendor PDFF when available.'
                ].join('\n')
              : 'Enter hepatic and spleen signals for in-phase and opposed-phase images.'
          }
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="MRI Fat/Water Signal (PDFF Approximation)" subtitle="Use fat-only and water-only signal." />
        <Field label="Fat-only mean signal" value={mriFat} onChangeText={setMriFat} placeholder="e.g., 180" keyboardType="numeric" />
        <Field label="Water-only mean signal" value={mriWater} onChangeText={setMriWater} placeholder="e.g., 420" keyboardType="numeric" />
        <ResultBox
          text={
            fatWaterValid
              ? fatWaterDenom > 0
                ? [
                    `Estimated fat fraction: ${formatNumber(fatWaterFraction, 1)}% (${fatWaterCategory})`,
                    'Note: Based on fat/(fat+water) approximation; prefer vendor PDFF when available.'
                  ].join('\n')
                : 'Fat + water must be > 0.'
              : 'Enter fat-only and water-only signal values (non-negative).'
          }
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="ROI Averager" subtitle="Paste multiple HU values (comma or space separated)." />
        <Field
          label="ROI values"
          value={roiList}
          onChangeText={setRoiList}
          placeholder="42 44 45 43"
          keyboardType="numeric"
          multiline
        />
        <ResultBox
          text={
            roiValues.length
              ? [
                  `Mean: ${formatNumber(roiMean, 1)} HU`,
                  `Min: ${formatNumber(roiMin, 1)} HU`,
                  `Max: ${formatNumber(roiMax, 1)} HU`,
                  `Count: ${roiValues.length}`
                ].join('\n')
              : 'Add at least one numeric value.'
          }
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Interpretation Guide" />
        <BulletList
          items={[
            'CT liver-spleen difference (L-S): >=0 typically normal; < -10 suggests steatosis; < -20 often moderate-severe.',
            'CT liver/spleen ratio <0.8 suggests steatosis. Liver HU <40 on noncontrast CT is supportive.',
            'MRI 2-point Dixon estimate: fat fraction <5% normal; 5-15% mild; 15-30% moderate; >30% severe.',
            'Approximate CT fat fraction shown is a rough fit from liver-spleen delta; treat as informational only.'
          ]}
        />
      </SectionCard>
    </View>
  );
};

const GfrCalculator = () => {
  const [equation, setEquation] = useState('2021');
  const [sex, setSex] = useState('female');
  const [age, setAge] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [creatinineUnit, setCreatinineUnit] = useState('mgdl');
  const [race, setRace] = useState('nonblack');

  const ageVal = parseNumber(age);
  const scrVal = parseNumber(creatinine);
  const hasAge = Number.isFinite(ageVal) && ageVal > 0;
  const hasScr = Number.isFinite(scrVal) && scrVal > 0;
  const inputsValid = hasAge && hasScr;
  const scrMgDl = inputsValid ? (creatinineUnit === 'umol' ? scrVal / 88.4 : scrVal) : null;
  const isFemale = sex === 'female';

  const calcEgfr = () => {
    if (!inputsValid || !Number.isFinite(scrMgDl)) return null;
    const k = isFemale ? 0.7 : 0.9;
    const ratio = scrMgDl / k;
    const minRatio = Math.min(ratio, 1);
    const maxRatio = Math.max(ratio, 1);

    if (equation === '2009') {
      const alpha = isFemale ? -0.329 : -0.411;
      const sexFactor = isFemale ? 1.018 : 1;
      const raceFactor = race === 'black' ? 1.159 : 1;
      return 141 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.209) * Math.pow(0.993, ageVal) * sexFactor * raceFactor;
    }

    const alpha = isFemale ? -0.241 : -0.302;
    const sexFactor = isFemale ? 1.012 : 1;
    return 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.2) * Math.pow(0.9938, ageVal) * sexFactor;
  };

  const categorizeGfr = (value) => {
    if (!Number.isFinite(value)) return { code: '--', label: '--' };
    if (value >= 90) return { code: 'G1', label: 'Normal or high' };
    if (value >= 60) return { code: 'G2', label: 'Mildly decreased' };
    if (value >= 45) return { code: 'G3a', label: 'Mildly to moderately decreased' };
    if (value >= 30) return { code: 'G3b', label: 'Moderately to severely decreased' };
    if (value >= 15) return { code: 'G4', label: 'Severely decreased' };
    return { code: 'G5', label: 'Kidney failure' };
  };

  const egfr = calcEgfr();
  const egfrDisplay = Number.isFinite(egfr) ? `${formatNumber(Math.max(egfr, 0), 1)} mL/min/1.73 m^2` : '--';
  const category = categorizeGfr(egfr);

  const equationLabel =
    equation === '2009' ? 'CKD-EPI 2009 (race coefficient)' : 'CKD-EPI 2021 (race-free)';
  const unitLabel = creatinineUnit === 'umol' ? 'umol/L' : 'mg/dL';

  const summaryItems = inputsValid
    ? [
        `Equation: ${equationLabel}`,
        `Sex: ${isFemale ? 'Female' : 'Male'}`,
        `Age: ${ageVal} years`,
        `Creatinine: ${formatNumber(scrVal, 2)} ${unitLabel}${creatinineUnit === 'umol' ? ` (${formatNumber(scrMgDl, 2)} mg/dL)` : ''}`,
        equation === '2009'
          ? `Race coefficient: ${race === 'black' ? 'Black' : 'Not Black/Other'}`
          : 'Race coefficient: not used'
      ]
    : ['Enter age and serum creatinine to estimate eGFR.'];

  const notes = [
    'eGFR normalized to 1.73 m^2 body surface area.',
    ...(hasAge && ageVal < 18 ? ['Use a pediatric GFR equation for patients under 18 years.'] : []),
    'Confirm CKD staging with albuminuria and clinical context.',
    'Creatinine should be stable and IDMS standardized.'
  ];

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs" subtitle="Creatinine-only CKD-EPI equations." />
        <SelectField
          label="Equation"
          value={equation}
          onChange={setEquation}
          options={[
            { label: 'CKD-EPI 2021 (race-free)', value: '2021' },
            { label: 'CKD-EPI 2009 (race coefficient)', value: '2009' }
          ]}
        />
        <SelectField
          label="Sex"
          value={sex}
          onChange={setSex}
          options={[
            { label: 'Female', value: 'female' },
            { label: 'Male', value: 'male' }
          ]}
        />
        <Field label="Age (years)" value={age} onChangeText={setAge} placeholder="e.g., 54" keyboardType="numeric" />
        <Field
          label="Serum creatinine"
          value={creatinine}
          onChangeText={setCreatinine}
          placeholder="e.g., 1.02"
          keyboardType="numeric"
        />
        <SelectField
          label="Creatinine unit"
          value={creatinineUnit}
          onChange={setCreatinineUnit}
          options={[
            { label: 'mg/dL', value: 'mgdl' },
            { label: 'umol/L', value: 'umol' }
          ]}
        />
        {equation === '2009' ? (
          <>
            <SelectField
              label="Race (2009 equation only)"
              value={race}
              onChange={setRace}
              options={[
                { label: 'Not Black / Other', value: 'nonblack' },
                { label: 'Black or African American', value: 'black' }
              ]}
            />
            <Text style={styles.hint}>Race coefficient is used only for the 2009 equation.</Text>
          </>
        ) : null}
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Results" subtitle="eGFR normalized to 1.73 m^2 body surface area." />
        <View style={styles.statRow}>
          <StatCard label="Estimated GFR" value={egfrDisplay} />
          <StatCard label="GFR category" value={category.code} helper={category.label} />
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs summary" />
        <BulletList items={summaryItems} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Notes" />
        <BulletList items={notes} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="GFR categories (KDIGO)" />
        <BulletList
          items={[
            'G1: >= 90 (Normal or high)',
            'G2: 60-89 (Mildly decreased)',
            'G3a: 45-59 (Mildly to moderately decreased)',
            'G3b: 30-44 (Moderately to severely decreased)',
            'G4: 15-29 (Severely decreased)',
            'G5: < 15 (Kidney failure)'
          ]}
        />
        <Text style={styles.hint}>In the absence of kidney damage, G1 and G2 do not fulfill criteria for CKD.</Text>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Disclaimer" />
        <Text style={styles.paragraph}>This tool is for reference only and does not replace clinical judgment.</Text>
      </SectionCard>
    </View>
  );
};


const IodinatedContrastGuidelines = () => {
  const [sex, setSex] = useState('female');
  const [age, setAge] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [creatinineUnit, setCreatinineUnit] = useState('mgdl');
  const [aki, setAki] = useState('no');
  const [dialysis, setDialysis] = useState('none');
  const [urineOutput, setUrineOutput] = useState('no');
  const [metformin, setMetformin] = useState('no');
  const [arterialStudy, setArterialStudy] = useState('no');
  const [volumeRisk, setVolumeRisk] = useState('no');
  const [riskRecentAki, setRiskRecentAki] = useState(false);
  const [riskMultiple, setRiskMultiple] = useState(false);
  const [riskBorderline, setRiskBorderline] = useState(false);

  const ageVal = parseNumber(age);
  const scrVal = parseNumber(creatinine);
  const hasAge = Number.isFinite(ageVal) && ageVal > 0;
  const hasScr = Number.isFinite(scrVal) && scrVal > 0;
  const inputsValid = hasAge && hasScr;
  const scrMgDl = inputsValid ? (creatinineUnit === 'umol' ? scrVal / 88.4 : scrVal) : null;
  const isFemale = sex === 'female';

  const calcEgfr = () => {
    if (!inputsValid || !Number.isFinite(scrMgDl)) return null;
    const k = isFemale ? 0.7 : 0.9;
    const ratio = scrMgDl / k;
    const minRatio = Math.min(ratio, 1);
    const maxRatio = Math.max(ratio, 1);
    const alpha = isFemale ? -0.241 : -0.302;
    const sexFactor = isFemale ? 1.012 : 1;
    return 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.2) * Math.pow(0.9938, ageVal) * sexFactor;
  };

  const egfr = calcEgfr();
  const egfrDisplay = Number.isFinite(egfr) ? `${formatNumber(Math.max(egfr, 0), 1)} mL/min/1.73 m^2` : '--';
  const unitLabel = creatinineUnit === 'umol' ? 'umol/L' : 'mg/dL';
  const egfrNote = inputsValid
    ? `Creatinine: ${formatNumber(scrVal, 2)} ${unitLabel}${creatinineUnit === 'umol' ? ` (${formatNumber(scrMgDl, 2)} mg/dL)` : ''}`
    : 'Enter age, sex, and creatinine to calculate.';

  const highRiskCircumstances = riskRecentAki || riskMultiple || riskBorderline;
  const highRisk =
    aki === 'yes' ||
    (Number.isFinite(egfr) && egfr < 30) ||
    (dialysis !== 'none' && urineOutput === 'yes');

  let riskLabel = 'Unknown';
  let riskTag = '--';
  const riskDetails = [];

  if (aki === 'yes') {
    riskLabel = 'AKI (highest risk)';
    riskTag = 'AKI';
    riskDetails.push('AKI: proceed only if benefit outweighs risk; consider alternatives.');
  } else if (dialysis !== 'none' && urineOutput === 'yes') {
    riskLabel = 'High risk (dialysis with residual urine)';
    riskTag = 'High';
    riskDetails.push('Nonanuric dialysis patients should be treated like AKI or eGFR < 30.');
  } else if (dialysis !== 'none' && urineOutput === 'no') {
    riskLabel = 'Dialysis (anuric ESRD)';
    riskTag = 'ESRD';
    riskDetails.push('Anuric ESRD: no additional renal injury from iodinated contrast.');
  } else if (Number.isFinite(egfr)) {
    if (egfr < 30) {
      riskLabel = 'High risk (eGFR < 30)';
      riskTag = 'High';
      riskDetails.push('eGFR < 30: highest renal risk group.');
    } else if (egfr < 45) {
      riskLabel = 'Borderline (eGFR 30-44)';
      riskTag = 'Borderline';
      riskDetails.push('eGFR 30-44: consider prophylaxis if high-risk circumstances.');
    } else {
      riskLabel = 'Lower risk';
      riskTag = 'Lower';
      riskDetails.push('Stable eGFR >= 45: low risk for CI-AKI from IV iodinated contrast.');
    }
  } else {
    riskDetails.push('Provide eGFR inputs to determine risk level.');
  }

  const hydrationPlan = [];
  if (aki === 'yes' || (Number.isFinite(egfr) && egfr < 30) || (dialysis !== 'none' && urineOutput === 'yes')) {
    hydrationPlan.push('IV isotonic saline prophylaxis indicated if no contraindications to volume expansion.');
    hydrationPlan.push('Typical regimen: start 1 hour before, continue 3-12 hours after; 0.9% NS preferred.');
    hydrationPlan.push('Typical dose: 1-3 mL/kg/hr or fixed volume (e.g., 500 mL before/after).');
    if (volumeRisk === 'yes') {
      hydrationPlan.push('Volume overload risk present: coordinate with clinician to individualize hydration.');
    }
    hydrationPlan.push('Sodium bicarbonate not preferred; N-acetylcysteine and diuretics are not recommended for prophylaxis.');
  } else if (Number.isFinite(egfr) && egfr >= 30 && egfr < 45) {
    if (highRiskCircumstances) {
      hydrationPlan.push('Consider prophylaxis based on high-risk circumstances.');
      hydrationPlan.push('If used, isotonic saline (0.9% NS) regimen as above.');
    } else {
      hydrationPlan.push('Prophylaxis generally not indicated; maintain euvolemia.');
    }
  } else if (Number.isFinite(egfr) && egfr >= 45) {
    hydrationPlan.push('Prophylaxis not indicated for stable eGFR >= 45.');
  } else if (dialysis !== 'none' && urineOutput === 'no') {
    hydrationPlan.push('Anuric ESRD: prophylaxis generally not indicated for renal protection.');
  } else {
    hydrationPlan.push('Awaiting inputs to determine hydration plan.');
  }

  const metforminPlan = [];
  if (metformin === 'no') {
    metforminPlan.push('Not on metformin.');
  } else if (aki === 'yes' || (Number.isFinite(egfr) && egfr < 30) || arterialStudy === 'yes') {
    metforminPlan.push('Hold metformin at the time of or prior to contrast.');
    metforminPlan.push('Withhold for 48 hours after; restart only after renal function re-evaluated and normal.');
  } else if (Number.isFinite(egfr) && egfr >= 30) {
    metforminPlan.push('Continue metformin; no mandatory post-contrast creatinine check required.');
  } else {
    metforminPlan.push('Enter eGFR inputs to finalize metformin plan.');
  }

  const dialysisPlan = [];
  if (dialysis === 'none') {
    dialysisPlan.push('Not on dialysis.');
  } else if (urineOutput === 'no') {
    dialysisPlan.push('Anuric ESRD can receive iodinated contrast without additional renal injury.');
    dialysisPlan.push('Do not schedule extra dialysis or alter timing solely for contrast.');
  } else {
    dialysisPlan.push('Residual urine output: treat as high risk (AKI/eGFR < 30).');
  }

  const docs = [
    'Indication and clinical question (consider alternatives).',
    'eGFR and calculation method (CKD-EPI 2021).',
    'AKI/dialysis status and renal risk category.',
    'Hydration/prophylaxis decision with rationale.',
    'Metformin plan (hold vs continue) and timing.'
  ];
  if (highRisk) {
    docs.push('Risk-benefit discussion for high-risk cases.');
  }

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs" subtitle="CKD-EPI eGFR and clinical context." />
        <SelectField
          label="Sex"
          value={sex}
          onChange={setSex}
          options={[
            { label: 'Female', value: 'female' },
            { label: 'Male', value: 'male' }
          ]}
        />
        <Field label="Age (years)" value={age} onChangeText={setAge} placeholder="e.g., 58" keyboardType="numeric" />
        <Field
          label="Serum creatinine"
          value={creatinine}
          onChangeText={setCreatinine}
          placeholder="e.g., 1.1"
          keyboardType="numeric"
        />
        <SelectField
          label="Creatinine unit"
          value={creatinineUnit}
          onChange={setCreatinineUnit}
          options={[
            { label: 'mg/dL', value: 'mgdl' },
            { label: 'umol/L', value: 'umol' }
          ]}
        />
        <OptionGroup
          label="AKI or unstable renal function?"
          value={aki}
          onChange={setAki}
          options={[
            { label: 'No', value: 'no' },
            { label: 'Yes', value: 'yes' }
          ]}
        />
        <SelectField
          label="Dialysis status"
          value={dialysis}
          onChange={setDialysis}
          options={[
            { label: 'Not on dialysis', value: 'none' },
            { label: 'Hemodialysis', value: 'hemo' },
            { label: 'Peritoneal dialysis', value: 'peritoneal' }
          ]}
        />
        {dialysis !== 'none' ? (
          <OptionGroup
            label="Urine output > 100 mL/day?"
            value={urineOutput}
            onChange={setUrineOutput}
            options={[
              { label: 'No (anuric)', value: 'no' },
              { label: 'Yes (nonanuric)', value: 'yes' }
            ]}
          />
        ) : null}
        <OptionGroup
          label="On metformin?"
          value={metformin}
          onChange={setMetformin}
          options={[
            { label: 'No', value: 'no' },
            { label: 'Yes', value: 'yes' }
          ]}
        />
        <OptionGroup
          label="Arterial catheter study with possible renal emboli?"
          value={arterialStudy}
          onChange={setArterialStudy}
          options={[
            { label: 'No', value: 'no' },
            { label: 'Yes', value: 'yes' }
          ]}
        />
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>High-risk circumstances (eGFR 30-44)</Text>
          <View style={styles.chipRow}>
            <Chip label="Recent AKI" active={riskRecentAki} onPress={() => setRiskRecentAki((prev) => !prev)} />
            <Chip label="Multiple risks" active={riskMultiple} onPress={() => setRiskMultiple((prev) => !prev)} />
            <Chip label="Borderline trend" active={riskBorderline} onPress={() => setRiskBorderline((prev) => !prev)} />
          </View>
          <Text style={styles.hint}>Use clinician judgment to decide prophylaxis in this range.</Text>
        </View>
        <OptionGroup
          label="Risk of volume overload (HF, hypervolemia, cirrhosis)?"
          value={volumeRisk}
          onChange={setVolumeRisk}
          options={[
            { label: 'No', value: 'no' },
            { label: 'Yes', value: 'yes' }
          ]}
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Recommendations" subtitle="ACR-aligned iodinated contrast guidance." />
        <View style={styles.statRow}>
          <StatCard label="eGFR (CKD-EPI 2021)" value={egfrDisplay} helper={egfrNote} />
          <StatCard label="Risk level" value={riskTag} helper={riskLabel} />
        </View>
        <CardHeader title="Risk summary" />
        <BulletList items={riskDetails.length ? riskDetails : ['Provide inputs to determine risk level.']} />
        <CardHeader title="Hydration / prophylaxis" />
        <BulletList items={hydrationPlan} />
        <CardHeader title="Metformin plan" />
        <BulletList items={metforminPlan} />
        <CardHeader title="Dialysis plan" />
        <BulletList items={dialysisPlan} />
      </SectionCard>

        <SectionCard style={styles.referenceCard}>
          <CardHeader title="Documentation checklist" />
          <BulletList items={docs} />
          {hasAge && ageVal < 18 ? (
            <Text style={styles.hint}>Age under 18: use a pediatric GFR equation.</Text>
          ) : null}
        </SectionCard>
      </View>
    );
  };

const GadoliniumContrastGuidelines = () => {
  const [sex, setSex] = useState('female');
  const [age, setAge] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [creatinineUnit, setCreatinineUnit] = useState('mgdl');
  const [aki, setAki] = useState('no');
  const [dialysis, setDialysis] = useState('none');
  const [anuric, setAnuric] = useState('yes');
  const [pregnancy, setPregnancy] = useState('no');
  const [group, setGroup] = useState('group2');
  const [repeatDose, setRepeatDose] = useState('no');

  const ageVal = parseNumber(age);
  const scrVal = parseNumber(creatinine);
  const hasAge = Number.isFinite(ageVal) && ageVal > 0;
  const hasScr = Number.isFinite(scrVal) && scrVal > 0;
  const inputsValid = hasAge && hasScr;
  const scrMgDl = inputsValid ? (creatinineUnit === 'umol' ? scrVal / 88.4 : scrVal) : null;
  const isFemale = sex === 'female';

  const calcEgfr = () => {
    if (!inputsValid || !Number.isFinite(scrMgDl)) return null;
    const k = isFemale ? 0.7 : 0.9;
    const ratio = scrMgDl / k;
    const minRatio = Math.min(ratio, 1);
    const maxRatio = Math.max(ratio, 1);
    const alpha = isFemale ? -0.241 : -0.302;
    const sexFactor = isFemale ? 1.012 : 1;
    return 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.2) * Math.pow(0.9938, ageVal) * sexFactor;
  };

  const egfr = calcEgfr();
  const egfrDisplay = Number.isFinite(egfr) ? `${formatNumber(Math.max(egfr, 0), 1)} mL/min/1.73 m^2` : '--';
  const unitLabel = creatinineUnit === 'umol' ? 'umol/L' : 'mg/dL';
  const egfrNote = inputsValid
    ? `Creatinine: ${formatNumber(scrVal, 2)} ${unitLabel}${creatinineUnit === 'umol' ? ` (${formatNumber(scrMgDl, 2)} mg/dL)` : ''}`
    : 'Enter age, sex, and creatinine to calculate.';

  const ckdStage = (() => {
    if (!Number.isFinite(egfr)) return { stage: '--', label: '--' };
    if (egfr >= 90) return { stage: 'G1', label: 'Normal or high' };
    if (egfr >= 60) return { stage: 'G2', label: 'Mildly decreased' };
    if (egfr >= 45) return { stage: 'G3a', label: 'Mild to moderate' };
    if (egfr >= 30) return { stage: 'G3b', label: 'Moderate to severe' };
    if (egfr >= 15) return { stage: 'G4', label: 'Severely decreased' };
    return { stage: 'G5', label: 'Kidney failure' };
  })();

  const atRisk = aki === 'yes' || dialysis !== 'none' || (Number.isFinite(egfr) && egfr < 30);

  const riskDetails = [];
  if (aki === 'yes') {
    riskDetails.push('AKI: treat as highest NSF risk; use Group II only if essential.');
  }
  if (dialysis !== 'none') {
    riskDetails.push('Dialysis: considered at-risk for NSF.');
  }
  if (Number.isFinite(egfr) && egfr < 30) {
    riskDetails.push('eGFR < 30 (CKD G4-G5): at-risk for NSF.');
  }
  if (!riskDetails.length && Number.isFinite(egfr)) {
    riskDetails.push('eGFR >= 30 with stable renal function: no special NSF precautions required.');
  }

  const groupNotes = [];
  if (group === 'group1') {
    groupNotes.push('Group I agents have the highest NSF risk.');
    if (atRisk) {
      groupNotes.push('Contraindicated in AKI, eGFR < 30, or dialysis patients. Use Group II instead.');
    } else {
      groupNotes.push('Avoid when possible; use only if no alternatives and benefit outweighs risk.');
    }
  } else if (group === 'group2') {
    groupNotes.push('Group II agents have very low NSF risk.');
    if (atRisk) {
      groupNotes.push('Strongly preferred for at-risk patients; use the lowest necessary dose.');
      groupNotes.push('Informed consent is generally not required for Group II agents (local policy may vary).');
    } else {
      groupNotes.push('Appropriate for routine use; renal function assessment may be optional per policy.');
    }
  } else if (group === 'group2star') {
    groupNotes.push('Group II* (gadopiclenol) is provisional with limited post-marketing data.');
    groupNotes.push('May be treated like Group II or Group III per local policy.');
    if (atRisk) {
      groupNotes.push('Consider a traditional Group II agent for at-risk patients if available.');
    }
  } else {
    groupNotes.push('Group III currently has no listed agents; treat as higher caution if used.');
    if (atRisk) {
      groupNotes.push('If used in at-risk patients, document risk-benefit and obtain agreement.');
    }
  }

  const pregnancyNotes = [];
  if (pregnancy !== 'no') {
    pregnancyNotes.push('Avoid routine GBCA in pregnancy; use only if essential for diagnosis.');
    pregnancyNotes.push('Use Group II at the lowest dose when benefit outweighs risk.');
    pregnancyNotes.push('Document: benefit outweighs risk, benefit to mother/fetus, and no adequate alternative.');
    pregnancyNotes.push('Informed consent is recommended for pregnant or possibly pregnant patients.');
  } else {
    pregnancyNotes.push('Not pregnant: follow renal risk and GBCA group guidance.');
  }

  const dialysisNotes = [];
  if (dialysis === 'none') {
    dialysisNotes.push('Not on dialysis.');
  } else {
    dialysisNotes.push('Use Group II agents; Group I is contraindicated in dialysis patients.');
    dialysisNotes.push('Schedule MRI as close as possible before routine hemodialysis.');
    dialysisNotes.push('Do not initiate or alter dialysis schedule solely for GBCA removal.');
    if (dialysis === 'peritoneal') {
      dialysisNotes.push('Peritoneal dialysis may provide less NSF risk reduction than hemodialysis.');
    }
    if (anuric === 'yes') {
      dialysisNotes.push('Anuric ESRD: consider CT with iodinated contrast if diagnostic yield is similar.');
    }
  }

  const repeatNotes = [];
  if (repeatDose === 'yes') {
    if (atRisk) {
      repeatNotes.push('Repeat dosing in at-risk patients should use Group II agents and the lowest necessary dose.');
      repeatNotes.push('Avoid unnecessary short-interval repeat dosing; document clinical need.');
    } else {
      repeatNotes.push('No contraindication to multiple doses when clinically necessary in low-risk patients.');
    }
  } else {
    repeatNotes.push('No repeat dose planned.');
  }

  const docs = [
    'Indication and clinical question.',
    'eGFR and CKD stage (CKD-EPI 2021).',
    'AKI/dialysis status and NSF risk category.',
    'GBCA group selected and dose rationale.'
  ];
  if (atRisk && (group === 'group1' || group === 'group3')) {
    docs.push('Risk-benefit discussion with referring physician and patient; document agreement.');
  }
  if (pregnancy !== 'no') {
    docs.push('Document pregnancy risk-benefit items and obtain informed consent.');
  }
  if (repeatDose === 'yes') {
    docs.push('Document repeat dosing rationale and timing.');
  }

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs" subtitle="CKD-EPI eGFR, GBCA group, and clinical context." />
        <SelectField
          label="Sex"
          value={sex}
          onChange={setSex}
          options={[
            { label: 'Female', value: 'female' },
            { label: 'Male', value: 'male' }
          ]}
        />
        <Field label="Age (years)" value={age} onChangeText={setAge} placeholder="e.g., 58" keyboardType="numeric" />
        <Field
          label="Serum creatinine"
          value={creatinine}
          onChangeText={setCreatinine}
          placeholder="e.g., 1.1"
          keyboardType="numeric"
        />
        <SelectField
          label="Creatinine unit"
          value={creatinineUnit}
          onChange={setCreatinineUnit}
          options={[
            { label: 'mg/dL', value: 'mgdl' },
            { label: 'umol/L', value: 'umol' }
          ]}
        />
        <OptionGroup
          label="AKI or unstable renal function?"
          value={aki}
          onChange={setAki}
          options={[
            { label: 'No', value: 'no' },
            { label: 'Yes', value: 'yes' }
          ]}
        />
        <SelectField
          label="Dialysis status"
          value={dialysis}
          onChange={setDialysis}
          options={[
            { label: 'Not on dialysis', value: 'none' },
            { label: 'Hemodialysis', value: 'hemo' },
            { label: 'Peritoneal dialysis', value: 'peritoneal' }
          ]}
        />
        {dialysis !== 'none' ? (
          <OptionGroup
            label="Anuric (no residual renal function)?"
            value={anuric}
            onChange={setAnuric}
            options={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' }
            ]}
          />
        ) : null}
        <SelectField
          label="Pregnancy status"
          value={pregnancy}
          onChange={setPregnancy}
          options={[
            { label: 'Not pregnant', value: 'no' },
            { label: 'Pregnant', value: 'yes' },
            { label: 'Possibly pregnant / unsure', value: 'possible' }
          ]}
        />
        <SelectField
          label="Planned GBCA group"
          value={group}
          onChange={setGroup}
          options={[
            { label: 'Group II (preferred)', value: 'group2' },
            { label: 'Group II* (gadopiclenol provisional)', value: 'group2star' },
            { label: 'Group I (highest NSF risk)', value: 'group1' },
            { label: 'Group III (legacy)', value: 'group3' }
          ]}
        />
        <OptionGroup
          label="Repeat GBCA dose within 24-48 hours?"
          value={repeatDose}
          onChange={setRepeatDose}
          options={[
            { label: 'No', value: 'no' },
            { label: 'Yes', value: 'yes' }
          ]}
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Recommendations" subtitle="GBCA selection and risk mitigation." />
        <View style={styles.statRow}>
          <StatCard label="eGFR (CKD-EPI 2021)" value={egfrDisplay} helper={egfrNote} />
          <StatCard label="CKD stage" value={ckdStage.stage} helper={ckdStage.label} />
        </View>
        <CardHeader title="NSF risk" />
        <BulletList items={riskDetails} />
        <CardHeader title="GBCA group guidance" />
        <BulletList items={groupNotes} />
        <CardHeader title="Pregnancy guidance" />
        <BulletList items={pregnancyNotes} />
        <CardHeader title="Dialysis guidance" />
        <BulletList items={dialysisNotes} />
        <CardHeader title="Repeat dosing" />
        <BulletList items={repeatNotes} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Documentation checklist" />
        <BulletList items={docs} />
        {hasAge && ageVal < 18 ? (
          <Text style={styles.hint}>Age under 18: use a pediatric GFR equation.</Text>
        ) : null}
      </SectionCard>

        <SectionCard style={styles.referenceCard}>
          <CardHeader title="GBCA groups (generic + brand names)" subtitle="ACR NSF risk classification." />
          <Text style={styles.h3}>Group I (highest NSF risk)</Text>
          <BulletList
            items={[
              'Gadodiamide (Omniscan)',
              'Gadopentetate dimeglumine (Magnevist)',
              'Gadoversetamide (OptiMARK)'
            ]}
          />
          <Text style={styles.h3}>Group II (preferred)</Text>
          <BulletList
            items={[
              'Gadobenate dimeglumine (MultiHance)',
              'Gadobutrol (Gadavist / Gadovist)',
              'Gadoteric acid (Dotarem, Clariscan)',
              'Gadoteridol (ProHance)',
              'Gadoxetate disodium (Eovist, Primovist)',
              'Gadopiclenol (Elucirem, Vueway) - provisional Group II*'
            ]}
          />
          <Text style={styles.h3}>Group III</Text>
          <BulletList items={['No agents listed (as of April 2024).']} />
          <Text style={styles.hint}>
            Group II* (gadopiclenol) is provisional and may be treated like Group II or Group III per local policy.
          </Text>
        </SectionCard>

    </View>
  );
};

const MRI_SAFETY_USAGE = [
  'Search the FAQ for common real-world questions (\"Can I scan ... ?\").',
  'Confirm device category: MR Safe, MR Conditional, or MR Unsafe.',
  'Verify field strength, SAR, spatial gradient, and timing restrictions.',
  'If uncertainty remains, require implant card, operative note, or manufacturer documentation.',
  'When in doubt, escalate to the radiologist and/or MRI Safety Officer.'
];

const MRI_SAFETY_DEFINITIONS = [
  { term: 'MR Safe', definition: 'No known hazards in all MRI environments.' },
  { term: 'MR Conditional', definition: 'Safe only under specified conditions (field strength, SAR, gradient, timing, programming).' },
  { term: 'MR Unsafe', definition: 'Known hazards. MRI contraindicated.' }
];

const MRI_SAFETY_FAQ = [
  {
    question: 'The patient says they have a device but does not know what it is.',
    bullets: [
      'Do not scan based on patient recollection alone.',
      'Obtain implant card, operative note, or manufacturer model number.',
      'If unavailable, treat as MR Unsafe until verified.'
    ]
  },
  {
    question: 'They say it is MRI compatible - is that enough?',
    bullets: [
      'No. \"MRI compatible\" is non-technical language.',
      'Confirm field strength (1.0T / 1.5T / 3.0T).',
      'Confirm SAR limits and spatial gradient limits.',
      'Confirm any programming or monitoring requirements.'
    ]
  },
  {
    question: 'Can we scan a patient with a pacemaker or ICD?',
    bullets: [
      'Legacy pacemakers/ICDs are MR Unsafe.',
      'MR Conditional systems require institutional protocol, cardiology clearance, device interrogation pre/post, and continuous monitoring.'
    ]
  },
  {
    question: 'What about abandoned or retained pacer wires?',
    bullets: ['MR Unsafe due to RF heating and induced currents.']
  },
  {
    question: 'Can I scan aneurysm clips?',
    bullets: [
      'Only if manufacturer/model are known and documented safe at the intended field strength.',
      'Older clips (e.g., Drake, Sundt-Kees, McFadden) are MR Unsafe.',
      'Do not scan on 1.0T HFO unless explicit clearance exists.'
    ]
  },
  {
    question: 'Patient had surgery years ago - does time make it safe?',
    bullets: [
      'Time does not change magnetic properties.',
      'Time-based exceptions apply to endothelialization-dependent devices (e.g., stents, occluders).'
    ]
  },
  {
    question: 'Are tattoos or permanent eyeliner safe?',
    bullets: [
      'Generally safe.',
      'Warn patient about possible heating.',
      'Stop scan if discomfort occurs.'
    ]
  },
  {
    question: 'Pregnant patient - can we scan?',
    bullets: [
      'MRI is allowed at 1.0T, 1.5T, and 3.0T.',
      'Gadolinium only with radiologist approval.'
    ]
  },
  {
    question: 'What about drug patches or glucose monitors?',
    bullets: [
      'Remove all transdermal patches.',
      'Many CGMs and insulin pumps are MR Unsafe unless proven otherwise.'
    ]
  },
  {
    question: 'Patient has a stimulator - can we scan?',
    bullets: [
      'Most neurostimulators are MR Conditional.',
      'Require device model verification, MRI mode programming, and SAR/gradient compliance.'
    ]
  }
];

const MRI_SAFETY_DEVICES = [
  {
    name: 'Aneurysm clips',
    status: 'Unsafe',
    category: 'Neurologic / Neurovascular',
    notes:
      'Unsafe unless implant card states safe at 1.5T or 3.0T. Legacy unsafe clips include Drake, Heifetz, Housepian, Lapp, Mayfield, McFadden, Pivot, Sundt-Kees, Vari-Angle, Yasargil FD. Do not scan on HFO 1.0T unless explicit clearance.'
  },
  {
    name: 'Bladder stimulators',
    status: 'Unsafe',
    category: 'GU / Pelvic',
    notes: 'Do not scan unless explicit MR Conditional documentation exists.'
  },
  {
    name: 'Cardiac pacemakers / ICDs / retained pacer wires (legacy systems)',
    status: 'Unsafe',
    category: 'Cardiovascular',
    notes: 'Legacy systems are MR Unsafe.'
  },
  {
    name: 'Cochlear implants',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Unsafe unless MR Conditional device and conditions are verified.'
  },
  {
    name: 'Drug delivery patches',
    status: 'Unsafe',
    category: 'General / External',
    notes: 'Must be removed prior to scan.'
  },
  {
    name: 'Ilizarov / Taylor frames',
    status: 'Unsafe',
    category: 'Orthopedic',
    notes: 'Unsafe unless explicitly MR Conditional.'
  },
  {
    name: 'Intra-ocular ferrous foreign bodies',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Absolute contraindication unless cleared by imaging and documentation.'
  },
  {
    name: 'Infusion / insulin pumps',
    status: 'Unsafe',
    category: 'General / External',
    notes: 'Unsafe unless card states safe.'
  },
  {
    name: 'Gastric electrical stimulators',
    status: 'Unsafe',
    category: 'GI / Abdominal',
    notes: 'Unsafe unless card states safe.'
  },
  {
    name: 'External hearing aids',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Must be removed before scan.'
  },
  {
    name: 'Ossicular / otologic / stapes implants',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Unsafe unless card states safe.'
  },
  {
    name: 'Penile implants',
    status: 'Unsafe',
    category: 'GU / Pelvic',
    notes: 'Unsafe unless card states safe.'
  },
  {
    name: 'Phrenic or vagus nerve stimulators',
    status: 'Unsafe',
    category: 'Neurologic',
    notes: 'Unsafe unless card states safe.'
  },
  {
    name: 'PillCam endoscopy device',
    status: 'Unsafe',
    category: 'GI / Abdominal',
    notes: 'Must verify excretion; confirm with KUB.'
  },
  {
    name: 'Spinal cord stimulators',
    status: 'Unsafe',
    category: 'Neurologic',
    notes: 'Unsafe unless MR Conditional.'
  },
  {
    name: 'Neurostimulation / neuromodulation systems',
    status: 'Unsafe',
    category: 'Neurologic',
    notes: 'Unsafe unless card states safe.'
  },
  {
    name: 'Steel halo vests',
    status: 'Unsafe',
    category: 'Orthopedic',
    notes: 'MR compatible vests are safe; otherwise unsafe.'
  },
  {
    name: 'Tissue (breast) expanders',
    status: 'Unsafe',
    category: 'Surgical / Plastics',
    notes: 'Unsafe unless card states safe.'
  },
  {
    name: 'Zenith AAA endograft stent',
    status: 'Unsafe',
    category: 'Cardiovascular / Vascular',
    notes: 'Explicit exception - MR Unsafe.'
  },
  {
    name: 'Fatio eyelid spring / wire ocular implant',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Ophthalmic implant exception.'
  },
  {
    name: 'Martensitic stainless steel ocular implants',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Ophthalmic implant exception.'
  },
  {
    name: 'Troutman magnetic ocular implant',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Ophthalmic implant exception.'
  },
  {
    name: 'Unitech round wire eye spring',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Ophthalmic implant exception.'
  },
  {
    name: 'Wide-angle IMT lens implant',
    status: 'Unsafe',
    category: 'ENT / Ophthalmic',
    notes: 'Ophthalmic implant exception.'
  },
  {
    name: 'Cardiac pacemakers (MR Conditional systems)',
    status: 'Conditional',
    category: 'Cardiovascular',
    notes: 'Only MR Conditional systems under institutional protocol and device monitoring.'
  },
  {
    name: 'ICDs (MR Conditional systems)',
    status: 'Conditional',
    category: 'Cardiovascular',
    notes: 'Only MR Conditional systems under institutional protocol and device monitoring.'
  },
  {
    name: 'Cardiac, carotid, peripheral, biliary stents',
    status: 'Conditional',
    category: 'Cardiovascular / Vascular',
    notes: 'Wait 6-8 weeks after implantation.'
  },
  {
    name: 'PDA / ASD / VSD / PFO closure devices',
    status: 'Conditional',
    category: 'Cardiovascular / Vascular',
    notes: 'Wait 6-8 weeks after implantation.'
  },
  {
    name: 'Vena cava filters',
    status: 'Conditional',
    category: 'Cardiovascular / Vascular',
    notes: 'Wait 6-8 weeks after placement.'
  },
  {
    name: 'Programmable ventricular shunts',
    status: 'Conditional',
    category: 'Neurologic',
    notes: 'Reprogram post-MRI.'
  },
  {
    name: 'Vagus / phrenic nerve stimulators',
    status: 'Conditional',
    category: 'Neurologic',
    notes: 'Verify model and conditions.'
  },
  {
    name: 'Deep brain stimulators',
    status: 'Conditional',
    category: 'Neurologic',
    notes: 'Verify model and conditions; MRI mode required.'
  },
  {
    name: 'Bone fusion stimulators',
    status: 'Conditional',
    category: 'Orthopedic',
    notes: '1.5T only.'
  },
  {
    name: 'Ilizarov / Taylor frames',
    status: 'Conditional',
    category: 'Orthopedic',
    notes: 'Verify model and conditions.'
  },
  {
    name: 'Ossicular / stapes implants',
    status: 'Conditional',
    category: 'ENT / Ophthalmic',
    notes: 'Verify model.'
  },
  {
    name: 'Specific ocular implants',
    status: 'Conditional',
    category: 'ENT / Ophthalmic',
    notes: 'Verify model; see unsafe exclusions.'
  },
  {
    name: 'Penile implants (MR Conditional models)',
    status: 'Conditional',
    category: 'GU / Pelvic',
    notes: 'Verify model and conditions.'
  },
  {
    name: 'Palatal sleep apnea implants',
    status: 'Conditional',
    category: 'ENT / Ophthalmic',
    notes: '1.5T only. SAR <= 3.5 W/kg.'
  },
  {
    name: 'Implantable ECG monitors',
    status: 'Conditional',
    category: 'Cardiovascular',
    notes: '1.5T only. SAR <= 3.5 W/kg.'
  },
  {
    name: 'Cardiac stents',
    status: 'Safe',
    category: 'Cardiovascular / Vascular',
    notes:
      'Wait 6-8 weeks (earlier at radiologist discretion). 1.5T or 3.0T allowed unless card states otherwise. Avoid HFO 1.0T unless spatial gradient <= 2200 g/cm.'
  },
  {
    name: 'Carotid, peripheral, intracranial, biliary stents',
    status: 'Safe',
    category: 'Cardiovascular / Vascular',
    notes: 'Same conditions as cardiac stents.'
  },
  {
    name: 'Vena cava filters',
    status: 'Safe',
    category: 'Cardiovascular / Vascular',
    notes: 'Wait 6-8 weeks (earlier at discretion). 1.0T / 1.5T / 3.0T allowed unless card states otherwise.'
  },
  {
    name: 'Heart valves and annuloplasty rings',
    status: 'Safe',
    category: 'Cardiovascular',
    notes: 'Generally safe; verify device card when available.'
  },
  {
    name: 'PDA / ASD / VSD / TAVR / PFO closure devices',
    status: 'Safe',
    category: 'Cardiovascular',
    notes: 'Wait 6-8 weeks after implantation.'
  },
  {
    name: 'IUDs',
    status: 'Safe',
    category: 'Gynecologic / GU',
    notes: 'Generally safe.'
  },
  {
    name: 'IUS (Mirena)',
    status: 'Safe',
    category: 'Gynecologic / GU',
    notes: 'Generally safe.'
  },
  {
    name: 'Implanon (etonogestrel)',
    status: 'Safe',
    category: 'Gynecologic / GU',
    notes: 'Generally safe.'
  },
  {
    name: 'Pessaries',
    status: 'Safe',
    category: 'Gynecologic / GU',
    notes: 'Generally safe.'
  },
  {
    name: 'Radioactive prostate seed implants',
    status: 'Safe',
    category: 'Gynecologic / GU',
    notes: 'Generally safe.'
  },
  {
    name: 'Programmable ventricular shunts (post-MRI reprogram)',
    status: 'Safe',
    category: 'Neurologic',
    notes: 'Must be reprogrammed after MRI.'
  },
  {
    name: 'Implantable ECG monitoring systems',
    status: 'Safe',
    category: 'Neurologic',
    notes: '1.5T only. Max spatial gradient 250 g/cm. Max SAR 3.5 W/kg per 15-min sequence.'
  },
  {
    name: 'Dental implants and materials',
    status: 'Safe',
    category: 'ENT / Ophthalmic',
    notes: 'Generally safe.'
  },
  {
    name: 'Scleral buckles',
    status: 'Safe',
    category: 'ENT / Ophthalmic',
    notes: 'Generally safe.'
  },
  {
    name: 'Ocular and lens implants',
    status: 'Safe',
    category: 'ENT / Ophthalmic',
    notes: 'Safe except for listed MR Unsafe ophthalmic implant exceptions.'
  },
  {
    name: 'Glaucoma drainage implants (shunt tubes)',
    status: 'Safe',
    category: 'ENT / Ophthalmic',
    notes: 'Generally safe.'
  },
  {
    name: 'Orthopedic implants, spinal hardware, screws',
    status: 'Safe',
    category: 'Musculoskeletal / General',
    notes: 'Generally safe.'
  },
  {
    name: 'Craniectomy / craniotomy plates, screws, burr-hole covers',
    status: 'Safe',
    category: 'Musculoskeletal / General',
    notes: 'Generally safe.'
  },
  {
    name: 'Surgical clips, sutures, fasteners',
    status: 'Safe',
    category: 'Musculoskeletal / General',
    notes: 'Generally safe.'
  },
  {
    name: 'Bone fusion stimulators (1.5T only)',
    status: 'Safe',
    category: 'Musculoskeletal / General',
    notes: '1.5T only.'
  },
  {
    name: 'Foley catheters',
    status: 'Safe',
    category: 'Musculoskeletal / General',
    notes: 'Unsafe only if temperature sensor present.'
  },
  {
    name: 'Pregnant patients',
    status: 'Safe',
    category: 'Other Common Scenarios',
    notes: 'MRI allowed at 1.0T / 1.5T / 3.0T. Gadolinium only with radiologist approval.'
  },
  {
    name: 'Tattoos / permanent eyeliner',
    status: 'Safe',
    category: 'Other Common Scenarios',
    notes: 'Warn about possible heating. Stop scan if discomfort occurs.'
  },
  {
    name: 'Vascular access ports / lines',
    status: 'Safe',
    category: 'Other Common Scenarios',
    notes: 'Remove all guidewires prior to scan.'
  }
];

const MRI_SAFETY_ESCALATION = [
  'Always document device name, manufacturer, model, field strength, SAR limits, and spatial gradient limits.',
  'Document source of verification: implant card, op note, or manufacturer documentation.',
  'Escalate when device identity is uncertain or conflicting safety information exists.',
  'Escalate when imaging is planned on non-standard systems (e.g., HFO 1.0T).'
];

const MRI_SAFETY_SOURCES = [
  'Manufacturer MRI safety labeling',
  'FDA device databases',
  'Institutional MRI safety protocols',
  'MRIsafety.com (Shellock)'
];

const MRI_SAFETY_CATEGORY_OPTIONS = [
  { label: 'All categories', value: 'all' },
  ...Array.from(new Set(MRI_SAFETY_DEVICES.map((item) => item.category))).sort().map((category) => ({
    label: category,
    value: category
  }))
];

const MriSafetyCompatibilityList = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilters, setStatusFilters] = useState({
    Unsafe: true,
    Conditional: true,
    Safe: true
  });
  const [openFaq, setOpenFaq] = useState(null);

  const toggleStatus = (key) => {
    setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = MRI_SAFETY_DEVICES.filter((item) => {
    if (!statusFilters[item.status]) return false;
    if (category !== 'all' && item.category !== category) return false;
    const text = `${item.name} ${item.notes} ${item.category}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  });

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Search the compatibility list" subtitle="Find devices, categories, or notes quickly." />
        <Field
          label="Search devices or notes"
          value={query}
          onChangeText={setQuery}
          placeholder="Search clips, stents, stimulators, implants..."
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="How to use" subtitle="Rapid decision support for MRI clearance." />
        <BulletList items={MRI_SAFETY_USAGE} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Quick definitions" />
        <View style={styles.list}>
          {MRI_SAFETY_DEFINITIONS.map((item) => (
            <View key={item.term} style={styles.listRow}>
              <View style={styles.bullet} />
              <Text style={[styles.paragraph, styles.contentText]}>
                <Text style={styles.emphasis}>{item.term}:</Text> {item.definition}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Common MRI safety FAQ" subtitle="Tap a question to expand." />
        {MRI_SAFETY_FAQ.map((item, index) => {
          const isOpen = openFaq === index;
          return (
            <View key={item.question} style={styles.faqCard}>
              <Pressable style={styles.faqRow} onPress={() => setOpenFaq(isOpen ? null : index)}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.ink} />
              </Pressable>
              {isOpen ? <BulletList items={item.bullets} /> : null}
            </View>
          );
        })}
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Device compatibility list" subtitle="Filter by status or category." />
        <Text style={styles.fieldLabel}>Status filters</Text>
        <View style={styles.chipRow}>
          {['Unsafe', 'Conditional', 'Safe'].map((status) => (
            <Chip key={status} label={status} active={statusFilters[status]} onPress={() => toggleStatus(status)} />
          ))}
        </View>
        <SelectField label="Category" value={category} onChange={setCategory} options={MRI_SAFETY_CATEGORY_OPTIONS} />
        <Text style={styles.hint}>{filtered.length} of {MRI_SAFETY_DEVICES.length} devices shown.</Text>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Compatibility table" />
        <ScrollView horizontal style={styles.table}>
          <View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableHeader, styles.tableCellWide]}>Status</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.tableCellWide]}>Device / Scenario</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.tableCellWide]}>Category</Text>
              <Text style={[styles.tableCell, styles.tableHeader, styles.tableCellWide]}>Notes / Conditions</Text>
            </View>
            {filtered.map((item) => (
              <View key={`${item.status}-${item.name}`} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellWide]}>{item.status}</Text>
                <Text style={[styles.tableCell, styles.tableCellWide]}>{item.name}</Text>
                <Text style={[styles.tableCell, styles.tableCellWide]}>{item.category}</Text>
                <Text style={[styles.tableCell, styles.tableCellWide]}>{item.notes}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Escalation & documentation" />
        <BulletList items={MRI_SAFETY_ESCALATION} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Sources (internal use)" />
        <BulletList items={MRI_SAFETY_SOURCES} />
      </SectionCard>
    </View>
  );
};

const BosniakCalculator = () => {
  const [modality, setModality] = useState('ct');
  const [sizeCm, setSizeCm] = useState('');
  const [thinSepta, setThinSepta] = useState('none');
  const [thickening, setThickening] = useState('none');
  const [nodules, setNodules] = useState('none');
  const [irregular, setIrregular] = useState('no');
  const [hyperattenuating, setHyperattenuating] = useState('no');
  const [noEnhancement, setNoEnhancement] = useState('no');

  const size = parseNumber(sizeCm);
  const hyperYes = modality === 'ct' && hyperattenuating === 'yes';
  const hasEnhancement = noEnhancement !== 'yes';

  let bosniak = 'I';
  let rationale = ['Simple appearance without septa or enhancement.'];

  if (hyperYes && !hasEnhancement && Number.isFinite(size) && size <= 3) {
    bosniak = 'II';
    rationale = ['Homogeneous >=70 HU <=3 cm without enhancement.'];
  }

  if (nodules === 'large' || irregular === 'yes') {
    bosniak = 'IV';
    rationale = ['Enhancing nodule >3 mm, irregular wall/septa, or solid tissue.'];
  } else if (thickening === 'marked' || nodules === 'small') {
    bosniak = 'III';
    rationale = ['Smooth thickened wall/septa >=4 mm or <=3 mm enhancing nodule.'];
  } else if (thinSepta === 'many' || thickening === 'mild' || (hyperYes && Number.isFinite(size) && size > 3)) {
    bosniak = 'IIF';
    rationale = ['>=4 thin septa, minimal smooth thickening, or large non-enhancing hyperattenuating cyst.'];
  } else if (thinSepta === 'few' || hyperYes) {
    bosniak = 'II';
    rationale = ['1-3 thin septa or benign hyperattenuating cyst.'];
  }

  const followUp = {
    I: 'Benign; no follow-up.',
    II: 'Benign; no follow-up.',
    IIF: 'Imaging follow-up: 6-12 months, then yearly up to 5 years (adapt to institution).',
    III: 'Indeterminate; urology consult. Consider surgery/ablation vs surveillance.',
    IV: 'Likely malignant; urology consult. Surgery/ablation typically recommended.'
  }[bosniak];

  const modalityNote =
    modality === 'ct'
      ? 'CT: enhancement = >10 HU. Hyperattenuating shortcut applies.'
      : 'MRI: rely on enhancement on subtraction/T1 post. Hyperattenuating shortcut not used.';

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Lesion Inputs" subtitle="Rule-based Bosniak v2019 helper." />
        <SelectField
          label="Modality"
          value={modality}
          onChange={setModality}
          options={[
            { label: 'CT', value: 'ct' },
            { label: 'MRI', value: 'mri' }
          ]}
        />
        <Field label="Size (cm)" value={sizeCm} onChangeText={setSizeCm} placeholder="e.g., 2.5" keyboardType="numeric" />
        <SelectField
          label="Thin septa / calcifications"
          value={thinSepta}
          onChange={setThinSepta}
          options={[
            { label: 'None', value: 'none' },
            { label: '1-3 thin septa or fine calcification', value: 'few' },
            { label: '>=4 thin septa', value: 'many' }
          ]}
        />
        <SelectField
          label="Smooth wall/septa thickening"
          value={thickening}
          onChange={setThickening}
          options={[
            { label: 'None or <=2 mm', value: 'none' },
            { label: '~3 mm smooth enhancing thickening', value: 'mild' },
            { label: '>=4 mm smooth enhancing thickening', value: 'marked' }
          ]}
        />
        <SelectField
          label="Enhancing nodules / solid tissue"
          value={nodules}
          onChange={setNodules}
          options={[
            { label: 'None', value: 'none' },
            { label: '<=3 mm (smooth)', value: 'small' },
            { label: '>3 mm or solid component', value: 'large' }
          ]}
        />
        <SelectField
          label="Irregular wall/septa (jagged, convex)"
          value={irregular}
          onChange={setIrregular}
          options={[
            { label: 'No', value: 'no' },
            { label: 'Yes', value: 'yes' }
          ]}
        />
        {modality === 'ct' ? (
          <SelectField
            label="Hyperattenuating, homogeneous >=70 HU on NC CT (<=3 cm), no enhancement"
            value={hyperattenuating}
            onChange={setHyperattenuating}
            options={[
              { label: 'No / Not applicable', value: 'no' },
              { label: 'Yes', value: 'yes' }
            ]}
          />
        ) : null}
        <SelectField
          label="No measurable enhancement (<10 HU or visually none)"
          value={noEnhancement}
          onChange={setNoEnhancement}
          options={[
            { label: 'Enhancing or unknown', value: 'no' },
            { label: 'No measurable enhancement', value: 'yes' }
          ]}
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Bosniak Result" />
        <View style={styles.statRow}>
          <StatCard label="Bosniak class" value={`Bosniak ${bosniak}`} helper={followUp} />
        </View>
        <ResultBox
          text={[
            `Reasoning: ${rationale.join(' ')}`,
            Number.isFinite(size) ? `Entered size: ${formatNumber(size, 1)} cm` : 'Entered size: --',
            `Modality note: ${modalityNote}`
          ].join('\n')}
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Quick Reference (v2019)" />
        <BulletList
          items={[
            'Class I: simple cyst, no septa or enhancement.',
            'Class II: 1-3 thin septa or homogeneous hyperattenuating <=3 cm without enhancement.',
            'Class IIF: >=4 thin septa or minimal smooth thickening; follow-up imaging.',
            'Class III: smooth thickened wall/septa >=4 mm or small enhancing nodules.',
            'Class IV: enhancing nodules >3 mm or irregular enhancing tissue.'
          ]}
        />
      </SectionCard>
    </View>
  );
};

const CarotidStenosisCalculator = () => {
  const [narrow, setNarrow] = useState('');
  const [distal, setDistal] = useState('');
  const [label2, setLabel2] = useState('');
  const [narrow2, setNarrow2] = useState('');
  const [distal2, setDistal2] = useState('');

  const calc = (n, d) => {
    if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return null;
    return (1 - n / d) * 100;
  };
  const categorize = (pct) => {
    if (!Number.isFinite(pct)) return '';
    if (pct >= 100) return 'Occluded';
    if (pct >= 70) return 'Severe (70-99%)';
    if (pct >= 50) return 'Moderate (50-69%)';
    if (pct > 0) return 'Mild (<50%)';
    return 'No stenosis';
  };

  const primaryPct = calc(parseNumber(narrow), parseNumber(distal));
  const comparePct = calc(parseNumber(narrow2), parseNumber(distal2));
  const compareLabel = label2.trim() || 'Comparison';

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Primary Measurement" subtitle="NASCET % = (1 - N/D) x 100." />
        <Field label="Narrowest lumen (N, mm)" value={narrow} onChangeText={setNarrow} placeholder="e.g., 1.2" keyboardType="numeric" />
        <Field label="Distal reference (D, mm)" value={distal} onChangeText={setDistal} placeholder="e.g., 4.0" keyboardType="numeric" />
        <ResultBox
          text={
            primaryPct === null
              ? 'Enter valid narrowest and distal reference diameters.'
              : `NASCET stenosis: ${formatPercent(primaryPct, 1)} (${categorize(primaryPct)})`
          }
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Optional Comparison" subtitle="Compare right vs left or CTA vs MRA." />
        <Field label="Label" value={label2} onChangeText={setLabel2} placeholder="e.g., Left CTA" />
        <Field label="Narrowest lumen (mm)" value={narrow2} onChangeText={setNarrow2} placeholder="e.g., 1.0" keyboardType="numeric" />
        <Field label="Distal reference (mm)" value={distal2} onChangeText={setDistal2} placeholder="e.g., 4.2" keyboardType="numeric" />
        <ResultBox
          text={
            comparePct === null
              ? 'Enter comparison measurements to generate side-by-side values (optional).'
              : `${compareLabel}: ${formatPercent(comparePct, 1)} (${categorize(comparePct)})`
          }
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Interpretation Guide" />
        <BulletList
          items={[
            'NASCET formula: % stenosis = (1 - N/D) x 100, where D is distal ICA beyond the bulb.',
            'Severity bands: <50% mild, 50-69% moderate, 70-99% severe, 100% occluded.',
            'Avoid the bulb for reference; measure perpendicular to vessel centerline.'
          ]}
        />
      </SectionCard>
    </View>
  );
};

const PancreaticFluidCalculator = () => {
  const [weeks, setWeeks] = useState('');
  const [wall, setWall] = useState('no');
  const [necrosis, setNecrosis] = useState('no');
  const [infection, setInfection] = useState('no');

  const weeksVal = parseNumber(weeks);
  const hasWall = wall === 'yes';
  const hasNecrosis = necrosis === 'yes';
  const infected = infection === 'yes';

  let label = 'Enter weeks from onset.';
  if (Number.isFinite(weeksVal)) {
    if (!hasNecrosis && weeksVal < 4 && !hasWall) label = 'Acute peripancreatic fluid collection (APFC)';
    else if (!hasNecrosis && weeksVal >= 4 && hasWall) label = 'Pancreatic pseudocyst';
    else if (hasNecrosis && weeksVal < 4) label = 'Acute necrotic collection (ANC)';
    else if (hasNecrosis && weeksVal >= 4 && hasWall) label = 'Walled-off necrosis (WON)';
    else label = 'Indeterminate pattern; describe contents and wall, consider multiphasic CT/MR.';
  }

  const infectionNote = infected
    ? 'Infection suspected: consider antibiotics and drainage/step-up approach.'
    : 'No infection flags entered.';

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Classification Helper" subtitle="Atlanta 2012 terminology." />
        <Field label="Time from onset (weeks)" value={weeks} onChangeText={setWeeks} placeholder="e.g., 3.5" keyboardType="numeric" />
        <SelectField
          label="Encapsulated / well-defined wall"
          value={wall}
          onChange={setWall}
          options={[
            { label: 'No (ill-defined)', value: 'no' },
            { label: 'Yes (well-defined wall)', value: 'yes' }
          ]}
        />
        <SelectField
          label="Necrotic/debris component"
          value={necrosis}
          onChange={setNecrosis}
          options={[
            { label: 'Minimal/none (simple fluid)', value: 'no' },
            { label: 'Yes (necrotic debris)', value: 'yes' }
          ]}
        />
        <SelectField
          label="Gas / clinical infection suspected"
          value={infection}
          onChange={setInfection}
          options={[
            { label: 'No / unknown', value: 'no' },
            { label: 'Yes (gas, fever, leukocytosis)', value: 'yes' }
          ]}
        />
        <ResultBox
          text={
            Number.isFinite(weeksVal)
              ? [
                  `Classification: ${label}`,
                  `Timing: ${formatNumber(weeksVal, 1)} weeks`,
                  `Wall: ${hasWall ? 'Encapsulated' : 'Ill-defined'}`,
                  `Necrosis/debris: ${hasNecrosis ? 'Present' : 'Minimal/none'}`,
                  `Infection note: ${infectionNote}`
                ].join('\n')
              : label
          }
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Definitions" />
        <BulletList
          items={[
            'APFC: <4 weeks, no defined wall, homogeneous fluid, no solid debris.',
            'Pseudocyst: >=4 weeks, well-defined wall, homogeneous fluid, no solid debris.',
            'ANC: <4 weeks, ill-defined, contains necrotic material.',
            'WON: >=4 weeks, well-defined wall, heterogeneous with necrotic debris.'
          ]}
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Management Pointers" />
        <BulletList
          items={[
            'Sterile APFC/pseudocysts: supportive care; intervene if symptomatic or obstructing.',
            'Necrotic collections: delay intervention until >=4 weeks unless infected or unstable.',
            'Infection: consider antibiotics plus drainage; step-up necrosectomy if needed.'
          ]}
        />
      </SectionCard>
    </View>
  );
};

const TiradsCalculator = () => {
  const [composition, setComposition] = useState('');
  const [echogenicity, setEchogenicity] = useState('');
  const [shape, setShape] = useState('');
  const [margin, setMargin] = useState('');
  const [foci, setFoci] = useState([]);
  const [sizeCm, setSizeCm] = useState('');

  const featurePoints = {
    composition: {
      cystic: 0,
      spongiform: 0,
      mixed: 1,
      solid: 2
    },
    echogenicity: {
      anechoic: 0,
      hyper_or_iso: 1,
      hypo: 2,
      very_hypo: 3
    },
    shape: {
      wider: 0,
      taller: 3
    },
    margin: {
      smooth: 0,
      ill: 0,
      lobulated: 2,
      extrathyroidal: 3
    },
    foci: {
      none: 0,
      macro: 1,
      rim: 2,
      punctate: 3
    }
  };

  const categories = [
    { id: 'TR1', points: (p) => p === 0, risk: 'Benign', follow: null, fna: null },
    { id: 'TR2', points: (p) => p === 1 || p === 2, risk: 'Not suspicious', follow: null, fna: null },
    { id: 'TR3', points: (p) => p === 3, risk: 'Mildly suspicious', follow: 1.5, fna: 2.5 },
    { id: 'TR4', points: (p) => p >= 4 && p <= 6, risk: 'Moderately suspicious', follow: 1.0, fna: 1.5 },
    { id: 'TR5', points: (p) => p >= 7, risk: 'Highly suspicious', follow: 0.5, fna: 1.0 }
  ];

  const toggleFoci = (value) => {
    setFoci((prev) => {
      if (value === 'none') return ['none'];
      const next = prev.filter((item) => item !== 'none');
      if (next.includes(value)) return next.filter((item) => item !== value);
      return [...next, value];
    });
  };

  const compPts = featurePoints.composition[composition] || 0;
  const echoPts = featurePoints.echogenicity[echogenicity] || 0;
  const shapePts = featurePoints.shape[shape] || 0;
  const marginPts = featurePoints.margin[margin] || 0;
  const fociPts = foci.includes('none')
    ? 0
    : foci.reduce((sum, val) => sum + (featurePoints.foci[val] || 0), 0);
  const totalPoints = compPts + echoPts + shapePts + marginPts + fociPts;
  const category = categories.find((cat) => cat.points(totalPoints)) || categories[0];
  const sizeVal = parseNumber(sizeCm);

  const formatManagement = (cat, size) => {
    const items = [];
    if (!cat.follow && !cat.fna) {
      items.push('No follow-up or FNA recommended.');
      return items;
    }
    if (cat.follow) {
      if (Number.isFinite(size) && size >= cat.follow) {
        items.push(`Follow-up ultrasound recommended (>=${cat.follow} cm).`);
      } else if (Number.isFinite(size)) {
        items.push(`Below follow-up threshold (${size.toFixed(1)} cm < ${cat.follow} cm).`);
      } else {
        items.push(`Follow-up: >=${cat.follow} cm (US at 1, 2, 3 years).`);
      }
    }
    if (cat.fna) {
      if (Number.isFinite(size) && size >= cat.fna) {
        items.push(`FNA recommended (>=${cat.fna} cm).`);
      } else if (Number.isFinite(size)) {
        items.push(`Below FNA threshold (${size.toFixed(1)} cm < ${cat.fna} cm).`);
      } else {
        items.push(`FNA threshold: >=${cat.fna} cm.`);
      }
    }
    return items;
  };

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="TI-RADS Feature Scoring" subtitle="Select one option per feature category." />
        <OptionGroup
          label="Composition"
          value={composition}
          onChange={setComposition}
          options={[
            { label: 'Cystic', value: 'cystic' },
            { label: 'Spongiform', value: 'spongiform' },
            { label: 'Mixed', value: 'mixed' },
            { label: 'Solid', value: 'solid' }
          ]}
        />
        <OptionGroup
          label="Echogenicity"
          value={echogenicity}
          onChange={setEchogenicity}
          options={[
            { label: 'Anechoic', value: 'anechoic' },
            { label: 'Hyper/iso', value: 'hyper_or_iso' },
            { label: 'Hypoechoic', value: 'hypo' },
            { label: 'Very hypoechoic', value: 'very_hypo' }
          ]}
        />
        <OptionGroup
          label="Shape"
          value={shape}
          onChange={setShape}
          options={[
            { label: 'Wider-than-tall', value: 'wider' },
            { label: 'Taller-than-wide', value: 'taller' }
          ]}
        />
        <OptionGroup
          label="Margin"
          value={margin}
          onChange={setMargin}
          options={[
            { label: 'Smooth', value: 'smooth' },
            { label: 'Ill-defined', value: 'ill' },
            { label: 'Lobulated/irregular', value: 'lobulated' },
            { label: 'Extrathyroidal extension', value: 'extrathyroidal' }
          ]}
        />
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Echogenic foci (additive)</Text>
          <View style={styles.chipRow}>
            {[
              { label: 'None', value: 'none' },
              { label: 'Macro', value: 'macro' },
              { label: 'Rim', value: 'rim' },
              { label: 'Punctate', value: 'punctate' }
            ].map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={foci.includes(option.value)}
                onPress={() => toggleFoci(option.value)}
              />
            ))}
          </View>
        </View>
        <Field
          label="Max size (cm)"
          value={sizeCm}
          onChangeText={setSizeCm}
          placeholder="e.g., 1.8"
          keyboardType="numeric"
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Results" />
        <View style={styles.statRow}>
          <StatCard label="Points" value={`${totalPoints}`} helper="Sum of features" />
          <StatCard label="Category" value={category.id} helper={category.risk} />
          <StatCard label="Risk level" value={category.risk} />
        </View>
        <View style={styles.resultGroup}>
          <Text style={styles.resultLabel}>Management</Text>
          <BulletList items={formatManagement(category, sizeVal)} />
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Notes" />
        <BulletList
          items={[
            'Sum points across all feature categories to assign TI-RADS.',
            'Echogenic foci points are additive when multiple types are present.',
            'Follow-up and FNA thresholds are size-based; tailor to clinical context and prior stability.',
            'Use maximal diameter from dedicated thyroid ultrasound; manage each nodule separately.'
          ]}
        />
      </SectionCard>
    </View>
  );
};

const LiverLengthCalculator = () => {
  const [ageValue, setAgeValue] = useState('');
  const [ageUnit, setAgeUnit] = useState('years');
  const [heightValue, setHeightValue] = useState('');
  const [lengthValue, setLengthValue] = useState('');
  const [showTable, setShowTable] = useState(false);

  const formatCm = (mm, digits = 1) => `${(mm / 10).toFixed(digits)} cm`;
  const formatRange = (lower, upper, digits = 1) => `${formatCm(lower, digits)} - ${formatCm(upper, digits)}`;
  const formatHeightRange = (band) =>
    band && Number.isFinite(band.minHeightCm) && Number.isFinite(band.maxHeightCm)
      ? `${band.minHeightCm} - ${band.maxHeightCm} cm`
      : '--';

  const findAgeBand = (months) => {
    if (!Number.isFinite(months)) return { band: null, extrapolated: false };
    const exact = liverLengthBands.find((b) => months >= b.minMonths && months <= b.maxMonths);
    if (exact) return { band: exact, extrapolated: false };
    let best = null;
    let delta = Infinity;
    liverLengthBands.forEach((b) => {
      const mid = (b.minMonths + b.maxMonths) / 2;
      const diff = Math.abs(months - mid);
      if (diff < delta) {
        delta = diff;
        best = b;
      }
    });
    return { band: best, extrapolated: true };
  };

  const findHeightBand = (heightCm) => {
    if (!Number.isFinite(heightCm)) return { band: null, extrapolated: false };
    const exact = liverLengthBands.find((b) => heightCm >= b.minHeightCm && heightCm <= b.maxHeightCm);
    if (exact) return { band: exact, extrapolated: false };
    let best = null;
    let delta = Infinity;
    liverLengthBands.forEach((b) => {
      let diff = 0;
      if (heightCm < b.minHeightCm) diff = b.minHeightCm - heightCm;
      else if (heightCm > b.maxHeightCm) diff = heightCm - b.maxHeightCm;
      if (diff < delta) {
        delta = diff;
        best = b;
      }
    });
    return { band: best, extrapolated: true };
  };

  const classifyLength = (lengthMm, band) => {
    if (!band || !Number.isFinite(lengthMm)) {
      return { label: '--', detail: 'Add a measured length', badge: 'Add a measurement' };
    }
    let label = 'Within expected';
    let detail = '5th-95th percentile';
    if (lengthMm < band.lowerMm) {
      label = 'Abnormally small';
      detail = 'Below lower limit';
    } else if (lengthMm < band.p5Mm) {
      label = 'Small';
      detail = 'Below 5th percentile';
    } else if (lengthMm > band.p95Mm && lengthMm <= band.upperMm) {
      label = 'Large';
      detail = 'Above 95th percentile';
    } else if (lengthMm > band.upperMm) {
      label = 'Abnormally large';
      detail = 'Above upper bound';
    }
    return { label, detail, badge: label };
  };

  const months = ageToMonths(ageValue, ageUnit);
  const heightCm = parseNumber(heightValue);
  const lengthCm = parseNumber(lengthValue);
  const lengthMm = Number.isFinite(lengthCm) ? lengthCm * 10 : null;
  const ageResult = findAgeBand(months);
  const heightResult = Number.isFinite(heightCm) ? findHeightBand(heightCm) : null;
  const band = heightResult ? heightResult.band : ageResult.band;
  const methodText = heightResult ? 'Height-based' : 'Age-based';
  const extrapolatedAge = ageResult.extrapolated;
  const extrapolatedHeight = heightResult ? heightResult.extrapolated : false;
  const classification = classifyLength(lengthMm, band);
  const bandLabel = band ? `${band.ageText} (height ${formatHeightRange(band)})` : '--';

  const notes = (() => {
    if (!Number.isFinite(months)) {
      return [
        'Add age to view the reference band (1-200 months available).',
        'Add height to refine the bracket; enter liver length to classify.'
      ];
    }
    if (!band) {
      return ['Age is outside the available reference range (1-200 months); nearest band shown.'];
    }
    const list = [
      `Reference: mean ${formatCm(band.meanMm)} (SD ${formatCm(band.sdMm, 2)}), 5th-95th ${formatRange(band.p5Mm, band.p95Mm)}.`,
      `Full reference span: ${formatRange(band.lowerMm, band.upperMm)} (height ${formatHeightRange(band)}).`
    ];
    if (Number.isFinite(lengthCm)) {
      list.push(`Measurement: ${lengthCm.toFixed(1)} cm - ${classification.detail}.`);
    } else {
      list.push('Add a measured length to classify against this band.');
    }
    if (extrapolatedAge) list.push('Age was outside 1-200 months; nearest age bracket shown.');
    if (extrapolatedHeight) list.push('Height was outside the reference height ranges; nearest height bracket used.');
    list.push('Source: Radiology World pediatric liver size calculator (Konus et al., AJR 1998).');
    return list;
  })();

  const tableRows = useMemo(
    () =>
      liverLengthBands.map((b) => [
        b.ageText,
        formatHeightRange(b),
        `${formatCm(b.meanMm)} (${formatCm(b.sdMm, 2)})`,
        formatRange(b.p5Mm, b.p95Mm),
        formatRange(b.lowerMm, b.upperMm)
      ]),
    []
  );

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs" subtitle="Use age and height to select the best reference band." />
        <Field label="Age value" value={ageValue} onChangeText={setAgeValue} placeholder="e.g., 6" keyboardType="numeric" />
        <SelectField
          label="Age unit"
          value={ageUnit}
          onChange={setAgeUnit}
          options={[
            { label: 'Years', value: 'years' },
            { label: 'Months', value: 'months' },
            { label: 'Weeks', value: 'weeks' }
          ]}
        />
        <Field label="Height (cm)" value={heightValue} onChangeText={setHeightValue} placeholder="e.g., 110" keyboardType="numeric" />
        <Field label="Measured liver length (cm)" value={lengthValue} onChangeText={setLengthValue} placeholder="e.g., 10.2" keyboardType="numeric" />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Reference Band" subtitle={band ? `${methodText} bracket` : 'Awaiting age input'} />
        <View style={styles.statRow}>
          <StatCard label="Band" value={bandLabel} helper={band ? (extrapolatedAge || extrapolatedHeight ? 'Nearest match' : methodText) : ''} />
          <StatCard label="Mean" value={band ? formatCm(band.meanMm) : '--'} helper={band ? `SD ${formatCm(band.sdMm, 2)}` : ''} />
          <StatCard label="5th-95th" value={band ? formatRange(band.p5Mm, band.p95Mm) : '--'} />
          <StatCard label="Full ref" value={band ? formatRange(band.lowerMm, band.upperMm) : '--'} />
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Measured Length" />
        <View style={styles.statRow}>
          <StatCard label="Length" value={Number.isFinite(lengthCm) ? `${lengthCm.toFixed(1)} cm` : '--'} />
          <StatCard label="Interpretation" value={classification.label} helper={classification.detail} />
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Notes" />
        <BulletList items={notes} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader
          title="Reference Bands"
          right={<ActionButton title={showTable ? 'Hide table' : 'Show table'} onPress={() => setShowTable(!showTable)} variant="ghost" />}
        />
        {showTable ? (
          <ScrollView horizontal style={styles.table}>
            <View>
              <View style={styles.tableRow}>
                {['Age band', 'Height range', 'Mean (SD)', '5th-95th', 'Full ref'].map((col) => (
                  <Text key={col} style={[styles.tableCell, styles.tableHeader]}>{col}</Text>
                ))}
              </View>
              {tableRows.map((row, rowIndex) => (
                <View key={`liver-row-${rowIndex}`} style={styles.tableRow}>
                  {row.map((cell, cellIndex) => (
                    <Text key={`liver-cell-${rowIndex}-${cellIndex}`} style={styles.tableCell}>
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.hint}>Tap "Show table" to view all reference bands.</Text>
        )}
      </SectionCard>
    </View>
  );
};

const RenalLengthCalculator = () => {
  const [ageValue, setAgeValue] = useState('');
  const [ageUnit, setAgeUnit] = useState('years');
  const [lengthValue, setLengthValue] = useState('');
  const [side, setSide] = useState('');
  const [showTable, setShowTable] = useState(false);

  const months = ageToMonths(ageValue, ageUnit);
  const band = Number.isFinite(months)
    ? renalLengthBands.find((b) => months >= b.minMonths && months < b.maxMonths) || null
    : null;
  const lengthCm = parseNumber(lengthValue);
  const zScore = band && Number.isFinite(lengthCm) ? (lengthCm - band.mean) / band.sd : null;
  const lower = band ? band.mean - 2 * band.sd : null;
  const upper = band ? band.mean + 2 * band.sd : null;

  const interpretation = (() => {
    if (!band) return 'Add age to view reference values.';
    if (!Number.isFinite(zScore)) return 'Add a measurement to get a z-score.';
    if (zScore < -2) return `Below expected (< -2 SD)${side ? ` (${side})` : ''}.`;
    if (zScore < -1) return `Slightly below expected${side ? ` (${side})` : ''}.`;
    if (zScore > 2) return `Above expected (> +2 SD)${side ? ` (${side})` : ''}.`;
    if (zScore > 1) return `Slightly above expected${side ? ` (${side})` : ''}.`;
    return `Within expected range${side ? ` (${side})` : ''}.`;
  })();

  const notes = (() => {
    if (!Number.isFinite(months)) {
      return [
        'Add age to view the reference band.',
        'Add a measured length to calculate a z-score.'
      ];
    }
    if (!band) {
      return ['Age is outside the available reference range (0-19 years).'];
    }
    const list = [
      `Reference mean ${band.mean.toFixed(1)} cm (SD ${band.sd.toFixed(1)}), n=${band.count}.`,
      `Expected range (95% approx): ${lower.toFixed(1)} - ${upper.toFixed(1)} cm.`
    ];
    if (!Number.isFinite(lengthCm)) {
      list.push('Add a measured length to view the z-score and interpretation.');
    } else if (!Number.isFinite(zScore)) {
      list.push('Z-score not available; check SD for this band.');
    } else if (zScore < -2) {
      list.push('Below expected; consider measurement factors and clinical correlation.');
    } else if (zScore > 2) {
      list.push('Above expected; consider hydronephrosis, duplication, or hypertrophy.');
    } else {
      list.push('Within expected range for age.');
    }
    return list;
  })();

  const tableRows = useMemo(
    () =>
      renalLengthBands.map((b) => [
        b.label,
        `${b.mean.toFixed(1)} (${b.sd.toFixed(1)})`,
        `n=${b.count}`
      ]),
    []
  );

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs" subtitle="Kidney length reference calculator." />
        <Field label="Age value" value={ageValue} onChangeText={setAgeValue} placeholder="e.g., 8" keyboardType="numeric" />
        <SelectField
          label="Age unit"
          value={ageUnit}
          onChange={setAgeUnit}
          options={[
            { label: 'Years', value: 'years' },
            { label: 'Months', value: 'months' },
            { label: 'Weeks', value: 'weeks' }
          ]}
        />
        <Field label="Measured renal length (cm)" value={lengthValue} onChangeText={setLengthValue} placeholder="e.g., 8.4" keyboardType="numeric" />
        <SelectField
          label="Side (optional)"
          value={side}
          onChange={setSide}
          options={[
            { label: 'Not specified', value: '' },
            { label: 'Left', value: 'Left' },
            { label: 'Right', value: 'Right' }
          ]}
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Reference Values" />
        <View style={styles.statRow}>
          <StatCard label="Age band" value={band ? band.label : '--'} helper={band ? `n=${band.count}` : ''} />
          <StatCard label="Mean" value={band ? `${band.mean.toFixed(1)} cm` : '--'} helper={band ? `SD ${band.sd.toFixed(1)}` : ''} />
          <StatCard label="Range (95%)" value={band ? `${lower.toFixed(1)} - ${upper.toFixed(1)} cm` : '--'} />
          <StatCard label="Z-score" value={Number.isFinite(zScore) ? zScore.toFixed(2) : '--'} helper={interpretation} />
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Notes" />
        <BulletList items={notes} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader
          title="Reference Bands"
          right={<ActionButton title={showTable ? 'Hide table' : 'Show table'} onPress={() => setShowTable(!showTable)} variant="ghost" />}
        />
        {showTable ? (
          <ScrollView horizontal style={styles.table}>
            <View>
              <View style={styles.tableRow}>
                {['Age band', 'Mean (SD) cm', 'Sample size'].map((col) => (
                  <Text key={col} style={[styles.tableCell, styles.tableHeader]}>{col}</Text>
                ))}
              </View>
              {tableRows.map((row, rowIndex) => (
                <View key={`renal-row-${rowIndex}`} style={styles.tableRow}>
                  {row.map((cell, cellIndex) => (
                    <Text key={`renal-cell-${rowIndex}-${cellIndex}`} style={styles.tableCell}>
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.hint}>Tap "Show table" to view all reference bands.</Text>
        )}
      </SectionCard>
    </View>
  );
};

const SpleenSizeCalculator = () => {
  const [ageValue, setAgeValue] = useState('');
  const [ageUnit, setAgeUnit] = useState('years');
  const [sex, setSex] = useState('female');
  const [lengthValue, setLengthValue] = useState('');
  const [showTable, setShowTable] = useState(false);

  const months = ageToMonths(ageValue, ageUnit);
  const band = Number.isFinite(months)
    ? spleenLengthBands.find((b) => months >= b.minMonths && months < b.maxMonths) || null
    : null;
  const entry = band ? band.data[sex] : null;
  const lengthCm = parseNumber(lengthValue);
  const zScore = entry && Number.isFinite(lengthCm) ? (lengthCm - entry.mean) / entry.sd : null;

  const interpretation = (() => {
    if (!entry) return 'Add age to view reference values.';
    if (!Number.isFinite(zScore)) return 'Add a measurement to get a z-score.';
    if (zScore < -2) return 'Below expected (< -2 SD).';
    if (zScore < -1) return 'Slightly below expected.';
    if (zScore > 2) return 'Above expected (> +2 SD).';
    if (zScore > 1) return 'Slightly above expected.';
    return 'Within expected range.';
  })();

  const notes = (() => {
    if (!Number.isFinite(months)) {
      return [
        'Add age to view the reference band.',
        'Add a measured length to calculate a z-score.'
      ];
    }
    if (!band) {
      return ['Age is outside the available reference range (0-17 years).'];
    }
    if (!entry) {
      return ['No reference available for the selected sex.'];
    }
    const list = [
      `Reference mean ${entry.mean.toFixed(1)} cm (SD ${entry.sd.toFixed(2)}), n=${entry.count}.`,
      `Reported min-max: ${entry.min.toFixed(1)} - ${entry.max.toFixed(1)} cm.`
    ];
    if (!Number.isFinite(lengthCm)) {
      list.push('Add a measured length to view the z-score and interpretation.');
    } else if (!Number.isFinite(zScore)) {
      list.push('Z-score not available; check SD for this band.');
    } else if (zScore > 2) {
      list.push('Above expected; consider congestion, portal hypertension, or infiltrative causes.');
    } else if (zScore < -2) {
      list.push('Below expected; consider technique and clinical correlation.');
    } else {
      list.push('Within expected range for age.');
    }
    return list;
  })();

  const tableRows = useMemo(() => {
    return spleenLengthBands.flatMap((b) => {
      return ['female', 'male'].map((sexKey) => {
        const data = b.data[sexKey];
        return [
          b.label,
          sexKey === 'female' ? 'F' : 'M',
          `${data.mean.toFixed(1)} (${data.sd.toFixed(2)})`,
          `${data.min.toFixed(1)} - ${data.max.toFixed(1)}`,
          `n=${data.count}`
        ];
      });
    });
  }, []);

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Inputs" subtitle="Pediatric spleen length reference calculator." />
        <Field label="Age value" value={ageValue} onChangeText={setAgeValue} placeholder="e.g., 10" keyboardType="numeric" />
        <SelectField
          label="Age unit"
          value={ageUnit}
          onChange={setAgeUnit}
          options={[
            { label: 'Years', value: 'years' },
            { label: 'Months', value: 'months' },
            { label: 'Weeks', value: 'weeks' }
          ]}
        />
        <SelectField
          label="Sex"
          value={sex}
          onChange={setSex}
          options={[
            { label: 'Female', value: 'female' },
            { label: 'Male', value: 'male' }
          ]}
        />
        <Field label="Measured spleen length (cm)" value={lengthValue} onChangeText={setLengthValue} placeholder="e.g., 9.2" keyboardType="numeric" />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Reference Values" />
        <View style={styles.statRow}>
          <StatCard label="Age band" value={band ? `${band.label} (${sex === 'female' ? 'F' : 'M'})` : '--'} helper={entry ? `n=${entry.count}` : ''} />
          <StatCard label="Mean" value={entry ? `${entry.mean.toFixed(1)} cm` : '--'} helper={entry ? `SD ${entry.sd.toFixed(2)}` : ''} />
          <StatCard label="Range" value={entry ? `${entry.min.toFixed(1)} - ${entry.max.toFixed(1)} cm` : '--'} />
          <StatCard label="Z-score" value={Number.isFinite(zScore) ? zScore.toFixed(2) : '--'} helper={interpretation} />
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Notes" />
        <BulletList items={notes} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader
          title="Reference Bands"
          right={<ActionButton title={showTable ? 'Hide table' : 'Show table'} onPress={() => setShowTable(!showTable)} variant="ghost" />}
        />
        {showTable ? (
          <ScrollView horizontal style={styles.table}>
            <View>
              <View style={styles.tableRow}>
                {['Age band', 'Sex', 'Mean (SD) cm', 'Min-max cm', 'Sample size'].map((col) => (
                  <Text key={col} style={[styles.tableCell, styles.tableHeader]}>{col}</Text>
                ))}
              </View>
              {tableRows.map((row, rowIndex) => (
                <View key={`spleen-row-${rowIndex}`} style={styles.tableRow}>
                  {row.map((cell, cellIndex) => (
                    <Text key={`spleen-cell-${rowIndex}-${cellIndex}`} style={styles.tableCell}>
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.hint}>Tap "Show table" to view all reference bands.</Text>
        )}
      </SectionCard>
    </View>
  );
};

const GailRiskCalculator = () => {
  const [form, setForm] = useState({
    patientId: '',
    currentAge: '',
    raceEthnicity: '',
    subRace: '',
    menarcheAge: '',
    firstBirthAge: '',
    firstDegreeRelatives: '',
    biopsyCount: '',
    atypicalHyperplasia: '',
    notes: '',
    calcDate: '',
    fiveYearRisk: '',
    avgFiveYearRisk: '',
    lifetimeRisk: '',
    avgLifetimeRisk: '',
    riskCategory: '',
    actionPlan: '',
    explanation: ''
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const raceOptions = [
    { label: 'White', value: 'white' },
    { label: 'Black or African American', value: 'black' },
    { label: 'Hispanic or Latina', value: 'hispanic' },
    { label: 'Asian or Pacific Islander', value: 'asian' },
    { label: 'American Indian or Alaska Native', value: 'native' },
    { label: 'Unknown or other', value: 'unknown' }
  ];

  const subRaceOptions = useMemo(() => {
    if (form.raceEthnicity === 'hispanic') {
      return [
        { label: 'US born', value: 'hispanic-us' },
        { label: 'Born outside the US', value: 'hispanic-foreign' }
      ];
    }
    if (form.raceEthnicity === 'asian') {
      return [
        { label: 'Pacific Islander', value: 'asian-islander' },
        { label: 'Japanese', value: 'asian-japanese' },
        { label: 'Other Asian', value: 'asian-other' }
      ];
    }
    return [];
  }, [form.raceEthnicity]);

  useEffect(() => {
    if (!['hispanic', 'asian'].includes(form.raceEthnicity) && form.subRace) {
      setForm((prev) => ({ ...prev, subRace: '' }));
    }
  }, [form.raceEthnicity]);

  useEffect(() => {
    if (form.biopsyCount !== '1' && form.biopsyCount !== '2plus' && form.atypicalHyperplasia) {
      setForm((prev) => ({ ...prev, atypicalHyperplasia: '' }));
    }
  }, [form.biopsyCount]);

  const getLabel = (options, value) => options.find((opt) => opt.value === value)?.label || '';

  const menarcheOptions = [
    { label: 'Younger than 12', value: 'lt12' },
    { label: '12 to 13', value: '12to13' },
    { label: '14 or older', value: 'ge14' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const birthOptions = [
    { label: 'No births', value: 'none' },
    { label: 'Younger than 20', value: 'lt20' },
    { label: '20 to 24', value: '20to24' },
    { label: '25 to 29', value: '25to29' },
    { label: '30 or older', value: 'ge30' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const firstDegreeOptions = [
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2 or more', value: '2plus' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const biopsyOptions = [
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2 or more', value: '2plus' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const atypicalOptions = [
    { label: 'No', value: 'no' },
    { label: 'Yes', value: 'yes' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const summaryLines = useMemo(() => {
    const atypicalDisplay =
      form.biopsyCount === '1' || form.biopsyCount === '2plus'
        ? getLabel(atypicalOptions, form.atypicalHyperplasia) || 'Not provided'
        : 'Not applicable';
    const subRaceDisplay =
      form.raceEthnicity === 'hispanic' || form.raceEthnicity === 'asian'
        ? getLabel(subRaceOptions, form.subRace) || 'Not provided'
        : 'Not applicable';
    return [
      `Patient: ${form.patientId || 'Not provided'}`,
      `Age: ${form.currentAge || 'Not provided'}`,
      `Race/ethnicity: ${getLabel(raceOptions, form.raceEthnicity) || 'Not provided'}`,
      `Sub race/ethnicity: ${subRaceDisplay}`,
      `Age at menarche: ${getLabel(menarcheOptions, form.menarcheAge) || 'Not provided'}`,
      `Age at first live birth: ${getLabel(birthOptions, form.firstBirthAge) || 'Not provided'}`,
      `First-degree relatives: ${getLabel(firstDegreeOptions, form.firstDegreeRelatives) || 'Not provided'}`,
      `Prior breast biopsies: ${getLabel(biopsyOptions, form.biopsyCount) || 'Not provided'}`,
      `Atypical hyperplasia: ${atypicalDisplay}`,
      `Notes: ${form.notes || 'None'}`
    ];
  }, [form, raceOptions, subRaceOptions, menarcheOptions, birthOptions, firstDegreeOptions, biopsyOptions, atypicalOptions]);

  const fiveYear = parseNumber(form.fiveYearRisk);
  const avgFiveYear = parseNumber(form.avgFiveYearRisk);
  const lifetime = parseNumber(form.lifetimeRisk);
  const avgLifetime = parseNumber(form.avgLifetimeRisk);

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Before You Start" subtitle="Intended for women age 35-85 without prior breast cancer." />
        <BulletList
          items={[
            'Use the official NCI BCRiskTool for calculation.',
            'If pathogenic mutations or chest radiation are present, use a different model.',
            'Record 5-year and lifetime risk results in the fields below.'
          ]}
        />
        <ActionButton title="Open NCI BCRiskTool" onPress={() => openExternal('https://bcrisktool.cancer.gov/calculator.html')} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Patient Inputs" subtitle="Manual entry for the Gail model workflow." />
        <Field label="Patient name or ID" value={form.patientId} onChangeText={(value) => update('patientId', value)} placeholder="Jane Doe / MRN 12345" />
        <Field label="Current age (years)" value={form.currentAge} onChangeText={(value) => update('currentAge', value)} placeholder="e.g., 52" keyboardType="numeric" />
        <SelectField label="Race / ethnicity" value={form.raceEthnicity} onChange={(value) => update('raceEthnicity', value)} options={raceOptions} />
        {(form.raceEthnicity === 'hispanic' || form.raceEthnicity === 'asian') ? (
          <SelectField label="Sub race/ethnicity" value={form.subRace} onChange={(value) => update('subRace', value)} options={subRaceOptions} />
        ) : null}
        <SelectField label="Age at menarche" value={form.menarcheAge} onChange={(value) => update('menarcheAge', value)} options={menarcheOptions} />
        <SelectField label="Age at first live birth" value={form.firstBirthAge} onChange={(value) => update('firstBirthAge', value)} options={birthOptions} />
        <SelectField label="First-degree relatives with breast cancer" value={form.firstDegreeRelatives} onChange={(value) => update('firstDegreeRelatives', value)} options={firstDegreeOptions} />
        <SelectField label="Number of prior breast biopsies" value={form.biopsyCount} onChange={(value) => update('biopsyCount', value)} options={biopsyOptions} />
        <SelectField label="Atypical hyperplasia" value={form.atypicalHyperplasia} onChange={(value) => update('atypicalHyperplasia', value)} options={atypicalOptions} />
        <Field label="Additional notes" value={form.notes} onChangeText={(value) => update('notes', value)} placeholder="Optional details" multiline />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Results (from NCI tool)" subtitle="Paste calculated values here." />
        <Field label="Calculation date" value={form.calcDate} onChangeText={(value) => update('calcDate', value)} placeholder="YYYY-MM-DD" />
        <Field label="5-year risk (%)" value={form.fiveYearRisk} onChangeText={(value) => update('fiveYearRisk', value)} placeholder="e.g., 1.8" keyboardType="numeric" />
        <Field label="Average 5-year risk (%)" value={form.avgFiveYearRisk} onChangeText={(value) => update('avgFiveYearRisk', value)} placeholder="e.g., 1.2" keyboardType="numeric" />
        <Field label="Lifetime risk (%)" value={form.lifetimeRisk} onChangeText={(value) => update('lifetimeRisk', value)} placeholder="e.g., 12.4" keyboardType="numeric" />
        <Field label="Average lifetime risk (%)" value={form.avgLifetimeRisk} onChangeText={(value) => update('avgLifetimeRisk', value)} placeholder="e.g., 11.0" keyboardType="numeric" />
        <Field label="Risk category (optional)" value={form.riskCategory} onChangeText={(value) => update('riskCategory', value)} placeholder="e.g., Elevated risk" />
        <Field label="Action plan" value={form.actionPlan} onChangeText={(value) => update('actionPlan', value)} placeholder="Recommendations" multiline />
        <Field label="Explanation / notes" value={form.explanation} onChangeText={(value) => update('explanation', value)} placeholder="Optional explanation" multiline />
        <View style={styles.statRow}>
          <StatCard label="5-year risk" value={formatPercent(fiveYear, 1)} />
          <StatCard label="Avg 5-year" value={formatPercent(avgFiveYear, 1)} />
          <StatCard label="Lifetime risk" value={formatPercent(lifetime, 1)} />
          <StatCard label="Avg lifetime" value={formatPercent(avgLifetime, 1)} />
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Summary" right={<ActionButton title="Clear" onPress={() => setForm({
          patientId: '',
          currentAge: '',
          raceEthnicity: '',
          subRace: '',
          menarcheAge: '',
          firstBirthAge: '',
          firstDegreeRelatives: '',
          biopsyCount: '',
          atypicalHyperplasia: '',
          notes: '',
          calcDate: '',
          fiveYearRisk: '',
          avgFiveYearRisk: '',
          lifetimeRisk: '',
          avgLifetimeRisk: '',
          riskCategory: '',
          actionPlan: '',
          explanation: ''
        })} variant="ghost" />} />
        <ResultBox text={summaryLines.join('\n')} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Disclaimer" />
        <Text style={styles.paragraph}>This information does not replace clinical judgment or professional evaluation.</Text>
      </SectionCard>
    </View>
  );
};

const TyrerCuzickCalculator = () => {
  const [form, setForm] = useState({
    patientId: '',
    currentAge: '',
    sexAtBirth: '',
    ethnicity: '',
    breastDensity: '',
    heightIn: '',
    weightLb: '',
    menarcheAge: '',
    menopauseStatus: '',
    menopauseAge: '',
    parity: '',
    firstBirthAge: '',
    biopsyHistory: '',
    biopsyCount: '',
    atypicalHyperplasia: '',
    lcis: '',
    chestRadiation: '',
    personalHistory: '',
    firstDegreeCount: '',
    secondDegreeCount: '',
    youngestDxAge: '',
    ovarianFamily: '',
    maleBreastFamily: '',
    knownMutation: '',
    ashkenazi: '',
    notes: '',
    calcDate: '',
    riskCategory: '',
    tenYearRisk: '',
    lifetimeRisk: '',
    actionPlan: '',
    explanation: ''
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const getLabel = (options, value) => options.find((opt) => opt.value === value)?.label || '';

  const sexOptions = [
    { label: 'Female', value: 'female' },
    { label: 'Male', value: 'male' },
    { label: 'Intersex', value: 'intersex' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const ethnicityOptions = [
    { label: 'White', value: 'white' },
    { label: 'Black or African American', value: 'black' },
    { label: 'Hispanic or Latino', value: 'hispanic' },
    { label: 'Asian', value: 'asian' },
    { label: 'American Indian or Alaska Native', value: 'native' },
    { label: 'Native Hawaiian or Pacific Islander', value: 'pacific' },
    { label: 'Other', value: 'other' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const densityOptions = [
    { label: 'A - Almost entirely fatty', value: 'a' },
    { label: 'B - Scattered fibroglandular densities', value: 'b' },
    { label: 'C - Heterogeneously dense', value: 'c' },
    { label: 'D - Extremely dense', value: 'd' }
  ];

  const menopauseOptions = [
    { label: 'Premenopausal', value: 'pre' },
    { label: 'Perimenopausal', value: 'peri' },
    { label: 'Postmenopausal', value: 'post' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const yesNoOptions = [
    { label: 'No', value: 'no' },
    { label: 'Yes', value: 'yes' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const riskCategoryOptions = [
    { label: 'Average', value: 'average' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'High', value: 'high' },
    { label: 'Unknown', value: 'unknown' }
  ];

  const summaryLines = useMemo(() => {
    return [
      `Patient: ${form.patientId || 'Not provided'}`,
      `Age: ${form.currentAge || 'Not provided'}`,
      `Sex at birth: ${getLabel(sexOptions, form.sexAtBirth) || 'Not provided'}`,
      `Ethnicity: ${getLabel(ethnicityOptions, form.ethnicity) || 'Not provided'}`,
      `Breast density: ${getLabel(densityOptions, form.breastDensity) || 'Not provided'}`,
      `Height/Weight: ${form.heightIn || '--'} in / ${form.weightLb || '--'} lb`,
      `Menarche age: ${form.menarcheAge || 'Not provided'}`,
      `Menopause status: ${getLabel(menopauseOptions, form.menopauseStatus) || 'Not provided'}`,
      `Menopause age: ${form.menopauseAge || 'Not provided'}`,
      `Live births: ${form.parity || 'Not provided'}`,
      `First live birth age: ${form.firstBirthAge || 'Not provided'}`,
      `Biopsy history: ${getLabel(yesNoOptions, form.biopsyHistory) || 'Not provided'} (${form.biopsyCount || '0'})`,
      `Atypical hyperplasia: ${getLabel(yesNoOptions, form.atypicalHyperplasia) || 'Not provided'}`,
      `LCIS: ${getLabel(yesNoOptions, form.lcis) || 'Not provided'}`,
      `Chest radiation: ${getLabel(yesNoOptions, form.chestRadiation) || 'Not provided'}`,
      `Personal breast cancer history: ${getLabel(yesNoOptions, form.personalHistory) || 'Not provided'}`,
      `First-degree relatives: ${form.firstDegreeCount || '0'}`,
      `Second-degree relatives: ${form.secondDegreeCount || '0'}`,
      `Youngest diagnosis age: ${form.youngestDxAge || 'Not provided'}`,
      `Ovarian cancer in family: ${getLabel(yesNoOptions, form.ovarianFamily) || 'Not provided'}`,
      `Male breast cancer in family: ${getLabel(yesNoOptions, form.maleBreastFamily) || 'Not provided'}`,
      `Known mutation: ${getLabel(yesNoOptions, form.knownMutation) || 'Not provided'}`,
      `Ashkenazi ancestry: ${getLabel(yesNoOptions, form.ashkenazi) || 'Not provided'}`,
      `Notes: ${form.notes || 'None'}`
    ];
  }, [form, sexOptions, ethnicityOptions, densityOptions, menopauseOptions, yesNoOptions]);

  const tenYear = parseNumber(form.tenYearRisk);
  const lifetime = parseNumber(form.lifetimeRisk);

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Before You Start" subtitle="Manual workflow with the IBIS calculator." />
        <BulletList
          items={[
            'For women in the US, choose the BI-RADS ATLAS option for breast density.',
            'Refer to mammogram or MRI for density selection.',
            'After calculation, review recommended action plans.'
          ]}
        />
        <ActionButton title="Open IBIS Calculator" onPress={() => openExternal('https://ibis.ikonopedia.com/')} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Patient" />
        <Field label="Patient name or ID" value={form.patientId} onChangeText={(value) => update('patientId', value)} placeholder="Jane Doe / MRN 12345" />
        <Field label="Current age (years)" value={form.currentAge} onChangeText={(value) => update('currentAge', value)} placeholder="e.g., 48" keyboardType="numeric" />
        <SelectField label="Sex at birth" value={form.sexAtBirth} onChange={(value) => update('sexAtBirth', value)} options={sexOptions} />
        <SelectField label="Ethnicity" value={form.ethnicity} onChange={(value) => update('ethnicity', value)} options={ethnicityOptions} />
        <SelectField label="Breast density (BI-RADS)" value={form.breastDensity} onChange={(value) => update('breastDensity', value)} options={densityOptions} />
        <Field label="Height (inches)" value={form.heightIn} onChangeText={(value) => update('heightIn', value)} placeholder="64" keyboardType="numeric" />
        <Field label="Weight (lb)" value={form.weightLb} onChangeText={(value) => update('weightLb', value)} placeholder="140" keyboardType="numeric" />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Reproductive History" />
        <Field label="Age at menarche" value={form.menarcheAge} onChangeText={(value) => update('menarcheAge', value)} placeholder="e.g., 12" keyboardType="numeric" />
        <SelectField label="Menopause status" value={form.menopauseStatus} onChange={(value) => update('menopauseStatus', value)} options={menopauseOptions} />
        <Field label="Age at menopause" value={form.menopauseAge} onChangeText={(value) => update('menopauseAge', value)} placeholder="e.g., 52" keyboardType="numeric" />
        <Field label="Number of live births" value={form.parity} onChangeText={(value) => update('parity', value)} placeholder="e.g., 2" keyboardType="numeric" />
        <Field label="Age at first live birth" value={form.firstBirthAge} onChangeText={(value) => update('firstBirthAge', value)} placeholder="e.g., 28" keyboardType="numeric" />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Personal History" />
        <SelectField label="Prior breast biopsy" value={form.biopsyHistory} onChange={(value) => update('biopsyHistory', value)} options={yesNoOptions} />
        <Field label="Number of biopsies" value={form.biopsyCount} onChangeText={(value) => update('biopsyCount', value)} placeholder="e.g., 1" keyboardType="numeric" />
        <SelectField label="Atypical hyperplasia" value={form.atypicalHyperplasia} onChange={(value) => update('atypicalHyperplasia', value)} options={yesNoOptions} />
        <SelectField label="LCIS" value={form.lcis} onChange={(value) => update('lcis', value)} options={yesNoOptions} />
        <SelectField label="Chest radiation" value={form.chestRadiation} onChange={(value) => update('chestRadiation', value)} options={yesNoOptions} />
        <SelectField label="Personal breast cancer history" value={form.personalHistory} onChange={(value) => update('personalHistory', value)} options={yesNoOptions} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Family History" />
        <Field label="First-degree relatives" value={form.firstDegreeCount} onChangeText={(value) => update('firstDegreeCount', value)} placeholder="e.g., 1" keyboardType="numeric" />
        <Field label="Second-degree relatives" value={form.secondDegreeCount} onChangeText={(value) => update('secondDegreeCount', value)} placeholder="e.g., 2" keyboardType="numeric" />
        <Field label="Youngest diagnosis age" value={form.youngestDxAge} onChangeText={(value) => update('youngestDxAge', value)} placeholder="e.g., 45" keyboardType="numeric" />
        <SelectField label="Ovarian cancer in family" value={form.ovarianFamily} onChange={(value) => update('ovarianFamily', value)} options={yesNoOptions} />
        <SelectField label="Male breast cancer in family" value={form.maleBreastFamily} onChange={(value) => update('maleBreastFamily', value)} options={yesNoOptions} />
        <SelectField label="Known mutation" value={form.knownMutation} onChange={(value) => update('knownMutation', value)} options={yesNoOptions} />
        <SelectField label="Ashkenazi ancestry" value={form.ashkenazi} onChange={(value) => update('ashkenazi', value)} options={yesNoOptions} />
        <Field label="Additional notes" value={form.notes} onChangeText={(value) => update('notes', value)} placeholder="Optional details" multiline />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Results & Explanations" />
        <Field label="Calculation date" value={form.calcDate} onChangeText={(value) => update('calcDate', value)} placeholder="YYYY-MM-DD" />
        <SelectField label="Risk category" value={form.riskCategory} onChange={(value) => update('riskCategory', value)} options={riskCategoryOptions} />
        <Field label="10-year risk (%)" value={form.tenYearRisk} onChangeText={(value) => update('tenYearRisk', value)} placeholder="e.g., 2.4" keyboardType="numeric" />
        <Field label="Lifetime risk (%)" value={form.lifetimeRisk} onChangeText={(value) => update('lifetimeRisk', value)} placeholder="e.g., 18.2" keyboardType="numeric" />
        <Field label="Recommended action plan" value={form.actionPlan} onChangeText={(value) => update('actionPlan', value)} placeholder="Paste recommendations" multiline />
        <Field label="Explanation / notes" value={form.explanation} onChangeText={(value) => update('explanation', value)} placeholder="Optional explanation" multiline />
        <View style={styles.statRow}>
          <StatCard label="10-year risk" value={formatPercent(tenYear, 1)} />
          <StatCard label="Lifetime risk" value={formatPercent(lifetime, 1)} />
          <StatCard label="Category" value={getLabel(riskCategoryOptions, form.riskCategory) || '--'} />
        </View>
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="IBIS Entry Summary" right={<ActionButton title="Clear" onPress={() => setForm({
          patientId: '',
          currentAge: '',
          sexAtBirth: '',
          ethnicity: '',
          breastDensity: '',
          heightIn: '',
          weightLb: '',
          menarcheAge: '',
          menopauseStatus: '',
          menopauseAge: '',
          parity: '',
          firstBirthAge: '',
          biopsyHistory: '',
          biopsyCount: '',
          atypicalHyperplasia: '',
          lcis: '',
          chestRadiation: '',
          personalHistory: '',
          firstDegreeCount: '',
          secondDegreeCount: '',
          youngestDxAge: '',
          ovarianFamily: '',
          maleBreastFamily: '',
          knownMutation: '',
          ashkenazi: '',
          notes: '',
          calcDate: '',
          riskCategory: '',
          tenYearRisk: '',
          lifetimeRisk: '',
          actionPlan: '',
          explanation: ''
        })} variant="ghost" />} />
        <ResultBox text={summaryLines.join('\n')} />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Disclaimer" />
        <Text style={styles.paragraph}>This information does not replace clinical judgment or professional evaluation.</Text>
      </SectionCard>
    </View>
  );
};

const FleischnerCalculator = () => (
  <View>
    <StructuredSections data={fleischnerData} searchPlaceholder="Search Fleischner guidance..." />
  </View>
);

const GallbladderCalculator = () => {
  const imageSource = resolveStructuredImage('Gallbladder polyp.jpeg');

  return (
    <View>
      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Notes" subtitle="External calculator hosted at radcomplete.com (internet required)." />
        <BulletList
          items={[
            'Use for polyp size-based risk stratification.',
            'Verify ultrasound measurements and patient risk factors before applying recommendations.'
          ]}
        />
      </SectionCard>

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Calculator" subtitle="Open the RadComplete gallbladder polyp calculator." />
        <ActionButton
          title="Open calculator"
          onPress={() => openExternal('https://radcomplete.com/calculators/gallbladder_polyp')}
        />
      </SectionCard>

      {imageSource ? (
        <SectionCard style={styles.referenceCard}>
          <CardHeader title="Reference Image" subtitle="Downloaded gallbladder polyp reference image." />
          <Image source={imageSource} style={styles.referenceImage} resizeMode="contain" />
        </SectionCard>
      ) : null}

      <SectionCard style={styles.referenceCard}>
        <CardHeader title="Disclaimer" />
        <Text style={styles.paragraph}>For educational use only; does not replace clinical judgment.</Text>
      </SectionCard>
    </View>
  );
};

const CalculatorScreen = ({ calculatorId, title, onBack }) => {
  const fade = useFadeIn();
  const calculators = {
    'adrenal-ct': { title: 'Adrenal CT Washout', component: AdrenalCtCalculator },
    'adrenal-mri': { title: 'Adrenal MRI CSI', component: AdrenalMriCalculator },
    'hepatic-fat': { title: 'Hepatic Fat Calculator', component: HepaticFatCalculator },
    gfr: { title: 'GFR (CKD-EPI)', component: GfrCalculator },
    'iodinated-contrast': { title: 'Iodinated Contrast Guidelines', component: IodinatedContrastGuidelines },
    'gadolinium-contrast': { title: 'Gadolinium Contrast Guidelines', component: GadoliniumContrastGuidelines },
    'mri-safety-compatibility': { title: 'MRI Safety & Compatibility List', component: MriSafetyCompatibilityList },
    bosniak: { title: 'Bosniak Classification', component: BosniakCalculator },
    'carotid-stenosis': { title: 'Carotid Stenosis (NASCET)', component: CarotidStenosisCalculator },
    'pancreatic-fluid': { title: 'Pancreatic Fluid Collections', component: PancreaticFluidCalculator },
    tirads: { title: 'ACR TI-RADS Calculator', component: TiradsCalculator },
    'liver-length': { title: 'Pediatric Liver Length', component: LiverLengthCalculator },
    'renal-length': { title: 'Pediatric Renal Length', component: RenalLengthCalculator },
    'spleen-size': { title: 'Pediatric Spleen Length', component: SpleenSizeCalculator },
    'gail-risk': { title: 'Gail Model (Manual)', component: GailRiskCalculator },
    'tyrer-cuzick': { title: 'Tyrer-Cuzick (Manual)', component: TyrerCuzickCalculator },
    fleischner: { title: 'Fleischner Guidelines', component: FleischnerCalculator },
    gallbladder: { title: 'Gallbladder Polyp Tool', component: GallbladderCalculator }
  };

  const entry = calculators[calculatorId];
  const EntryComponent = entry?.component;
  const pageIcon = getPageIcon({
    type: 'calculator',
    id: calculatorId,
    title: title || entry?.title || 'Calculator'
  });

  return (
    <ScreenShell>
      <PageShell>
        <Animated.View style={{ opacity: fade }}>
          <BackHeader title={title || entry?.title || 'Calculator'} onBack={onBack} icon={pageIcon} />
          {!EntryComponent && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Calculator not available.</Text>
            </View>
          )}
          {EntryComponent ? <EntryComponent /> : null}
          <BackFooter onBack={onBack} />
        </Animated.View>
      </PageShell>
    </ScreenShell>
  );
};

const StocksScreen = ({ tickers, title = 'Stock Watch', onBack }) => {
  const pageIcon = getPageIcon({ type: 'stocks', title });
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(160, Math.min(360, width - 96));
  const chartHeight = 120;

  const tickerList = useMemo(() => parseTickers(tickers), [tickers]);
  const tickerKey = tickerList.join('|');
  const [stockCards, setStockCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!tickerList.length) {
      setStockCards([]);
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    setStockCards(tickerList.map((symbol) => ({ symbol, status: 'loading', series: [] })));

    const load = async () => {
      const results = await runWithConcurrency(tickerList, 4, async (symbol) => {
        try {
          const series = await fetchStockSeriesWithRetry(symbol, 2);
          const trimmed = series.slice(-5);
          if (!trimmed.length) throw new Error('No data');
          return { symbol, status: 'ready', series: trimmed };
        } catch (error) {
          return { symbol, status: 'error', error: error?.message || 'No data', series: [] };
        }
      });
      if (!active) return;
      setStockCards(results);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [tickerKey]);

  const renderStockCard = (card) => {
    const { symbol, status, series } = card;
    const last = series[series.length - 1]?.close;
    const change =
      series.length > 1 && Number.isFinite(series[0].close) && Number.isFinite(last)
        ? ((last - series[0].close) / series[0].close) * 100
        : null;
    const spark = buildSparklinePoints(series, chartWidth, chartHeight);
    const rangeText =
      Number.isFinite(spark.min) && Number.isFinite(spark.max)
        ? `5D range: $${formatPrice(spark.min)} - $${formatPrice(spark.max)}`
        : '5D range: --';

    return (
      <View key={symbol} style={styles.stockCard}>
        <View style={styles.stockHeaderRow}>
          <Text style={styles.stockSymbol}>{symbol}</Text>
          {Number.isFinite(last) ? <Text style={styles.stockPrice}>${formatPrice(last)}</Text> : null}
        </View>
        <View style={styles.stockMetaRow}>
          <Text style={styles.stockMeta}>{rangeText}</Text>
          {Number.isFinite(change) ? (
            <Text style={[styles.stockChange, change >= 0 ? styles.stockPositive : styles.stockNegative]}>
              {formatChange(change)}
            </Text>
          ) : null}
        </View>
        <View style={styles.stockChartShell}>
          {status === 'loading' ? (
            <Text style={styles.stockMeta}>Loading 5D history...</Text>
          ) : status === 'error' || !series.length ? (
            <Text style={styles.stockError}>No data available.</Text>
          ) : (
            <View style={styles.stockChartInner}>
              <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <Polyline
                  points={spark.points}
                  fill="none"
                  stroke={colors.logoBlue}
                  strokeWidth={2}
                />
                {spark.coords.map((point, index) => (
                  <Circle
                    key={`${symbol}-dot-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill={colors.accentStrong}
                  />
                ))}
              </Svg>
              <View style={styles.stockAxisRow}>
                <Text style={styles.stockAxisLabel}>{formatShortDate(series[0].date)}</Text>
                <Text style={styles.stockAxisLabel}>
                  {formatShortDate(series[series.length - 1].date)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenShell>
      <PageShell>
        <BackHeader title={title} onBack={onBack} icon={pageIcon} />
        <Text style={styles.stockIntro}>
          5-day price snapshots pulled from the tickers listed in Settings &gt; Favorite Stock Tickers.
        </Text>
        {loading ? <Text style={styles.stockMeta}>Refreshing quotes...</Text> : null}
        {tickerList.length ? (
          <View style={styles.stockList}>{stockCards.map(renderStockCard)}</View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Add tickers in Settings to view charts.</Text>
          </View>
        )}
        <BackFooter onBack={onBack} />
      </PageShell>
    </ScreenShell>
  );
};

const EventsScreen = ({ title = 'Traffic-Impact Events', onBack }) => {
  const pageIcon = getPageIcon({ type: 'events', title });
  const [siteCards, setSiteCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeSite, setActiveSite] = useState('ALL');
  const [expandedSite, setExpandedSite] = useState(null);
  const eventsEnabled = Boolean(TICKETMASTER_KEY || SEATGEEK_KEY);
  const siteNames = useMemo(() => directionsSites.map((site) => site.name), []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const range = buildEventRange();
    let bravesGames = [];
    try {
      bravesGames = await fetchBravesGames(range);
    } catch (error) {
      bravesGames = [];
    }
    setSiteCards(
      directionsSites.map((site) => ({
        ...site,
        status: 'loading',
        events: [],
        construction: []
      }))
    );

    const results = await runWithConcurrency(directionsSites, 3, async (site) => {
      if (!Number.isFinite(site.lat) || !Number.isFinite(site.lon)) {
        return {
          ...site,
          status: 'error',
          error: 'Missing coordinates for this site.',
          events: [],
          construction: []
        };
      }

      const [ticketmasterEvents, seatGeekEvents, construction] = await Promise.all([
        fetchTicketmasterEvents(site, range),
        fetchSeatGeekEvents(site, range),
        fetchConstructionProjects(site)
      ]);

      const bravesNearby = isWithinRadius(site, TRUIST_PARK, BRAVES_RADIUS_MILES) ? bravesGames : [];
      const merged = dedupeEvents([
        ...ticketmasterEvents,
        ...seatGeekEvents,
        ...bravesNearby
      ]).filter(isTrafficImpactEvent);
      const sortedEvents = sortEventsByDate(merged).slice(0, EVENTS_MAX_PER_SITE);
      const sortedConstruction = construction.slice(0, CONSTRUCTION_MAX_PER_SITE);

      return {
        ...site,
        status: 'ready',
        events: sortedEvents,
        construction: sortedConstruction
      };
    });

    setSiteCards(results);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (activeSite !== 'ALL' && !siteNames.includes(activeSite)) {
      setActiveSite('ALL');
    }
  }, [activeSite, siteNames]);

  useEffect(() => {
    if (expandedSite && !siteNames.includes(expandedSite)) {
      setExpandedSite(null);
    }
  }, [expandedSite, siteNames]);

  const visibleSites = useMemo(() => {
    if (activeSite === 'ALL') return siteCards;
    return siteCards.filter((site) => site.name === activeSite);
  }, [activeSite, siteCards]);

  const toggleSite = (name) => {
    setExpandedSite((prev) => (prev === name ? null : name));
  };

  const renderEventRow = (item, type) => {
    const metaParts =
      type === 'construction'
        ? [item.status, item.roadway, item.county, item.source].filter(Boolean)
        : [item.dateLabel, item.venue, item.category, item.source].filter(Boolean);
    const content = (
      <View style={styles.eventRow}>
        <View
          style={[
            styles.eventDot,
            type === 'construction' ? styles.eventDotConstruction : styles.eventDotEvent
          ]}
        />
        <View style={styles.eventRowBody}>
          <Text style={styles.eventName}>{item.title}</Text>
          <Text style={styles.eventMeta}>{metaParts.join(' · ')}</Text>
        </View>
      </View>
    );
    if (type === 'event' && item.url) {
      return (
        <Pressable key={item.id} onPress={() => openExternal(item.url)}>
          {content}
        </Pressable>
      );
    }
    return (
      <View key={item.id}>
        {content}
      </View>
    );
  };

  return (
    <ScreenShell>
      <PageShell>
        <BackHeader title={title} onBack={onBack} icon={pageIcon} />
        <Text style={styles.eventIntro}>
          Traffic-impact events within {EVENTS_RADIUS_MILES} miles of each site address. Sources refresh in real time.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          <Chip label="All" active={activeSite === 'ALL'} onPress={() => setActiveSite('ALL')} />
          {siteNames.map((name) => (
            <Chip
              key={name}
              label={name}
              active={activeSite === name}
              onPress={() => setActiveSite(name)}
            />
          ))}
        </ScrollView>
        <View style={styles.eventActionRow}>
          <ActionButton
            title={loading ? 'Refreshing...' : 'Refresh'}
            onPress={loadEvents}
            variant="ghost"
          />
          {lastUpdated ? (
            <Text style={styles.eventMetaText}>Updated {lastUpdated.toLocaleString('en-US')}</Text>
          ) : null}
        </View>
        {!eventsEnabled ? (
          <View style={styles.eventNotice}>
            <Text style={styles.eventNoticeText}>
              Ticketmaster/SeatGeek keys unlock more live events. Braves home games still load from the MLB schedule.
            </Text>
          </View>
        ) : null}

        <View style={styles.eventList}>
          {visibleSites.map((site) => {
            const isOpen = expandedSite === site.name;
            return (
              <SectionCard key={site.name} style={styles.eventCard}>
                <Pressable style={styles.sectionHeader} onPress={() => toggleSite(site.name)}>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>{site.name}</Text>
                    <Text style={styles.cardSubtitle}>{site.address}</Text>
                  </View>
                  <View style={styles.sectionToggle}>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.ink}
                    />
                  </View>
                </Pressable>
                {isOpen ? (
                  site.status === 'error' ? (
                    <Text style={styles.eventError}>{site.error}</Text>
                  ) : site.status === 'loading' ? (
                    <Text style={styles.eventMeta}>Loading events...</Text>
                  ) : (
                    <View>
                      <Text style={styles.eventGroupTitle}>Major events</Text>
                      {site.events && site.events.length ? (
                        site.events.map((event) => renderEventRow(event, 'event'))
                      ) : (
                        <Text style={styles.eventEmpty}>No major events found.</Text>
                      )}
                      <Text style={styles.eventGroupTitle}>Construction & Roadwork</Text>
                      {site.construction && site.construction.length ? (
                        site.construction.map((item) => renderEventRow(item, 'construction'))
                      ) : (
                        <Text style={styles.eventEmpty}>No active projects found.</Text>
                      )}
                    </View>
                  )
                ) : null}
              </SectionCard>
            );
          })}
        </View>
        <BackFooter onBack={onBack} />
      </PageShell>
    </ScreenShell>
  );
};

const WeatherScreen = ({ title = 'Weather Forecast', onBack }) => {
  const pageIcon = getPageIcon({ type: 'weather', title });
  const [dailyForecast, setDailyForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [status, setStatus] = useState('idle');
  const [lastUpdated, setLastUpdated] = useState(null);
  const { width } = useWindowDimensions();

  const kenSite = useMemo(
    () =>
      directionsSites.find(
        (site) =>
          site.name.toLowerCase().includes('kennestone hospital') &&
          Number.isFinite(site.lat) &&
          Number.isFinite(site.lon)
      ),
    []
  );

  const fallbackKenSite = {
    name: 'Wellstar Kennestone Hospital',
    address: '677 Church St, Marietta, GA 30060',
    lat: 33.9685978,
    lon: -84.552905
  };

  const selectedSite = kenSite || fallbackKenSite;

  const loadForecast = useCallback(async () => {
    setStatus('loading');
    const bundle = await fetchNwsForecastBundle(selectedSite);
    if (!bundle || !bundle.dailyPeriods.length) {
      setDailyForecast([]);
      setHourlyForecast([]);
      setStatus('error');
      return;
    }
    setDailyForecast(bundle.dailyPeriods);
    setHourlyForecast(bundle.hourlyPeriods || []);
    setStatus('ready');
    setLastUpdated(new Date());
  }, [selectedSite]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayDaily = dailyForecast.filter((period) => period.startTime?.startsWith(todayKey));
  const dayPeriod = todayDaily.find((period) => period.isDaytime) || todayDaily[0];
  const nightPeriod = todayDaily.find((period) => !period.isDaytime) || null;
  const todayHourly = hourlyForecast.filter((period) => period.startTime?.startsWith(todayKey));
  const hourlyPreview = todayHourly.slice(0, 8);

  const chartWidth = Math.max(240, Math.min(420, width - 96));
  const chartHeight = 120;
  const barGap = 8;
  const barCount = hourlyPreview.length || 1;
  const barWidth = Math.max(16, Math.floor((chartWidth - barGap * (barCount - 1)) / barCount));
  const barMaxHeight = Math.round(chartHeight * 0.7);
  const tempValues = hourlyPreview.map((period) => period.temperature).filter(Number.isFinite);
  const tempMin = tempValues.length ? Math.min(...tempValues) : 0;
  const tempMax = tempValues.length ? Math.max(...tempValues) : 1;
  const tempRange = tempMax - tempMin || 1;
  const tempPoints = hourlyPreview.map((period, index) => {
    const x = index * (barWidth + barGap) + barWidth / 2;
    const y = chartHeight - ((period.temperature - tempMin) / tempRange) * (chartHeight - 20) - 10;
    return { x, y };
  });
  const tempLinePoints = tempPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');

  const maxPrecip =
    hourlyPreview.length > 0
      ? Math.max(...hourlyPreview.map((period) => getPrecipValue(period)))
      : dayPeriod
        ? getPrecipValue(dayPeriod)
        : null;
  const avgHumidity = (() => {
    const values = todayHourly
      .map((period) => period?.relativeHumidity?.value)
      .filter(Number.isFinite);
    if (!values.length) return null;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  })();
  const maxWind = (() => {
    const values = todayHourly.map((period) => parseWindSpeed(period.windSpeed)).filter(Number.isFinite);
    if (!values.length) return parseWindSpeed(dayPeriod?.windSpeed || '');
    return Math.max(...values);
  })();
  const dewpoint = (() => {
    const value = todayHourly.find((period) => Number.isFinite(period?.dewpoint?.value))?.dewpoint?.value;
    if (!Number.isFinite(value)) return null;
    const unit = todayHourly.find((period) => period?.dewpoint?.unitCode)?.dewpoint?.unitCode || '';
    return /degc/i.test(unit) ? convertCtoF(value) : value;
  })();
  const visibility = (() => {
    const value = todayHourly.find((period) => Number.isFinite(period?.visibility?.value))?.visibility?.value;
    const miles = metersToMiles(value);
    return Number.isFinite(miles) ? miles : null;
  })();
  const pressure = (() => {
    const value = todayHourly.find((period) => Number.isFinite(period?.barometricPressure?.value))?.barometricPressure?.value;
    const inHg = pascalToInHg(value);
    return Number.isFinite(inHg) ? inHg : null;
  })();

  const detailBadges = buildHazardBadges(dayPeriod?.detailedForecast || '');

  return (
    <ScreenShell>
      <PageShell>
        <BackHeader title={title} onBack={onBack} icon={pageIcon} />
        <View style={styles.eventActionRow}>
          <ActionButton
            title={status === 'loading' ? 'Refreshing...' : 'Refresh'}
            onPress={loadForecast}
            variant="ghost"
          />
          {lastUpdated ? (
            <Text style={styles.eventMetaText}>Updated {lastUpdated.toLocaleString('en-US')}</Text>
          ) : null}
        </View>
        <SectionCard style={styles.eventCard}>
          <CardHeader title={selectedSite.name} subtitle={selectedSite.address} />
          {status === 'loading' ? (
            <Text style={styles.eventMeta}>Loading forecast...</Text>
          ) : status === 'error' ? (
            <Text style={styles.eventError}>Unable to load forecast for this site.</Text>
          ) : (
            <View>
              <View style={styles.weatherHero}>
                <View style={styles.weatherHeroLeft}>
                  <Text style={styles.weatherHeroLabel}>Today</Text>
                  <Text style={styles.weatherHeroTemp}>
                    {dayPeriod?.temperature ?? '--'}
                    {dayPeriod?.temperatureUnit || ''}
                  </Text>
                  <EmphasizedWeatherText
                    text={dayPeriod?.shortForecast || '--'}
                    style={styles.weatherHeroCondition}
                    emphasisStyle={styles.weatherEmphasis}
                  />
                  {nightPeriod ? (
                    <EmphasizedWeatherText
                      text={`Tonight: ${nightPeriod.shortForecast || '--'} · Low ${nightPeriod.temperature}${
                        nightPeriod.temperatureUnit || ''
                      }`}
                      style={styles.weatherHeroMeta}
                      emphasisStyle={styles.weatherEmphasisSmall}
                    />
                  ) : null}
                </View>
                {dayPeriod?.icon ? (
                  <Image
                    source={{ uri: dayPeriod.icon.replace('http://', 'https://') }}
                    style={styles.weatherHeroIcon}
                    resizeMode="contain"
                  />
                ) : null}
              </View>

              <View style={styles.weatherDetailGrid}>
                <View style={styles.weatherDetailItem}>
                  <Text style={styles.weatherDetailLabel}>Precip chance</Text>
                  <Text style={styles.weatherDetailValue}>{Number.isFinite(maxPrecip) ? `${maxPrecip}%` : '--'}</Text>
                </View>
                <View style={styles.weatherDetailItem}>
                  <Text style={styles.weatherDetailLabel}>Wind</Text>
                  <Text style={styles.weatherDetailValue}>
                    {dayPeriod?.windDirection || '--'} {Number.isFinite(maxWind) ? `${maxWind} mph` : '--'}
                  </Text>
                </View>
                <View style={styles.weatherDetailItem}>
                  <Text style={styles.weatherDetailLabel}>Humidity</Text>
                  <Text style={styles.weatherDetailValue}>{Number.isFinite(avgHumidity) ? `${avgHumidity}%` : '--'}</Text>
                </View>
                <View style={styles.weatherDetailItem}>
                  <Text style={styles.weatherDetailLabel}>Dew point</Text>
                  <Text style={styles.weatherDetailValue}>
                    {Number.isFinite(dewpoint) ? `${dewpoint.toFixed(0)}F` : '--'}
                  </Text>
                </View>
                <View style={styles.weatherDetailItem}>
                  <Text style={styles.weatherDetailLabel}>Pressure</Text>
                  <Text style={styles.weatherDetailValue}>
                    {Number.isFinite(pressure) ? `${pressure.toFixed(2)} inHg` : '--'}
                  </Text>
                </View>
                <View style={styles.weatherDetailItem}>
                  <Text style={styles.weatherDetailLabel}>Visibility</Text>
                  <Text style={styles.weatherDetailValue}>
                    {Number.isFinite(visibility) ? `${visibility.toFixed(1)} mi` : '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.weatherChartCard}>
                <EmphasizedWeatherText
                  text="Next hours: rain chance & temperature"
                  style={styles.weatherChartTitle}
                  emphasisStyle={styles.weatherEmphasisSmall}
                />
                {hourlyPreview.length ? (
                  <View style={styles.weatherChartWrap}>
                    <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                      {hourlyPreview.map((period, index) => {
                        const precip = getPrecipValue(period);
                        const barHeight = (precip / 100) * barMaxHeight;
                        const x = index * (barWidth + barGap);
                        const y = chartHeight - barHeight;
                        return (
                          <Rect
                            key={`bar-${period.number}`}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill="rgba(31,182,255,0.2)"
                            stroke={colors.accentStrong}
                            strokeWidth={1.5}
                            rx={4}
                          />
                        );
                      })}
                      {tempLinePoints ? (
                        <Polyline
                          points={tempLinePoints}
                          fill="none"
                          stroke={colors.logoBlue}
                          strokeWidth={2}
                        />
                      ) : null}
                      {tempPoints.map((point, index) => (
                        <Circle
                          key={`temp-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r={3}
                          fill={colors.logoBlue}
                        />
                      ))}
                    </Svg>
                    <View style={styles.weatherChartLabels}>
                      {hourlyPreview.map((period) => (
                        <Text key={`label-${period.number}`} style={styles.weatherChartLabel}>
                          {new Date(period.startTime).toLocaleTimeString('en-US', { hour: 'numeric' })}
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.eventEmpty}>Hourly data is not available yet.</Text>
                )}
              </View>

              <View style={styles.weatherPeriod}>
                <Text style={styles.weatherDetailLabel}>Detailed outlook</Text>
                <EmphasizedWeatherText
                  text={dayPeriod?.detailedForecast || 'Detailed forecast is not available yet.'}
                  style={styles.weatherPeriodDetail}
                  emphasisStyle={styles.weatherEmphasis}
                />
                {detailBadges.length ? (
                  <View style={styles.weatherBadgeRow}>
                    {detailBadges.map((badge) => (
                      <View key={`detail-${badge}`} style={styles.weatherBadge}>
                        <Text style={styles.weatherBadgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          )}
        </SectionCard>
        <BackFooter onBack={onBack} />
      </PageShell>
    </ScreenShell>
  );
};

const PlaceholderScreen = ({ title, onBack, settings, setSettings }) => {
  const pageIcon = getPageIcon({ type: 'placeholder', title });
  const isSettings = title === 'Settings';
  const isFeedback = title === 'Feedback';
  const isAbout = title === 'About';
  const activeSettings = settings || DEFAULT_SETTINGS;

  const updateField = (key, value) => {
    if (!setSettings) return;
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleField = (key) => {
    if (!setSettings) return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenShell>
      <PageShell>
        <BackHeader title={title} onBack={onBack} icon={pageIcon} />
        {isSettings ? (
          <View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={activeSettings.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                placeholder="First Name"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={activeSettings.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                placeholder="Last Name"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Home Address</Text>
              <TextInput
                style={styles.fieldInput}
                value={activeSettings.homeAddress}
                onChangeText={(value) => updateField('homeAddress', value)}
                placeholder="Home Address"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.fieldInput}
                value={activeSettings.phoneNumber}
                onChangeText={(value) => updateField('phoneNumber', value)}
                placeholder="Phone Number"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.fieldInput}
                value={activeSettings.emailAddress}
                onChangeText={(value) => updateField('emailAddress', value)}
                placeholder="Email Address"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Favorite Stock Tickers</Text>
              <TextInput
                style={styles.fieldInput}
                value={activeSettings.favoriteTickers}
                onChangeText={(value) => updateField('favoriteTickers', value)}
                placeholder="e.g., NVDA, AAPL, MSFT"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.checkboxRow}>
              <Pressable
                style={[styles.checkboxBox, activeSettings.enableDirections ? styles.checkboxBoxChecked : null]}
                onPress={() => toggleField('enableDirections')}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: activeSettings.enableDirections }}
              >
                {activeSettings.enableDirections ? (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                ) : null}
              </Pressable>
              <Text style={styles.checkboxLabel}>Enable Driving Directions</Text>
            </View>
            <View style={styles.checkboxRow}>
              <Pressable
                style={[styles.checkboxBox, activeSettings.remindWorklist ? styles.checkboxBoxChecked : null]}
                onPress={() => toggleField('remindWorklist')}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: activeSettings.remindWorklist }}
              >
                {activeSettings.remindWorklist ? (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                ) : null}
              </Pressable>
              <Text style={styles.checkboxLabel}>Remind me of the Worklist</Text>
            </View>
            <View style={styles.checkboxRow}>
              <Pressable
                style={[styles.checkboxBox, activeSettings.warnEvents ? styles.checkboxBoxChecked : null]}
                onPress={() => toggleField('warnEvents')}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: activeSettings.warnEvents }}
              >
                {activeSettings.warnEvents ? (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                ) : null}
              </Pressable>
              <Text style={styles.checkboxLabel}>
                Warn of Events Such as Sports Games, Festivals, and Constructions
              </Text>
            </View>
          </View>
        ) : isFeedback ? (
          <View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Feedback</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMultiline, styles.feedbackInput]}
                placeholder="Share your feedback..."
                placeholderTextColor={colors.muted}
                multiline
                value={activeSettings.feedbackText || ''}
                onChangeText={(value) => updateField('feedbackText', value)}
              />
            </View>
            <ActionButton title="Submit Feedback" onPress={() => {}} />
          </View>
        ) : isAbout ? (
          <View style={styles.aboutWrap}>
            <Image source={require('./assets/logo.png')} style={styles.aboutLogo} resizeMode="contain" />
            <Text style={styles.aboutText}>Quantum Radiology App v1.0</Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>This tool is queued for native porting.</Text>
          </View>
        )}
        <BackFooter onBack={onBack} />
      </PageShell>
    </ScreenShell>
  );
};

export default function App() {
  const [stack, setStack] = useState([{ name: 'home', params: {} }]);
  const [homeNavRequest, setHomeNavRequest] = useState({ title: null, nonce: 0 });
  const [hoveredNavKey, setHoveredNavKey] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const contentLookup = useMemo(buildContentLookup, []);

  const current = stack[stack.length - 1];
  const enableHover = Platform.OS === 'web';

  const navItems = useMemo(() => {
    const categories = groupSectionsByCategory(sections);
    return [
      { key: 'home', title: 'Home', iconType: 'ion', icon: 'home' },
      ...categories.map((category) => ({
        key: category.title,
        title: category.title,
        ...(categoryNavIconMap[category.title] || {
          iconType: 'health',
          icon: getCategoryIcon(category.title)
        })
      }))
    ];
  }, []);

  const navigate = (name, params) => {
    setStack((prev) => [...prev, { name, params }]);
  };

  const resetToHome = () => {
    setStack([{ name: 'home', params: {} }]);
  };

  const goBack = () => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const resolveContentId = (href) => {
    const clean = normalizeSource(href);
    if (contentLookup.has(clean)) {
      return contentLookup.get(clean);
    }
    const fileOnly = normalizeSource(href.split('/').pop() || href);
    return contentLookup.get(fileOnly) || null;
  };

  const handleOpenLink = (link) => {
    const href = link.href;
    const route = routeByHref[href];
    if (route) {
      navigate(route.type, { ...route, title: link.title, href });
      return;
    }
    const contentId = resolveContentId(href);
    navigate('content', { contentId, title: link.title, href });
  };

  const handleOpenLibraryItem = (item) => {
    const href = item.source;
    const route = routeByHref[href];
    if (route) {
      navigate(route.type, { ...route, title: item.title, href });
      return;
    }
    navigate('content', { contentId: item.id, title: item.title, href });
  };

  const handleNavPress = (item) => {
    if (item.key === 'home') {
      setHomeNavRequest({ title: null, nonce: Date.now() });
      if (current.name !== 'home') resetToHome();
      return;
    }
    const request = { title: item.title, nonce: Date.now() };
    setHomeNavRequest(request);
    if (current.name !== 'home') {
      resetToHome();
    }
  };

  const handleMenuItem = (label) => {
    setMenuOpen(false);
    navigate('placeholder', { title: label });
  };

  let screen = null;
  if (current.name === 'home') {
    screen = (
      <HomeScreen
        onOpenLink={handleOpenLink}
        onOpenLibrary={() => navigate('library', {})}
        focusCategory={homeNavRequest.title}
        focusNonce={homeNavRequest.nonce}
      />
    );
  } else if (current.name === 'content') {
    screen = (
      <ContentScreen
        contentId={current.params.contentId}
        title={current.params.title}
        onBack={goBack}
      />
    );
  } else if (current.name === 'library') {
    screen = <LibraryScreen onBack={goBack} onOpen={handleOpenLibraryItem} />;
  } else if (current.name === 'directory') {
    screen = (
      <DirectoryScreen
        directoryId={current.params.id}
        title={current.params.title}
        onBack={goBack}
      />
    );
  } else if (current.name === 'structured') {
    screen = (
      <StructuredScreen dataId={current.params.id} title={current.params.title} onBack={goBack} />
    );
  } else if (current.name === 'decisionTree') {
    screen = (
      <DecisionTreeScreen treeId={current.params.id} title={current.params.title} onBack={goBack} />
    );
  } else if (current.name === 'trauma') {
    screen = <TraumaScreen traumaId={current.params.id} title={current.params.title} onBack={goBack} />;
  } else if (current.name === 'calculator') {
    screen = (
      <CalculatorScreen
        calculatorId={current.params.id}
        title={current.params.title}
        onBack={goBack}
      />
    );
  } else if (current.name === 'stocks') {
    screen = (
      <StocksScreen
        tickers={settings.favoriteTickers}
        title={current.params.title || 'Stock Watch'}
        onBack={goBack}
      />
    );
  } else if (current.name === 'events') {
    screen = (
      <EventsScreen
        title={current.params.title || 'Traffic-Impact Events'}
        onBack={goBack}
      />
    );
  } else if (current.name === 'weather') {
    screen = (
      <WeatherScreen
        title={current.params.title || 'Weather Forecast'}
        onBack={goBack}
      />
    );
  } else {
    screen = (
      <PlaceholderScreen
        title={current.params.title || 'Tool'}
        onBack={goBack}
        settings={settings}
        setSettings={setSettings}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {screen}
      <Pressable
        style={styles.menuButton}
        onPress={() => setMenuOpen((prev) => !prev)}
        accessibilityLabel="Open menu"
        hitSlop={8}
      >
        <Ionicons name="ellipsis-horizontal" size={MENU_ICON_SIZE} color={colors.panel} />
      </Pressable>
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuDismiss} onPress={() => setMenuOpen(false)} />
          <View style={styles.menuPopover}>
            {['Settings', 'Help', 'Feedback', 'About'].map((label) => (
              <Pressable
                key={label}
                style={styles.menuItem}
                onPress={() => handleMenuItem(label)}
                accessibilityRole="menuitem"
                accessibilityLabel={label}
              >
                <Text style={styles.menuItemText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
      <View style={styles.bottomNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.bottomNavRow}>
            {navItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => handleNavPress(item)}
                onHoverIn={enableHover ? () => setHoveredNavKey(item.key) : undefined}
                onHoverOut={enableHover ? () => setHoveredNavKey(null) : undefined}
                style={styles.bottomNavItem}
                accessibilityLabel={item.title}
              >
                <View style={styles.bottomNavIcon}>
                  {item.iconType === 'ion' ? (
                    <Ionicons name={item.icon} size={NAV_ICON_SIZE} color={colors.panel} />
                  ) : (
                    <HealthIcon name={item.icon} size={NAV_ICON_SIZE} color={colors.panel} />
                  )}
                </View>
                {enableHover && hoveredNavKey === item.key ? (
                  <View style={styles.bottomNavTooltip}>
                    <Text style={styles.bottomNavTooltipText} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg
  },
  background: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingVertical: 16
  },
  scrollView: {
    flex: 1
  },
  scroll: {
    paddingVertical: 0,
    paddingBottom: BOTTOM_NAV_HEIGHT
  },
  pageShadow: {
    marginHorizontal: 16,
    marginVertical: 0,
    borderRadius: 18,
    shadowColor: '#0c1b2e',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  page: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.94)',
    overflow: 'hidden'
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14
  },
  logo: {
    width: 160,
    height: 84
  },
  heroText: {
    flex: 1,
    marginLeft: 12
  },
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(247,251,255,0.7)',
    marginBottom: 4
  },
  title: {
    fontFamily: fonts.display,
    fontSize: typeScale.display,
    color: '#f7fbff',
    fontWeight: '700',
    marginBottom: 6
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: 'rgba(247,251,255,0.8)'
  },
  worklistCard: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    shadowColor: '#0c1b2e',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  worklistTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4
  },
  worklistDetail: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.muted
  },
  sectionWrapper: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card
  },
  libraryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center'
  },
  libraryButtonIcon: {
    marginRight: 6
  },
  libraryButtonText: {
    fontFamily: fonts.body,
    color: '#f7fbff',
    fontWeight: '600',
    fontSize: typeScale.caption
  },
  search: {
    marginTop: 18
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.card
  },
  searchIcon: {
    marginRight: 8
  },
  introBlock: {
    marginBottom: 12
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    marginBottom: 6
  },
  searchInputBare: {
    flex: 1,
    paddingVertical: 10,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: typeScale.body
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6
  },
  sortLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginRight: 8,
    marginBottom: 6
  },
  hint: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: typeScale.caption
  },
  section: {
    marginTop: 22
  },
  categoryBlock: {
    marginTop: 20
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  categoryIcon: {
    marginRight: 8
  },
  categoryContent: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e7eef8'
  },
  categoryTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.title,
    fontWeight: '700',
    color: colors.ink
  },
  categoryToggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.haze
  },
  categoryToggleText: {
    fontFamily: fonts.display,
    fontSize: typeScale.subtitle,
    fontWeight: '700',
    color: colors.ink
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.subtitle,
    color: colors.ink,
    fontWeight: '700'
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  sectionIcon: {
    marginRight: 6
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  sectionToggle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.haze
  },
  sectionToggleText: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.ink
  },
  sectionToggleDisabled: {
    opacity: 0.4
  },
  group: {
    marginTop: 6
  },
  groupTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.body,
    color: colors.ink,
    fontWeight: '700',
    marginBottom: 6
  },
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6
  },
  cardWrapper: {
    marginHorizontal: 6,
    marginBottom: 12,
    flexGrow: 0,
    flexShrink: 0
  },
  cardWide: {
    flexBasis: '47%',
    maxWidth: '47%'
  },
  cardCompact: {
    flexBasis: '100%',
    maxWidth: '100%'
  },
  linkCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#0c1b2e',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  linkIcon: {
    marginRight: 10
  },
  linkText: {
    fontFamily: fonts.body,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: typeScale.body,
    flex: 1
  },
  linkArrow: {
    marginLeft: 8,
    opacity: 0.9
  },
  empty: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f5f8ff'
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    zIndex: 20,
    paddingHorizontal: NAV_PADDING_H,
    paddingTop: NAV_PADDING_TOP,
    paddingBottom: NAV_PADDING_BOTTOM,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(215,226,239,0.8)',
    borderRadius: 24,
    shadowColor: '#0c1b2e',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bottomNavItem: {
    paddingHorizontal: NAV_ITEM_PADDING,
    paddingVertical: NAV_ITEM_PADDING
  },
  bottomNavIcon: {
    width: NAV_ICON_BOX,
    height: NAV_ICON_BOX,
    borderRadius: NAV_ICON_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(215,226,239,0.8)',
    backgroundColor: 'rgba(247,251,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomNavTooltip: {
    position: 'absolute',
    bottom: NAV_TOOLTIP_OFFSET,
    left: -60,
    right: -60,
    alignItems: 'center'
  },
  bottomNavTooltipText: {
    backgroundColor: colors.panel,
    color: '#ffffff',
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    maxWidth: 160,
    textAlign: 'center'
  },
  emptyText: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: typeScale.caption
  },
  menuButton: {
    position: 'absolute',
    top: MENU_BUTTON_TOP,
    right: 16,
    zIndex: 30,
    width: MENU_BUTTON_SIZE,
    height: MENU_BUTTON_SIZE,
    borderRadius: MENU_BUTTON_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(215,226,239,0.8)',
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0c1b2e',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,27,46,0.06)'
  },
  menuDismiss: {
    flex: 1
  },
  menuPopover: {
    position: 'absolute',
    top: MENU_POPOVER_TOP,
    right: 16,
    minWidth: 160,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,226,239,0.8)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 40,
    shadowColor: '#0c1b2e',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  menuItemText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink,
    fontWeight: '600'
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  backFooter: {
    marginTop: 20,
    alignItems: 'flex-start'
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f0f6ff',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backIcon: {
    marginRight: 6
  },
  backText: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontWeight: '700',
    fontSize: typeScale.caption
  },
  backTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.subtitle,
    color: colors.ink,
    fontWeight: '700',
    flexShrink: 1
  },
  backTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backTitleIcon: {
    marginRight: 8
  },
  contentBody: {
    paddingBottom: 16
  },
  contentText: {
    color: colors.ink
  },
  h1: {
    fontFamily: fonts.display,
    fontSize: typeScale.title,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8
  },
  h2: {
    fontFamily: fonts.display,
    fontSize: typeScale.subtitle,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10
  },
  h3: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8
  },
  paragraph: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: Math.round(typeScale.body * 1.4),
    marginBottom: 8,
    color: colors.ink
  },
  list: {
    marginBottom: 8
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.accentWarm,
    marginTop: 7,
    marginRight: 8
  },
  table: {
    marginBottom: 12
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableCell: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120
  },
  tableCellUniform: {
    width: 120,
    height: 52,
    paddingVertical: 6,
    textAlignVertical: 'center'
  },
  tableCellLink: {
    color: colors.accentStrong,
    textDecorationLine: 'underline'
  },
  tableHeader: {
    backgroundColor: '#f0f6ff',
    fontWeight: '700'
  },
  imageCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f7fbff',
    padding: 10
  },
  contentImage: {
    width: '100%',
    height: 220
  },
  imageCaption: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginTop: 6
  },
  codeBlock: {
    backgroundColor: '#f1f5fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12
  },
  codeText: {
    fontFamily: fonts.mono,
    fontSize: typeScale.caption,
    lineHeight: Math.round(typeScale.caption * 1.5),
    color: colors.ink
  },
  linkButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#e7f2ff',
    borderWidth: 1,
    borderColor: '#c9e3ff',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12
  },
  linkButtonContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  linkButtonIcon: {
    marginRight: 6
  },
  linkButtonText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    fontWeight: '600',
    color: colors.ink
  },
  libraryGrid: {
    marginTop: 8
  },
  libraryCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    marginBottom: 10
  },
  libraryTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4
  },
  libraryMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted
  },
  sectionCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: 14
  },
  referenceCard: {
    backgroundColor: '#ffffff'
  },
  directoryCard: {
    backgroundColor: '#ffffff'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  cardHeaderText: {
    flex: 1,
    marginRight: 8
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.ink
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginTop: 4
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.accentStrong,
    alignSelf: 'flex-start',
    marginTop: 8
  },
  actionButtonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border
  },
  actionButtonText: {
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: typeScale.caption,
    color: '#ffffff'
  },
  actionButtonGhostText: {
    color: colors.ink
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f2f6fb',
    marginRight: 8,
    marginBottom: 8
  },
  chipActive: {
    backgroundColor: colors.accentStrong,
    borderColor: colors.accentStrong
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.ink,
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#ffffff'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  checkboxBoxChecked: {
    backgroundColor: colors.accentStrong,
    borderColor: colors.accentStrong
  },
  checkboxLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink,
    flex: 1
  },
  feedbackInput: {
    minHeight: 160
  },
  aboutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24
  },
  aboutLogo: {
    width: 180,
    height: 90,
    marginBottom: 12
  },
  aboutText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink,
    fontWeight: '600'
  },
  stockIntro: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: Math.round(typeScale.body * 1.4),
    color: colors.ink,
    marginBottom: 10
  },
  stockList: {
    marginTop: 6
  },
  stockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12
  },
  stockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  stockSymbol: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.ink
  },
  stockPrice: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    fontWeight: '600',
    color: colors.ink
  },
  stockMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  stockMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted
  },
  stockChange: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    fontWeight: '700'
  },
  stockPositive: {
    color: '#168a3b'
  },
  stockNegative: {
    color: '#c23b2b'
  },
  stockChartShell: {
    backgroundColor: '#f1f5fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center'
  },
  stockChartInner: {
    alignItems: 'center'
  },
  stockAxisRow: {
    marginTop: 6,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  stockAxisLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted
  },
  stockError: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted
  },
  eventIntro: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: Math.round(typeScale.body * 1.4),
    color: colors.ink,
    marginBottom: 8
  },
  eventActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  eventMetaText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginLeft: 8,
    flex: 1,
    textAlign: 'right'
  },
  eventNotice: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f1f5fb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  eventNoticeText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted
  },
  eventList: {
    marginTop: 4
  },
  eventCard: {
    backgroundColor: '#ffffff'
  },
  eventGroupTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.caption,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 8,
    marginBottom: 6
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 6,
    marginRight: 8
  },
  eventDotEvent: {
    backgroundColor: colors.accentStrong
  },
  eventDotConstruction: {
    backgroundColor: '#f59f0a'
  },
  eventRowBody: {
    flex: 1
  },
  eventName: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2
  },
  eventMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted
  },
  eventEmpty: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginBottom: 6
  },
  eventError: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: '#c23b2b',
    marginBottom: 6
  },
  weatherIntro: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: Math.round(typeScale.body * 1.4),
    color: colors.ink,
    marginBottom: 8
  },
  weatherHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5fb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  weatherHeroLeft: {
    flex: 1,
    paddingRight: 10
  },
  weatherHeroLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4
  },
  weatherHeroTemp: {
    fontFamily: fonts.display,
    fontSize: scaleFont(38),
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4
  },
  weatherHeroCondition: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink,
    fontWeight: '600',
    marginBottom: 6
  },
  weatherHeroMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted
  },
  weatherEmphasis: {
    fontWeight: '700',
    fontSize: Math.round(typeScale.body * 1.08),
    color: colors.ink
  },
  weatherEmphasisSmall: {
    fontWeight: '700',
    fontSize: Math.round(typeScale.caption * 1.15),
    color: colors.ink
  },
  weatherHeroIcon: {
    width: 86,
    height: 86
  },
  weatherDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  weatherDetailItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#ffffff',
    marginBottom: 10
  },
  weatherDetailLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginBottom: 4
  },
  weatherDetailValue: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.ink
  },
  weatherPeriod: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#f7fbff',
    padding: 12,
    marginBottom: 10
  },
  weatherPeriodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  weatherPeriodName: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.ink
  },
  weatherPeriodTemp: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.ink
  },
  weatherPeriodDetail: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: Math.round(typeScale.body * 1.4),
    color: colors.ink,
    marginBottom: 8
  },
  weatherPeriodMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginBottom: 6
  },
  weatherBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  weatherBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#e7f2ff',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
    marginBottom: 6
  },
  weatherBadgeText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    fontWeight: '600',
    color: colors.ink
  },
  weatherChartCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f7fbff',
    marginBottom: 12
  },
  weatherChartTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.caption,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8
  },
  weatherChartWrap: {
    alignItems: 'center'
  },
  weatherChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6
  },
  weatherChartLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    flex: 1,
    textAlign: 'center'
  },
  field: {
    marginBottom: 12
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginBottom: 6
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f7fbff',
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink
  },
  fieldInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  select: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f7fbff'
  },
  selectText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink
  },
  selectPlaceholder: {
    color: colors.muted
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9,17,33,0.45)',
    justifyContent: 'center',
    padding: 16
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.ink
  },
  modalClose: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f0f6ff'
  },
  modalCloseText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    fontWeight: '600',
    color: colors.ink
  },
  modalList: {
    paddingHorizontal: 8,
    paddingBottom: 12
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  modalOptionActive: {
    backgroundColor: '#e7f2ff'
  },
  modalOptionText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: colors.accentStrong
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  statCard: {
    flexGrow: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f7fbff',
    marginRight: 10,
    marginBottom: 10
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginBottom: 4
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.ink
  },
  statHelper: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginTop: 4
  },
  resultBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f5f9ff'
  },
  resultText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink,
    lineHeight: Math.round(typeScale.body * 1.3)
  },
  resultGroup: {
    marginTop: 10
  },
  resultLabel: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6
  },
  directoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#edf2f8'
  },
  directoryText: {
    flex: 1,
    paddingRight: 10
  },
  directoryName: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    fontWeight: '600',
    color: colors.ink
  },
  callPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#e7f2ff',
    borderWidth: 1,
    borderColor: '#c9e3ff'
  },
  callPillText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.ink,
    fontWeight: '600'
  },
  facilitySubsection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#edf2f8'
  },
  facilitySubheading: {
    fontFamily: fonts.display,
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6
  },
  tabsRow: {
    marginVertical: 10
  },
  tableBlock: {
    marginBottom: 12
  },
  tableTitle: {
    fontFamily: fonts.display,
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 6
  },
  imageRow: {
    marginTop: 10
  },
  referenceImage: {
    width: '100%',
    height: 220
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#edf2f8'
  },
  contactText: {
    flex: 1,
    paddingRight: 10
  },
  contactMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginTop: 2
  },
  contactPhone: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.ink,
    marginTop: 4
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap'
  },
  actionChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#e7f2ff',
    borderWidth: 1,
    borderColor: '#c9e3ff',
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionIconChip: {
    width: 40,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 12,
    position: 'relative',
    marginRight: 8,
    marginBottom: 0
  },
  actionChipDisabled: {
    opacity: 0.55
  },
  actionChipText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    fontWeight: '600',
    color: colors.ink
  },
  actionTooltip: {
    position: 'absolute',
    bottom: 46,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: colors.panel,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    zIndex: 10
  },
  actionTooltipText: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: '#ffffff',
    maxWidth: 160
  },
  perfectServeIcon: {
    width: 18,
    height: 18
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#edf2f8'
  },
  gradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e7f2ff',
    borderWidth: 1,
    borderColor: '#c9e3ff',
    marginRight: 10
  },
  gradeBadgeText: {
    fontFamily: fonts.display,
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.ink
  },
  gradeBody: {
    flex: 1
  },
  treeNode: {
    marginBottom: 8
  },
  treeNodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  treeNodeText: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    color: colors.ink,
    flex: 1,
    paddingRight: 8
  },
  treeToggle: {
    fontFamily: fonts.display,
    fontSize: typeScale.subhead,
    fontWeight: '700',
    color: colors.accentStrong
  },
  treeOutcome: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    color: colors.muted,
    marginBottom: 6
  },
  treeChildren: {
    marginTop: 4
  },
  emphasis: {
    fontWeight: '700',
    color: colors.ink
  },
  faqCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f7fbff',
    marginBottom: 10
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  faqQuestion: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    fontWeight: '700',
    color: colors.ink,
    flex: 1,
    paddingRight: 8
  },
  tableCellWide: {
    minWidth: 160
  }
});
