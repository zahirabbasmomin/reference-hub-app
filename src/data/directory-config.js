const normalize = (value = '') => value.toLowerCase().replace(/\s+/g, ' ').trim();

const ctPattern = /\bCT\b/i;
const computedPattern = /\bcomputed\b/i;
const tomographyPattern = /\btomography\b/i;
const computedTomographyPattern = /\bcomputed\s+tomography\b/i;

const mriPattern = /\bMRI\b/i;
const mrPattern = /\bM\.?\s?R\.?\b/i;

const usPattern = /\bUS\b/i;
const ultrasoundPattern = /\bultrasound\b/i;

const xrayPattern = /\bx-?ray\b/i;

const nmPattern = /\bNM\b/i;
const nuclearPattern = /\bnuclear\b/i;

const erPattern = /\bER\b/i;
const emergencyPattern = /\bemergency\b/i;

const matchAny = (value, patterns) => patterns.some((pattern) => pattern.test(value));

export const directoryConfigs = {
  'directory-master': {
    title: 'Phone Directory',
    mode: 'all'
  },
  'directory-er': {
    title: 'ER Numbers',
    mode: 'modality',
    filter: (name) => matchAny(normalize(name), [erPattern, emergencyPattern])
  },
  'directory-ct': {
    title: 'CT Numbers',
    mode: 'modality',
    filter: (name) =>
      matchAny(normalize(name), [ctPattern, computedTomographyPattern, computedPattern, tomographyPattern])
  },
  'directory-mri': {
    title: 'MRI Numbers',
    mode: 'modality',
    filter: (name) => matchAny(normalize(name), [mriPattern, mrPattern])
  },
  'directory-us': {
    title: 'Ultrasound Numbers',
    mode: 'modality',
    filter: (name) => matchAny(normalize(name), [usPattern, ultrasoundPattern])
  },
  'directory-xray': {
    title: 'X-Ray Numbers',
    mode: 'modality',
    filter: (name) => matchAny(normalize(name), [xrayPattern])
  },
  'directory-nm': {
    title: 'Nuclear Medicine Numbers',
    mode: 'modality',
    filter: (name) => matchAny(normalize(name), [nmPattern, nuclearPattern])
  },
  'directory-cobb': {
    title: 'Cobb Hospital',
    mode: 'facility',
    facility: 'Cobb Hospital'
  },
  'directory-kennestone': {
    title: 'Kennestone Hospital',
    mode: 'facility',
    facility: 'Kennestone Hospital'
  },
  'directory-douglas': {
    title: 'Douglas Hospital',
    mode: 'facility',
    facility: 'Douglas Hospital'
  },
  'directory-paulding': {
    title: 'Paulding Hospital',
    mode: 'facility',
    facility: 'Paulding Hospital'
  },
  'directory-north-fulton': {
    title: 'North Fulton Hospital',
    mode: 'facility',
    facility: 'North Fulton Hospital'
  }
};

export const directoryDefaults = {
  'directory-master': 'Phone Directory'
};
